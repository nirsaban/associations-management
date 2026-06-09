import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Production seed — additive, idempotent operations only.
 * Safe to run multiple times on a live database.
 *
 * Contents:
 *  1. SUPER_ADMIN upsert
 *  2. Manager-memberships backfill (so multi-manager feature works for existing
 *     groups whose primary Group.managerUserId lacks a MANAGER membership row).
 */
async function main() {
  await upsertSuperAdmin();
  await backfillManagerMemberships();
}

async function upsertSuperAdmin() {
  console.log('Production seed — creating SUPER_ADMIN...');

  const superAdmin = await prisma.user.upsert({
    where: {
      // Use a unique lookup — phone is unique per org, but SUPER_ADMIN has no org
      id: 'super-admin-prod',
    },
    update: {
      fullName: 'ניר סבן',
      phone: '0501111111',
      isActive: true,
    },
    create: {
      id: 'super-admin-prod',
      phone: '0501111111',
      fullName: 'ניר סבן',
      email: 'nir@amutot.cloud',
      platformRole: 'SUPER_ADMIN',
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  console.log('');
  console.log('========================================');
  console.log('SUPER_ADMIN created successfully');
  console.log('========================================');
  console.log(`  Phone: ${superAdmin.phone}`);
  console.log(`  Name:  ${superAdmin.fullName}`);
  console.log(`  Role:  ${superAdmin.platformRole}`);
  console.log(`  ID:    ${superAdmin.id}`);
}

/**
 * For every Group with a primary managerUserId set, ensure a matching
 * GroupMembership exists with role=MANAGER + status=ACTIVE. Without this row,
 * the multi-manager UI would report the primary as "not a manager".
 *
 * Idempotent: existing rows are upserted (no duplicates created).
 */
async function backfillManagerMemberships() {
  console.log('');
  console.log('========================================');
  console.log('Backfilling MANAGER memberships for primary managers...');
  console.log('========================================');

  const groupsWithPrimary = await prisma.group.findMany({
    where: { managerUserId: { not: null }, deletedAt: null },
    select: { id: true, organizationId: true, managerUserId: true, name: true },
  });

  let upserted = 0;
  let alreadyOk = 0;
  for (const g of groupsWithPrimary) {
    if (!g.managerUserId) continue;
    const existing = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: g.managerUserId } },
      select: { role: true, status: true },
    });
    if (existing && existing.role === 'MANAGER' && existing.status === 'ACTIVE') {
      alreadyOk++;
      continue;
    }
    await prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId: g.id, userId: g.managerUserId } },
      update: { role: 'MANAGER', status: 'ACTIVE' },
      create: {
        organizationId: g.organizationId,
        groupId: g.id,
        userId: g.managerUserId,
        role: 'MANAGER',
        status: 'ACTIVE',
      },
    });
    upserted++;
    console.log(`  + Backfilled MANAGER membership for group "${g.name}" (id=${g.id})`);
  }

  console.log(`Backfill complete: ${upserted} fixed, ${alreadyOk} already correct.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
