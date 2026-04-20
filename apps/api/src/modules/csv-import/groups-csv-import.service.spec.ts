import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GroupsCsvImportService } from './groups-csv-import.service';

const prisma = new PrismaClient();

let orgBId: string;
let orgAId: string;
let service: GroupsCsvImportService;

beforeAll(async () => {
  await prisma.$connect();

  // Org B has setupCompleted=true, use it for tests
  const orgB = await prisma.organization.findFirst({
    where: { setupCompleted: true, deletedAt: null },
  });
  expect(orgB).toBeTruthy();
  orgBId = orgB!.id;

  const orgA = await prisma.organization.findFirst({
    where: { setupCompleted: false, deletedAt: null },
  });
  expect(orgA).toBeTruthy();
  orgAId = orgA!.id;

  // Create service with prisma
  service = new GroupsCsvImportService(prisma as any);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Groups CSV Validate', () => {
  it('validates a valid CSV with existing manager', async () => {
    // Get a user from orgB
    const user = await prisma.user.findFirst({
      where: { organizationId: orgBId, systemRole: 'USER', deletedAt: null },
    });
    expect(user).toBeTruthy();

    const csv = `groupName,phoneManager,groupMembers,familiesWhoCare\nקבוצת טסט,${user!.phone},,`;
    const result = await service.validateGroups(orgBId, csv);

    expect(result.summary.totalRows).toBe(1);
    expect(result.rows[0].status).not.toBe('error');
  });

  it('errors when phoneManager not in org', async () => {
    const csv = `groupName,phoneManager,groupMembers,familiesWhoCare\nקבוצה,0599999999,,`;
    const result = await service.validateGroups(orgBId, csv);

    expect(result.rows[0].status).toBe('error');
    expect(result.rows[0].errors[0].field).toBe('phoneManager');
  });

  it('warns when member phone not in org (skipped, not error)', async () => {
    const manager = await prisma.user.findFirst({
      where: { organizationId: orgBId, systemRole: 'USER', deletedAt: null },
    });

    const csv = `groupName,phoneManager,groupMembers,familiesWhoCare\nקבוצה,${manager!.phone},"0599999998",`;
    const result = await service.validateGroups(orgBId, csv);

    expect(result.rows[0].status).toBe('valid_with_warnings');
    expect(result.rows[0].warnings.some((w) => w.includes('לא נמצא'))).toBe(true);
    expect(result.summary.skippedMemberPhones).toBe(1);
  });

  it('merges rows with same groupName', async () => {
    const users = await prisma.user.findMany({
      where: { organizationId: orgBId, systemRole: 'USER', deletedAt: null },
      take: 3,
    });
    expect(users.length).toBeGreaterThanOrEqual(2);

    const csv = [
      'groupName,phoneManager,groupMembers,familiesWhoCare',
      `קבוצת מיזוג,${users[0].phone},"${users[1].phone}",`,
      `קבוצת מיזוג,${users[1].phone},"${users[0].phone}",`,
    ].join('\n');

    const result = await service.validateGroups(orgBId, csv);

    // Should produce 1 merged row, not 2
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].warnings.some((w) => w.includes('מוזגו'))).toBe(true);
    // 2nd row's manager replaces 1st
    expect(result.rows[0].phoneManager).toContain(users[1].phone.replace(/^0/, '+972'));
  });

  it('warns when existing group will be updated', async () => {
    // Get an existing group
    const group = await prisma.group.findFirst({
      where: { organizationId: orgBId, deletedAt: null },
    });
    const manager = await prisma.user.findFirst({
      where: { organizationId: orgBId, systemRole: 'USER', deletedAt: null },
    });
    expect(group).toBeTruthy();
    expect(manager).toBeTruthy();

    const csv = `groupName,phoneManager,groupMembers,familiesWhoCare\n${group!.name},${manager!.phone},,`;
    const result = await service.validateGroups(orgBId, csv);

    expect(result.rows[0].warnings.some((w) => w.includes('קיימת תעודכן'))).toBe(true);
    expect(result.summary.groupsToUpdate).toBe(1);
  });

  it('auto-creates families that do not exist', async () => {
    const manager = await prisma.user.findFirst({
      where: { organizationId: orgBId, systemRole: 'USER', deletedAt: null },
    });

    const csv = `groupName,phoneManager,groupMembers,familiesWhoCare\nקבוצה חדשה,${manager!.phone},,"משפחת נסיון חדש"`;
    const result = await service.validateGroups(orgBId, csv);

    expect(result.rows[0].families[0].action).toBe('auto_create');
    expect(result.summary.familiesToAutoCreate).toBe(1);
  });

  it('phoneManager from another org treated as not-in-org (error)', async () => {
    // Get a user from Org A
    const userA = await prisma.user.findFirst({
      where: { organizationId: orgAId, systemRole: 'ADMIN', deletedAt: null },
    });
    expect(userA).toBeTruthy();

    // Try to use them as manager in Org B
    const csv = `groupName,phoneManager,groupMembers,familiesWhoCare\nקבוצה,${userA!.phone},,`;
    const result = await service.validateGroups(orgBId, csv);

    expect(result.rows[0].status).toBe('error');
  });

  it('errors when groupName is empty', async () => {
    const csv = `groupName,phoneManager,groupMembers,familiesWhoCare\n,0501234567,,`;
    const result = await service.validateGroups(orgBId, csv);

    expect(result.rows[0].status).toBe('error');
    expect(result.rows[0].errors[0].field).toBe('groupName');
  });
});

describe('Groups CSV Commit', () => {
  it('creates group and links family in transaction', async () => {
    const manager = await prisma.user.findFirst({
      where: { organizationId: orgBId, systemRole: 'USER', deletedAt: null },
    });

    const csv = `groupName,phoneManager,groupMembers,familiesWhoCare\nקבוצת commit טסט,${manager!.phone},,"משפחת commit טסט"`;
    const validated = await service.validateGroups(orgBId, csv);
    const result = await service.commitGroups(orgBId, validated.rows);

    expect(result.groupsCreated).toBe(1);
    expect(result.familiesCreated).toBe(1);
    expect(result.managersAssigned).toBe(1);

    // Verify in DB
    const group = await prisma.group.findFirst({
      where: { organizationId: orgBId, name: 'קבוצת commit טסט', deletedAt: null },
    });
    expect(group).toBeTruthy();
    expect(group!.managerUserId).toBeTruthy();

    const family = await prisma.family.findFirst({
      where: { organizationId: orgBId, familyName: 'משפחת commit טסט', deletedAt: null },
    });
    expect(family).toBeTruthy();
    expect(family!.groupId).toBe(group!.id);

    // Cleanup
    await prisma.groupMembership.deleteMany({ where: { groupId: group!.id } });
    await prisma.family.deleteMany({ where: { id: family!.id } });
    await prisma.group.deleteMany({ where: { id: group!.id } });
  });
});
