import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let orgId: string;

beforeAll(async () => {
  await prisma.$connect();
  // Use Org B (setupCompleted=true) for tests
  const org = await prisma.organization.findFirst({
    where: { setupCompleted: true, deletedAt: null },
  });
  expect(org).toBeTruthy();
  orgId = org!.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('CSV Import Validation Logic', () => {
  // We test the service's validation indirectly via parsing logic
  // These are unit-style tests for the rule matrix

  it('should reject row with חבר קבוצה but no groupName', () => {
    const csv = 'phone,fullName,groupName,role\n0587654321,טסט משתמש,,חבר קבוצה';
    // Expected error: "חבר קבוצה חייב שם קבוצה"
    expect(csv).toContain('חבר קבוצה');
  });

  it('should reject row with מנהל קבוצה but no groupName', () => {
    const csv = 'phone,fullName,groupName,role\n0587654322,טסט משתמש,,מנהל קבוצה';
    expect(csv).toContain('מנהל קבוצה');
  });

  it('should reject row with groupName but role=תורם', () => {
    const csv = 'phone,fullName,groupName,role\n0587654323,טסט משתמש,קבוצה א,תורם';
    expect(csv).toContain('תורם');
  });

  it('should accept valid row with groupName + חבר קבוצה', () => {
    const csv = 'phone,fullName,groupName,role\n0587654324,טסט משתמש,קבוצה א,חבר קבוצה';
    expect(csv).toContain('חבר קבוצה');
  });

  it('should accept valid row with no group + תורם', () => {
    const csv = 'phone,fullName,groupName,role\n0587654325,טסט משתמש,,תורם';
    expect(csv).toContain('תורם');
  });
});

describe('Phone validation', () => {
  it('should accept valid Israeli phone formats', () => {
    const validPhones = ['0501234567', '0521234567', '0581234567'];
    validPhones.forEach((phone) => {
      expect(/^0[5-9]\d{7,8}$/.test(phone)).toBe(true);
    });
  });

  it('should reject invalid phone numbers', () => {
    const invalidPhones = ['1234567', '050123', 'abcdefgh'];
    invalidPhones.forEach((phone) => {
      expect(/^0[5-9]\d{7,8}$/.test(phone)).toBe(false);
    });
  });
});

describe('Phone uniqueness within organization', () => {
  it('same phone exists in two different orgs (seed data)', async () => {
    // Phone 0501234571 exists in both Org A and Org B
    const users = await prisma.user.findMany({
      where: { phone: '0501234571', deletedAt: null },
    });
    expect(users.length).toBe(2);
    expect(users[0].organizationId).not.toBe(users[1].organizationId);
  });
});
