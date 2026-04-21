import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Production seed — creates only the SUPER_ADMIN user.
 * Safe to run multiple times (upsert by phone).
 */
async function main() {
  console.log('Production seed — creating SUPER_ADMIN...');

  const superAdmin = await prisma.user.upsert({
    where: {
      // Use a unique lookup — phone is unique per org, but SUPER_ADMIN has no org
      id: 'super-admin-prod',
    },
    update: {
      fullName: 'ניר סבן',
      phone: '0542603498',
      isActive: true,
    },
    create: {
      id: 'super-admin-prod',
      phone: '0542603498',
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

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
