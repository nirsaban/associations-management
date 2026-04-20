import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let orgA: { id: string; name: string; setupCompleted: boolean };
let adminA: { id: string; organizationId: string | null };
let orgB: { id: string; name: string; setupCompleted: boolean };

beforeAll(async () => {
  await prisma.$connect();
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'asc' },
    where: { deletedAt: null },
  });
  orgA = orgs[0] as typeof orgA;
  orgB = orgs[1] as typeof orgB;

  adminA = (await prisma.user.findFirst({
    where: { organizationId: orgA.id, systemRole: 'ADMIN', deletedAt: null },
  }))!;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Onboarding seed state', () => {
  it('Org A should have setupCompleted=false', () => {
    expect(orgA.setupCompleted).toBe(false);
  });

  it('Org B should have setupCompleted=true', () => {
    expect(orgB.setupCompleted).toBe(true);
  });
});

describe('Organization model has onboarding fields', () => {
  it('should have description, paymentLink, paymentDescription columns', async () => {
    const org = await prisma.organization.findFirst({
      where: { id: orgA.id },
    });
    expect(org).toBeTruthy();
    // These fields exist on the model (nullable)
    expect('description' in org!).toBe(true);
    expect('paymentLink' in org!).toBe(true);
    expect('paymentDescription' in org!).toBe(true);
    expect('facebookUrl' in org!).toBe(true);
    expect('instagramUrl' in org!).toBe(true);
    expect('whatsappUrl' in org!).toBe(true);
    expect('websiteUrl' in org!).toBe(true);
  });
});

describe('Admin access', () => {
  it('admin of Org A exists and is ADMIN role', () => {
    expect(adminA).toBeTruthy();
    expect(adminA.organizationId).toBe(orgA.id);
  });
});
