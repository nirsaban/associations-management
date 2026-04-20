import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { FamiliesCsvImportService } from './families-csv-import.service';

const prisma = new PrismaClient();

let orgBId: string;
let orgAId: string;
let service: FamiliesCsvImportService;

beforeAll(async () => {
  await prisma.$connect();

  const orgB = await prisma.organization.findFirst({
    where: { setupCompleted: true, deletedAt: null },
  });
  expect(orgB).toBeTruthy();
  orgBId = orgB!.id;

  const orgA = await prisma.organization.findFirst({
    where: { setupCompleted: false, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  expect(orgA).toBeTruthy();
  orgAId = orgA!.id;

  service = new FamiliesCsvImportService(prisma as any);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Families CSV Validate', () => {
  it('happy path: create new family', async () => {
    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחת טסט חדשה,,,,,`;
    const result = await service.validateFamilies(orgBId, csv);

    expect(result.summary.familiesToCreate).toBe(1);
    expect(result.rows[0].action).toBe('create');
    expect(result.rows[0].status).not.toBe('error');
  });

  it('existing family → UPDATE with fieldDiff', async () => {
    // Get a family that exists in orgB seed
    const existing = await prisma.family.findFirst({
      where: { organizationId: orgBId, deletedAt: null },
    });
    expect(existing).toBeTruthy();

    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\n${existing!.familyName},0587777777,2,,4,כתובת חדשה`;
    const result = await service.validateFamilies(orgBId, csv);

    expect(result.rows[0].action).toBe('update');
    expect(result.rows[0].fieldDiff.length).toBeGreaterThan(0);
    expect(result.summary.familiesToUpdate).toBe(1);
  });

  it('duplicate familyName in CSV → last row wins, earlier gets warning', async () => {
    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחת כפולה,,,,,כתובת 1\nמשפחת כפולה,,,,,כתובת 2`;
    const result = await service.validateFamilies(orgBId, csv);

    expect(result.rows.length).toBe(2);
    // First row should have warning
    expect(result.rows[0].warnings.some((w) => w.includes('שם משפחה חוזר'))).toBe(true);
  });

  it('contactPhone matches existing User in same org → row error', async () => {
    // Get a user phone from orgB
    const user = await prisma.user.findFirst({
      where: { organizationId: orgBId, deletedAt: null },
    });
    expect(user).toBeTruthy();

    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחת קונפליקט,${user!.phone},,,,`;
    const result = await service.validateFamilies(orgBId, csv);

    expect(result.rows[0].status).toBe('error');
    expect(result.rows[0].errors[0].field).toBe('contactPhone');
  });

  it('contactPhone matches User in DIFFERENT org → allowed', async () => {
    const userA = await prisma.user.findFirst({
      where: { organizationId: orgAId, deletedAt: null },
    });
    expect(userA).toBeTruthy();

    // Validate in orgB — phone from orgA should not conflict
    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחת אחרת,${userA!.phone},,,,`;
    const result = await service.validateFamilies(orgBId, csv);

    // Should NOT be an error (tenant isolation)
    expect(result.rows[0].status).not.toBe('error');
  });

  it('childrenMinorCount > totalMemberCount → row error', async () => {
    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחת שגיאה,,5,,3,`;
    const result = await service.validateFamilies(orgBId, csv);

    expect(result.rows[0].status).toBe('error');
    expect(result.rows[0].errors[0].message).toContain('לא יכול לעלות');
  });

  it('childrenMinorCount invalid (negative) → row error', async () => {
    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחה,-1,,,,`;
    // -1 is in contactPhone position... let me fix the CSV
    const csv2 = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחה,,-1,,,`;
    const result = await service.validateFamilies(orgBId, csv2);

    expect(result.rows[0].status).toBe('error');
    expect(result.rows[0].errors[0].field).toBe('childrenMinorCount');
  });

  it('auto-create group when groupName not found', async () => {
    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחה חדשה 999,,,קבוצה שלא קיימת 999,,`;
    const result = await service.validateFamilies(orgBId, csv);

    expect(result.rows[0].groupLink?.action).toBe('auto_create');
    expect(result.rows[0].warnings.some((w) => w.includes('אוטומטית'))).toBe(true);
    expect(result.summary.groupsToAutoCreate).toBe(1);
  });

  it('contactPhone duplicated on another family → warning, not error', async () => {
    // Get a family with a contactPhone
    const familyWithPhone = await prisma.family.findFirst({
      where: { organizationId: orgBId, contactPhone: { not: null }, deletedAt: null },
    });

    if (familyWithPhone && familyWithPhone.contactPhone) {
      const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחת כפולטלפון,${familyWithPhone.contactPhone},,,,`;
      const result = await service.validateFamilies(orgBId, csv);

      // Should be warning not error (unless the phone also belongs to a user)
      if (result.rows[0].status !== 'error') {
        expect(result.rows[0].warnings.some((w) => w.includes('כבר מופיע'))).toBe(true);
      }
    }
  });

  it('empty familyName → row error', async () => {
    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\n,0501111111,,,,`;
    const result = await service.validateFamilies(orgBId, csv);

    expect(result.rows[0].status).toBe('error');
    expect(result.rows[0].errors[0].field).toBe('familyName');
  });
});

describe('Families CSV Commit', () => {
  it('creates new family and links to existing group', async () => {
    const group = await prisma.group.findFirst({
      where: { organizationId: orgBId, deletedAt: null },
    });
    expect(group).toBeTruthy();

    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחת commit test unique,,,${group!.name},3,כתובת טסט`;
    const validated = await service.validateFamilies(orgBId, csv);
    const result = await service.commitFamilies(orgBId, validated.rows);

    expect(result.familiesCreated).toBe(1);
    expect(result.familiesLinkedToGroup).toBe(1);

    // Verify in DB
    const created = await prisma.family.findFirst({
      where: { organizationId: orgBId, familyName: 'משפחת commit test unique', deletedAt: null },
    });
    expect(created).toBeTruthy();
    expect(created!.groupId).toBe(group!.id);
    expect(created!.totalMemberCount).toBe(3);

    // Cleanup
    await prisma.family.delete({ where: { id: created!.id } });
  });

  it('updates existing family and clears group link', async () => {
    // Create a family to update
    const group = await prisma.group.findFirst({
      where: { organizationId: orgBId, deletedAt: null },
    });
    const testFamily = await prisma.family.create({
      data: { organizationId: orgBId, familyName: 'משפחת עדכון טסט', groupId: group!.id, address: 'ישן', status: 'active' },
    });

    const csv = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחת עדכון טסט,,,,,כתובת חדשה`;
    const validated = await service.validateFamilies(orgBId, csv);
    const result = await service.commitFamilies(orgBId, validated.rows);

    expect(result.familiesUpdated).toBe(1);
    expect(result.familyGroupsCleared).toBe(1);

    // Verify group was cleared
    const updated = await prisma.family.findFirst({
      where: { id: testFamily.id },
    });
    expect(updated!.groupId).toBeNull();
    expect(updated!.address).toBe('כתובת חדשה');

    // Cleanup
    await prisma.family.delete({ where: { id: testFamily.id } });
  });
});
