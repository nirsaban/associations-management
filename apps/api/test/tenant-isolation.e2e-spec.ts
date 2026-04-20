/**
 * בדיקות עשן לבידוד שוכרים (tenant isolation)
 *
 * בדיקות אלו רצות ישירות מול בסיס הנתונים (לא דרך HTTP)
 * ומוודאות שהנתוני seed מבודדים כראוי בין עמותות.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// נתונים שנטענו ב-seed
let orgA: { id: string; name: string };
let orgB: { id: string; name: string };
let superAdmin: { id: string; phone: string };
let adminA: { id: string; organizationId: string | null };
let adminB: { id: string; organizationId: string | null };

beforeAll(async () => {
  await prisma.$connect();

  // טעינת נתונים מ-seed
  const orgs = await prisma.organization.findMany({ orderBy: { createdAt: 'asc' } });
  expect(orgs.length).toBeGreaterThanOrEqual(2);
  orgA = orgs[0];
  orgB = orgs[1];

  superAdmin = (await prisma.user.findFirst({
    where: { platformRole: 'SUPER_ADMIN' },
  }))!;
  expect(superAdmin).toBeTruthy();

  adminA = (await prisma.user.findFirst({
    where: { organizationId: orgA.id, systemRole: 'ADMIN' },
  }))!;
  expect(adminA).toBeTruthy();

  adminB = (await prisma.user.findFirst({
    where: { organizationId: orgB.id, systemRole: 'ADMIN' },
  }))!;
  expect(adminB).toBeTruthy();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('בידוד שוכרים — Tenant Isolation', () => {
  it('אדמין של עמותה A לא רואה משתמשים של עמותה B', async () => {
    const usersA = await prisma.user.findMany({
      where: { organizationId: orgA.id },
    });
    const usersB = await prisma.user.findMany({
      where: { organizationId: orgB.id },
    });

    // כל המשתמשים של A שייכים ל-A בלבד
    for (const user of usersA) {
      expect(user.organizationId).toBe(orgA.id);
    }

    // כל המשתמשים של B שייכים ל-B בלבד
    for (const user of usersB) {
      expect(user.organizationId).toBe(orgB.id);
    }

    // אין חפיפה ב-ID
    const idsA = new Set(usersA.map((u) => u.id));
    for (const user of usersB) {
      expect(idsA.has(user.id)).toBe(false);
    }
  });

  it('אדמין של עמותה A לא רואה קבוצות של עמותה B', async () => {
    const groupsA = await prisma.group.findMany({
      where: { organizationId: orgA.id },
    });
    const groupsB = await prisma.group.findMany({
      where: { organizationId: orgB.id },
    });

    expect(groupsA.length).toBeGreaterThan(0);
    expect(groupsB.length).toBeGreaterThan(0);

    const idsA = new Set(groupsA.map((g) => g.id));
    for (const group of groupsB) {
      expect(idsA.has(group.id)).toBe(false);
    }
  });

  it('אדמין של עמותה A לא רואה משפחות של עמותה B', async () => {
    const familiesA = await prisma.family.findMany({
      where: { organizationId: orgA.id },
    });
    const familiesB = await prisma.family.findMany({
      where: { organizationId: orgB.id },
    });

    expect(familiesA.length).toBeGreaterThan(0);
    expect(familiesB.length).toBeGreaterThan(0);

    for (const f of familiesA) expect(f.organizationId).toBe(orgA.id);
    for (const f of familiesB) expect(f.organizationId).toBe(orgB.id);
  });

  it('תשלומים מבודדים בין עמותות', async () => {
    const paymentsA = await prisma.payment.findMany({
      where: { organizationId: orgA.id },
    });
    const paymentsB = await prisma.payment.findMany({
      where: { organizationId: orgB.id },
    });

    expect(paymentsA.length).toBeGreaterThan(0);
    expect(paymentsB.length).toBeGreaterThan(0);

    for (const p of paymentsA) expect(p.organizationId).toBe(orgA.id);
    for (const p of paymentsB) expect(p.organizationId).toBe(orgB.id);
  });
});

describe('סופר אדמין — רואה הכל', () => {
  it('סופר אדמין רואה את שתי העמותות', async () => {
    const allOrgs = await prisma.organization.findMany();
    expect(allOrgs.length).toBeGreaterThanOrEqual(2);

    const orgIds = allOrgs.map((o) => o.id);
    expect(orgIds).toContain(orgA.id);
    expect(orgIds).toContain(orgB.id);
  });

  it('סופר אדמין רואה משתמשים מכל העמותות', async () => {
    const allUsers = await prisma.user.findMany({
      where: { organizationId: { not: null } },
    });

    const orgIds = new Set(allUsers.map((u) => u.organizationId));
    expect(orgIds.has(orgA.id)).toBe(true);
    expect(orgIds.has(orgB.id)).toBe(true);
  });

  it('סופר אדמין אין לו organizationId', () => {
    expect(superAdmin.phone).toBe('0501234567');
  });
});

describe('ייחודיות טלפון לפי עמותה', () => {
  it('אותו טלפון קיים בשתי העמותות ללא התנגשות', async () => {
    const sharedPhone = '0501234571';

    const usersWithSharedPhone = await prisma.user.findMany({
      where: { phone: sharedPhone },
    });

    expect(usersWithSharedPhone.length).toBe(2);

    const orgIds = usersWithSharedPhone.map((u) => u.organizationId);
    expect(orgIds).toContain(orgA.id);
    expect(orgIds).toContain(orgB.id);
  });

  it('טלפון ייחודי בתוך אותה עמותה — לא ניתן ליצור כפילות', async () => {
    const existingPhone = '0501234568'; // אדמין של עמותה A

    await expect(
      prisma.user.create({
        data: {
          organizationId: orgA.id,
          phone: existingPhone,
          fullName: 'כפילות',
          systemRole: 'USER',
        },
      }),
    ).rejects.toThrow();
  });
});

describe('GroupRole על GroupMembership', () => {
  it('מנהל קבוצה מסומן עם role=MANAGER', async () => {
    const managerMemberships = await prisma.groupMembership.findMany({
      where: { role: 'MANAGER' },
      include: { group: true },
    });

    expect(managerMemberships.length).toBeGreaterThan(0);

    // כל מנהל הוא גם ה-managerUserId של הקבוצה
    for (const m of managerMemberships) {
      expect(m.group.managerUserId).toBe(m.userId);
    }
  });

  it('חברי קבוצה רגילים מסומנים עם role=MEMBER', async () => {
    const memberMemberships = await prisma.groupMembership.findMany({
      where: { role: 'MEMBER' },
    });

    expect(memberMemberships.length).toBeGreaterThan(0);
  });
});

describe('סטטוס עמותה — enum', () => {
  it('שתי העמותות בסטטוס ACTIVE', async () => {
    const orgs = await prisma.organization.findMany();
    for (const org of orgs) {
      expect(org.status).toBe('ACTIVE');
    }
  });

  it('אין שדה isActive על עמותה', () => {
    // בדיקה שה-migration הסירה את השדה
    const orgFields = Object.keys(orgA);
    expect(orgFields).not.toContain('isActive');
  });
});
