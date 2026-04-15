import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Comprehensive seed data for Amutot platform testing
 *
 * Creates:
 * - 1 SUPER_ADMIN user
 * - 1 demo organization (עמותת הדגמה)
 * - 1 org ADMIN
 * - 5+ regular users
 * - 1 group manager
 * - 2 groups with members
 * - 3 families
 * - Weekly orders for current week
 * - Weekly distributor assignment
 * - Payments across 3 months
 * - Notifications
 */

function getCurrentWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthKey(monthsAgo: number = 0): string {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function main() {
  console.log('Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  console.log('Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.paymentReminder.deleteMany();
  await prisma.monthlyPaymentStatus.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.weeklyDistributorAssignment.deleteMany();
  await prisma.weeklyOrder.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.family.deleteMany();
  await prisma.group.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Creating SUPER_ADMIN user...');

  // Create SUPER_ADMIN (no organization)
  const superAdmin = await prisma.user.create({
    data: {
      phone: '0501234567',
      fullName: 'מנהל פלטפורמה',
      email: 'superadmin@amutot.app',
      platformRole: 'SUPER_ADMIN',
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  console.log(`Created SUPER_ADMIN: ${superAdmin.phone}`);

  console.log('Creating demo organization...');

  // Create demo organization
  const demoOrg = await prisma.organization.create({
    data: {
      name: 'עמותת הדגמה',
      slug: 'demo-org',
      contactPhone: '025812345',
      contactEmail: 'info@demo-org.org.il',
      address: 'רחוב הרצל 1, תל אביב',
      isActive: true,
      setupCompleted: true,
      createdBySuperAdminId: superAdmin.id,
      settings: {
        monthlyPaymentAmount: 150,
        weeklyDistributionDay: 'THURSDAY',
      },
    },
  });

  console.log(`Created organization: ${demoOrg.name}`);

  console.log('Creating organization admin...');

  // Create org ADMIN
  const orgAdmin = await prisma.user.create({
    data: {
      organizationId: demoOrg.id,
      phone: '0501234568',
      fullName: 'ישראל מנהל',
      email: 'admin@demo-org.org.il',
      systemRole: 'ADMIN',
      isActive: true,
      registrationCompleted: true,
    },
  });

  console.log('Creating group manager...');

  // Group manager user
  const groupManager = await prisma.user.create({
    data: {
      organizationId: demoOrg.id,
      phone: '0501234569',
      fullName: 'דוד מנהל קבוצה',
      email: 'manager@demo-org.org.il',
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  const groupManager2 = await prisma.user.create({
    data: {
      organizationId: demoOrg.id,
      phone: '0501234570',
      fullName: 'שרה מנהלת קבוצה',
      email: 'manager2@demo-org.org.il',
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  console.log('Creating regular users...');

  // Regular users
  const user1 = await prisma.user.create({
    data: {
      organizationId: demoOrg.id,
      phone: '0501234571',
      fullName: 'יוסף כהן',
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      organizationId: demoOrg.id,
      phone: '0501234572',
      fullName: 'רחל לוי',
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      organizationId: demoOrg.id,
      phone: '0501234573',
      fullName: 'משה ישראלי',
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  const user4 = await prisma.user.create({
    data: {
      organizationId: demoOrg.id,
      phone: '0501234574',
      fullName: 'מרים אברהם',
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  const user5 = await prisma.user.create({
    data: {
      organizationId: demoOrg.id,
      phone: '0501234575',
      fullName: 'יצחק שפירו',
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: false, // Unpaid/inactive user
    },
  });

  console.log('Creating groups...');

  // Create groups
  const group1 = await prisma.group.create({
    data: {
      organizationId: demoOrg.id,
      name: 'קבוצה א\'',
      managerUserId: groupManager.id,
      isActive: true,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      organizationId: demoOrg.id,
      name: 'קבוצה ב\'',
      managerUserId: groupManager2.id,
      isActive: true,
    },
  });

  console.log('Creating group memberships...');

  // Group 1 memberships
  await prisma.groupMembership.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group1.id,
      userId: groupManager.id,
      status: 'ACTIVE',
    },
  });

  await prisma.groupMembership.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group1.id,
      userId: user1.id,
      status: 'ACTIVE',
    },
  });

  await prisma.groupMembership.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group1.id,
      userId: user2.id,
      status: 'ACTIVE',
    },
  });

  await prisma.groupMembership.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group1.id,
      userId: user5.id,
      status: 'ACTIVE',
    },
  });

  // Group 2 memberships
  await prisma.groupMembership.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group2.id,
      userId: groupManager2.id,
      status: 'ACTIVE',
    },
  });

  await prisma.groupMembership.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group2.id,
      userId: user3.id,
      status: 'ACTIVE',
    },
  });

  await prisma.groupMembership.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group2.id,
      userId: user4.id,
      status: 'ACTIVE',
    },
  });

  console.log('Creating families...');

  const family1 = await prisma.family.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group1.id,
      familyName: 'משפחת כהן',
      contactName: 'יעקב כהן',
      address: 'רחוב ביאליק 5, תל אביב',
      contactPhone: '0521234567',
      notes: 'אלרגיה לבוטנים',
      status: 'active',
    },
  });

  const family2 = await prisma.family.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group1.id,
      familyName: 'משפחת לוי',
      contactName: 'חנה לוי',
      address: 'שדרות רוטשילד 10, תל אביב',
      contactPhone: '0522234567',
      status: 'active',
    },
  });

  const family3 = await prisma.family.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group2.id,
      familyName: 'משפחת ישראלי',
      contactName: 'אברהם ישראלי',
      address: 'רחוב הנביאים 3, ירושלים',
      contactPhone: '0523234567',
      notes: 'יש לצלצל לפני הגעה',
      status: 'active',
    },
  });

  const weekKey = getCurrentWeekKey();
  console.log(`Creating weekly orders for week ${weekKey}...`);

  // Weekly orders for current week
  await prisma.weeklyOrder.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group1.id,
      familyId: family1.id,
      weekKey,
      createdByUserId: groupManager.id,
      shoppingListJson: [
        { item: 'לחם', quantity: 2, unit: 'יחידות' },
        { item: 'חלב', quantity: 3, unit: 'ליטר' },
        { item: 'ביצים', quantity: 12, unit: 'יחידות' },
      ],
      status: 'COMPLETED',
    },
  });

  await prisma.weeklyOrder.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group1.id,
      familyId: family2.id,
      weekKey,
      createdByUserId: groupManager.id,
      shoppingListJson: [
        { item: 'קמח', quantity: 1, unit: 'ק"ג' },
        { item: 'שמן', quantity: 1, unit: 'ליטר' },
      ],
      status: 'DRAFT',
    },
  });

  await prisma.weeklyOrder.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group2.id,
      familyId: family3.id,
      weekKey,
      createdByUserId: groupManager2.id,
      shoppingListJson: [
        { item: 'אורז', quantity: 2, unit: 'ק"ג' },
        { item: 'פסטה', quantity: 3, unit: 'חבילות' },
      ],
      status: 'COMPLETED',
    },
  });

  console.log('Creating weekly distributor assignment...');

  // Weekly distributor for current week
  await prisma.weeklyDistributorAssignment.create({
    data: {
      organizationId: demoOrg.id,
      groupId: group1.id,
      weekKey,
      assignedUserId: user1.id,
      assignedByUserId: groupManager.id,
    },
  });

  console.log('Creating payments across 3 months...');

  const currentMonth = getMonthKey(0);
  const lastMonth = getMonthKey(1);
  const twoMonthsAgo = getMonthKey(2);

  // Payments for user1 - paid all 3 months
  const payment1 = await prisma.payment.create({
    data: {
      organizationId: demoOrg.id,
      userId: user1.id,
      amount: 150,
      currency: 'ILS',
      monthKey: currentMonth,
      paymentDate: new Date(),
      source: 'bank_transfer',
      externalTransactionId: `txn-${currentMonth}-user1`,
      status: 'COMPLETED',
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      organizationId: demoOrg.id,
      userId: user1.id,
      amount: 150,
      currency: 'ILS',
      monthKey: lastMonth,
      paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      source: 'bank_transfer',
      externalTransactionId: `txn-${lastMonth}-user1`,
      status: 'COMPLETED',
    },
  });

  const payment3 = await prisma.payment.create({
    data: {
      organizationId: demoOrg.id,
      userId: user1.id,
      amount: 150,
      currency: 'ILS',
      monthKey: twoMonthsAgo,
      paymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      source: 'bank_transfer',
      externalTransactionId: `txn-${twoMonthsAgo}-user1`,
      status: 'COMPLETED',
    },
  });

  // Payments for user2 - paid last 2 months, not current
  const payment4 = await prisma.payment.create({
    data: {
      organizationId: demoOrg.id,
      userId: user2.id,
      amount: 150,
      currency: 'ILS',
      monthKey: lastMonth,
      paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      source: 'credit_card',
      externalTransactionId: `txn-${lastMonth}-user2`,
      status: 'COMPLETED',
    },
  });

  const payment5 = await prisma.payment.create({
    data: {
      organizationId: demoOrg.id,
      userId: user2.id,
      amount: 150,
      currency: 'ILS',
      monthKey: twoMonthsAgo,
      paymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      source: 'credit_card',
      externalTransactionId: `txn-${twoMonthsAgo}-user2`,
      status: 'COMPLETED',
    },
  });

  console.log('Creating monthly payment statuses...');

  // Monthly payment statuses - user1
  await prisma.monthlyPaymentStatus.create({
    data: {
      organizationId: demoOrg.id,
      userId: user1.id,
      monthKey: currentMonth,
      isPaid: true,
      paidAt: new Date(),
      paymentId: payment1.id,
      reminderCount: 0,
    },
  });

  await prisma.monthlyPaymentStatus.create({
    data: {
      organizationId: demoOrg.id,
      userId: user1.id,
      monthKey: lastMonth,
      isPaid: true,
      paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      paymentId: payment2.id,
      reminderCount: 0,
    },
  });

  await prisma.monthlyPaymentStatus.create({
    data: {
      organizationId: demoOrg.id,
      userId: user1.id,
      monthKey: twoMonthsAgo,
      isPaid: true,
      paidAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      paymentId: payment3.id,
      reminderCount: 0,
    },
  });

  // Monthly payment statuses - user2 (unpaid current month)
  await prisma.monthlyPaymentStatus.create({
    data: {
      organizationId: demoOrg.id,
      userId: user2.id,
      monthKey: currentMonth,
      isPaid: false,
      reminderCount: 1,
      lastReminderAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.monthlyPaymentStatus.create({
    data: {
      organizationId: demoOrg.id,
      userId: user2.id,
      monthKey: lastMonth,
      isPaid: true,
      paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      paymentId: payment4.id,
      reminderCount: 0,
    },
  });

  await prisma.monthlyPaymentStatus.create({
    data: {
      organizationId: demoOrg.id,
      userId: user2.id,
      monthKey: twoMonthsAgo,
      isPaid: true,
      paidAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      paymentId: payment5.id,
      reminderCount: 0,
    },
  });

  // user3, user4, user5 - unpaid current month
  await prisma.monthlyPaymentStatus.create({
    data: {
      organizationId: demoOrg.id,
      userId: user3.id,
      monthKey: currentMonth,
      isPaid: false,
      reminderCount: 2,
      lastReminderAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.monthlyPaymentStatus.create({
    data: {
      organizationId: demoOrg.id,
      userId: user4.id,
      monthKey: currentMonth,
      isPaid: false,
      reminderCount: 0,
    },
  });

  await prisma.monthlyPaymentStatus.create({
    data: {
      organizationId: demoOrg.id,
      userId: user5.id,
      monthKey: currentMonth,
      isPaid: false,
      reminderCount: 0,
    },
  });

  console.log('Creating payment reminders...');

  // Payment reminders
  await prisma.paymentReminder.create({
    data: {
      organizationId: demoOrg.id,
      userId: user2.id,
      monthKey: currentMonth,
      reminderNumber: 1,
      channel: 'PUSH',
      status: 'SENT',
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.paymentReminder.create({
    data: {
      organizationId: demoOrg.id,
      userId: user3.id,
      monthKey: currentMonth,
      reminderNumber: 1,
      channel: 'PUSH',
      status: 'SENT',
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.paymentReminder.create({
    data: {
      organizationId: demoOrg.id,
      userId: user3.id,
      monthKey: currentMonth,
      reminderNumber: 2,
      channel: 'WHATSAPP',
      status: 'SENT',
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Creating notifications...');

  // Notifications
  await prisma.notification.create({
    data: {
      organizationId: demoOrg.id,
      userId: user1.id,
      type: 'PAYMENT_RECEIVED',
      title: 'תשלום התקבל',
      body: 'תשלום חודשי עבור ' + currentMonth + ' התקבל בהצלחה',
      channel: 'PUSH',
      status: 'SENT',
      sentAt: new Date(),
      metadataJson: { monthKey: currentMonth },
    },
  });

  await prisma.notification.create({
    data: {
      organizationId: demoOrg.id,
      userId: user2.id,
      type: 'PAYMENT_DUE',
      title: 'תזכורת תשלום',
      body: 'תשלום חודשי עבור ' + currentMonth + ' עדיין לא שולם',
      channel: 'PUSH',
      status: 'SENT',
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      metadataJson: { monthKey: currentMonth },
    },
  });

  await prisma.notification.create({
    data: {
      organizationId: demoOrg.id,
      userId: groupManager.id,
      type: 'ORDER_CREATED',
      title: 'הזמנה שבועית',
      body: 'נדרש ליצור הזמנה שבועית עבור ' + weekKey,
      channel: 'PUSH',
      status: 'READ',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      metadataJson: { weekKey },
    },
  });

  await prisma.notification.create({
    data: {
      organizationId: demoOrg.id,
      userId: user1.id,
      type: 'DISTRIBUTION_STARTED',
      title: 'אתה המחלק השבועי',
      body: 'הוקצית כמחלק שבועי עבור ' + weekKey,
      channel: 'PUSH',
      status: 'SENT',
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      metadataJson: { weekKey, groupId: group1.id },
    },
  });

  console.log('Seed completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  SUPER_ADMIN: ${superAdmin.phone} (${superAdmin.fullName})`);
  console.log(`  Organization: ${demoOrg.name} (${demoOrg.slug})`);
  console.log(`  Org ADMIN: ${orgAdmin.phone} (${orgAdmin.fullName})`);
  console.log(`  Group Manager 1: ${groupManager.phone} (${groupManager.fullName})`);
  console.log(`  Group Manager 2: ${groupManager2.phone} (${groupManager2.fullName})`);
  console.log(`  Regular users: ${[user1, user2, user3, user4, user5].map(u => u.phone).join(', ')}`);
  console.log(`  Groups: ${group1.name}, ${group2.name}`);
  console.log(`  Families: ${family1.familyName}, ${family2.familyName}, ${family3.familyName}`);
  console.log(`  Current week: ${weekKey}`);
  console.log(`  Current month: ${currentMonth}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
