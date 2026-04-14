import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import type {
  SystemRole,
  GroupRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ReminderChannel,
  NotificationType,
} from '@prisma/client';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Comprehensive seed data for Amutot platform testing
 *
 * Creates:
 * - 2 Organizations
 * - Multiple users (admins, managers, regular users)
 * - Groups with managers and members
 * - Families assigned to groups
 * - Weekly orders (pending and completed)
 * - Weekly distributors
 * - Payments with various statuses
 * - Payment reminders
 * - Notifications
 * - Audit logs
 */

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in reverse order of dependencies)
  console.log('🗑️  Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentReminder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.weeklyDistributor.deleteMany();
  await prisma.weeklyOrder.deleteMany();
  await prisma.groupFamily.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.family.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // ============================================================================
  // SUPER ADMIN USER (Platform Administrator)
  // ============================================================================

  console.log('👑 Creating SUPER_ADMIN user...');
  const superAdmin = await prisma.user.create({
    data: {
      phone: '0500000000',
      fullName: 'Platform Administrator',
      email: 'super@amutot.platform',
      systemRole: 'SUPER_ADMIN',
      organizationId: null, // Not tied to any organization
      isActive: true,
      registrationCompleted: true,
    },
  });

  // ============================================================================
  // ORGANIZATION 1: עמותת צדקה (Tzedaka Org - Main test org)
  // ============================================================================

  console.log('📦 Creating Organization 1: עמותת צדקה...');
  const org1 = await prisma.organization.create({
    data: {
      name: 'עמותת צדקה',
      slug: 'tzedaka-org',
      phone: '025812345',
      email: 'info@tzedaka.org.il',
      address: 'רחוב הרב קוק 15, ירושלים',
      isActive: true,
      setupCompleted: true, // Fully set up organization
      settings: {
        weeklyDistributionDay: 'THURSDAY',
        defaultOrderItems: ['חלה', 'חלב', 'ביצים', 'שמן', 'סוכר', 'קמח'],
        monthlyPaymentAmount: 150,
      },
    },
  });

  // Users for Organization 1
  console.log('👥 Creating users for Organization 1...');

  const admin1 = await prisma.user.create({
    data: {
      organizationId: org1.id,
      phone: '0501234567',
      fullName: 'דוד כהן',
      email: 'david@tzedaka.org.il',
      systemRole: 'ADMIN' as SystemRole,
      isActive: true,
      registrationCompleted: true,
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      organizationId: org1.id,
      phone: '0502345678',
      fullName: 'שרה לוי',
      email: 'sara@tzedaka.org.il',
      systemRole: 'USER' as SystemRole,
      isActive: true,
      registrationCompleted: true,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      organizationId: org1.id,
      phone: '0503456789',
      fullName: 'משה אברהם',
      systemRole: 'USER' as SystemRole,
      isActive: true,
      registrationCompleted: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      organizationId: org1.id,
      phone: '0504567890',
      fullName: 'רחל גולדשטיין',
      systemRole: 'USER' as SystemRole,
      isActive: true,
      registrationCompleted: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      organizationId: org1.id,
      phone: '0505678901',
      fullName: 'יוסף ברקוביץ',
      systemRole: 'USER' as SystemRole,
      isActive: true,
      registrationCompleted: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      organizationId: org1.id,
      phone: '0506789012',
      fullName: 'מרים פרידמן',
      systemRole: 'USER' as SystemRole,
      isActive: true,
      registrationCompleted: false, // Not completed registration
    },
  });

  // Groups for Organization 1
  console.log('🏘️  Creating groups for Organization 1...');

  const group1 = await prisma.group.create({
    data: {
      organizationId: org1.id,
      name: 'רמת שלמה',
      managerId: manager1.id,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      organizationId: org1.id,
      name: 'גאולה',
      managerId: manager2.id,
    },
  });

  const group3 = await prisma.group.create({
    data: {
      organizationId: org1.id,
      name: 'מאה שערים',
      managerId: admin1.id, // Admin can also be a manager
    },
  });

  // Group Memberships
  console.log('👫 Creating group memberships...');

  await prisma.groupMembership.createMany({
    data: [
      // Group 1: רמת שלמה
      { organizationId: org1.id, groupId: group1.id, userId: manager1.id, role: 'MANAGER' as GroupRole },
      { organizationId: org1.id, groupId: group1.id, userId: user1.id, role: 'MEMBER' as GroupRole },
      { organizationId: org1.id, groupId: group1.id, userId: user2.id, role: 'MEMBER' as GroupRole },

      // Group 2: גאולה
      { organizationId: org1.id, groupId: group2.id, userId: manager2.id, role: 'MANAGER' as GroupRole },
      { organizationId: org1.id, groupId: group2.id, userId: user3.id, role: 'MEMBER' as GroupRole },

      // Group 3: מאה שערים
      { organizationId: org1.id, groupId: group3.id, userId: admin1.id, role: 'MANAGER' as GroupRole },
      { organizationId: org1.id, groupId: group3.id, userId: user1.id, role: 'MEMBER' as GroupRole }, // User in multiple groups
    ],
  });

  // Families for Organization 1
  console.log('👨‍👩‍👧‍👦 Creating families...');

  const family1 = await prisma.family.create({
    data: {
      organizationId: org1.id,
      familyName: 'משפחת כהן',
      address: 'רחוב משה 12, ירושלים',
      contactPhone: '0521111111',
      notes: 'משפחה עם 5 ילדים',
      metadata: { size: 7, specialNeeds: ['תינוק'] },
    },
  });

  const family2 = await prisma.family.create({
    data: {
      organizationId: org1.id,
      familyName: 'משפחת לוי',
      address: 'רחוב הרב 8, ירושלים',
      contactPhone: '0522222222',
      notes: 'משפחה עם 3 ילדים',
      metadata: { size: 5 },
    },
  });

  const family3 = await prisma.family.create({
    data: {
      organizationId: org1.id,
      familyName: 'משפחת שוורץ',
      address: 'רחוב מלכי ישראל 45, ירושלים',
      contactPhone: '0523333333',
      metadata: { size: 6 },
    },
  });

  const family4 = await prisma.family.create({
    data: {
      organizationId: org1.id,
      familyName: 'משפחת גרין',
      address: 'רחוב שמואל הנביא 22, ירושלים',
      contactPhone: '0524444444',
      notes: 'משפחה חדשה',
      metadata: { size: 4 },
    },
  });

  const family5 = await prisma.family.create({
    data: {
      organizationId: org1.id,
      familyName: 'משפחת ברקוביץ',
      address: 'רחוב סורוצקין 18, ירושלים',
      contactPhone: '0525555555',
      metadata: { size: 8, specialNeeds: ['תאומים'] },
    },
  });

  // Group-Family assignments
  console.log('🔗 Assigning families to groups...');

  await prisma.groupFamily.createMany({
    data: [
      // Group 1: רמת שלמה
      { organizationId: org1.id, groupId: group1.id, familyId: family1.id },
      { organizationId: org1.id, groupId: group1.id, familyId: family2.id },
      { organizationId: org1.id, groupId: group1.id, familyId: family3.id },

      // Group 2: גאולה
      { organizationId: org1.id, groupId: group2.id, familyId: family4.id },
      { organizationId: org1.id, groupId: group2.id, familyId: family5.id },

      // Group 3: מאה שערים
      { organizationId: org1.id, groupId: group3.id, familyId: family1.id }, // Family in multiple groups
    ],
  });

  // Weekly Orders
  console.log('📋 Creating weekly orders...');

  const thisWeek = new Date();
  thisWeek.setHours(0, 0, 0, 0);
  // Set to most recent Sunday
  const day = thisWeek.getDay();
  const diff = thisWeek.getDate() - day;
  thisWeek.setDate(diff);

  const lastWeek = new Date(thisWeek);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const twoWeeksAgo = new Date(thisWeek);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Current week orders (pending)
  await prisma.weeklyOrder.createMany({
    data: [
      {
        organizationId: org1.id,
        groupId: group1.id,
        familyId: family1.id,
        weekStart: thisWeek,
        items: JSON.parse(JSON.stringify([
          { name: 'חלה', quantity: 2 },
          { name: 'חלב', quantity: 4 },
          { name: 'ביצים', quantity: 2 },
          { name: 'שמן', quantity: 1 },
        ])),
        status: 'PENDING' as OrderStatus,
      },
      {
        organizationId: org1.id,
        groupId: group1.id,
        familyId: family2.id,
        weekStart: thisWeek,
        items: JSON.parse(JSON.stringify([
          { name: 'חלה', quantity: 1 },
          { name: 'חלב', quantity: 2 },
          { name: 'ביצים', quantity: 1 },
        ])),
        status: 'PENDING' as OrderStatus,
      },
      {
        organizationId: org1.id,
        groupId: group2.id,
        familyId: family4.id,
        weekStart: thisWeek,
        items: JSON.parse(JSON.stringify([
          { name: 'חלה', quantity: 1 },
          { name: 'חלב', quantity: 3 },
        ])),
        status: 'PENDING' as OrderStatus,
      },
    ],
  });

  // Last week orders (completed)
  const completedOrder1 = await prisma.weeklyOrder.create({
    data: {
      organizationId: org1.id,
      groupId: group1.id,
      familyId: family1.id,
      weekStart: lastWeek,
      items: JSON.parse(JSON.stringify([
        { name: 'חלה', quantity: 2 },
        { name: 'חלב', quantity: 4 },
      ])),
      status: 'COMPLETED' as OrderStatus,
      completedBy: user1.id,
      completedAt: new Date(lastWeek.getTime() + 4 * 24 * 60 * 60 * 1000), // Thursday of that week
    },
  });

  await prisma.weeklyOrder.create({
    data: {
      organizationId: org1.id,
      groupId: group1.id,
      familyId: family2.id,
      weekStart: lastWeek,
      items: JSON.parse(JSON.stringify([
        { name: 'חלה', quantity: 1 },
        { name: 'חלב', quantity: 2 },
      ])),
      status: 'COMPLETED' as OrderStatus,
      completedBy: user2.id,
      completedAt: new Date(lastWeek.getTime() + 4 * 24 * 60 * 60 * 1000),
    },
  });

  // Weekly Distributors
  console.log('🚚 Assigning weekly distributors...');

  await prisma.weeklyDistributor.createMany({
    data: [
      // This week
      { organizationId: org1.id, groupId: group1.id, userId: user1.id, weekStart: thisWeek },
      { organizationId: org1.id, groupId: group2.id, userId: user3.id, weekStart: thisWeek },

      // Last week
      { organizationId: org1.id, groupId: group3.id, userId: user2.id, weekStart: lastWeek },
    ],
  });

  // Payments
  console.log('💰 Creating payments...');

  const currentMonth = '2026-04';
  const lastMonth = '2026-03';
  const twoMonthsAgo = '2026-02';

  await prisma.payment.createMany({
    data: [
      // Current month - pending
      {
        organizationId: org1.id,
        userId: user1.id,
        amount: 150,
        monthKey: currentMonth,
        method: 'CREDIT_CARD' as PaymentMethod,
        status: 'PENDING' as PaymentStatus,
      },
      {
        organizationId: org1.id,
        userId: user2.id,
        amount: 150,
        monthKey: currentMonth,
        method: 'BANK_TRANSFER' as PaymentMethod,
        status: 'PENDING' as PaymentStatus,
      },

      // Last month - completed
      {
        organizationId: org1.id,
        userId: user1.id,
        amount: 150,
        monthKey: lastMonth,
        method: 'CREDIT_CARD' as PaymentMethod,
        transactionId: 'TXN-2026-03-001',
        status: 'COMPLETED' as PaymentStatus,
        paidAt: new Date('2026-03-05'),
      },
      {
        organizationId: org1.id,
        userId: manager1.id,
        amount: 150,
        monthKey: lastMonth,
        method: 'CASH' as PaymentMethod,
        transactionId: 'TXN-2026-03-002',
        status: 'COMPLETED' as PaymentStatus,
        paidAt: new Date('2026-03-10'),
      },

      // Two months ago - one failed
      {
        organizationId: org1.id,
        userId: user3.id,
        amount: 150,
        monthKey: twoMonthsAgo,
        method: 'CREDIT_CARD' as PaymentMethod,
        transactionId: 'TXN-2026-02-001',
        status: 'FAILED' as PaymentStatus,
      },
    ],
  });

  // Payment Reminders
  console.log('📢 Creating payment reminders...');

  await prisma.paymentReminder.createMany({
    data: [
      {
        organizationId: org1.id,
        userId: user1.id,
        monthKey: currentMonth,
        reminderNumber: 1,
        sentAt: new Date('2026-04-01'),
        channel: 'SMS' as ReminderChannel,
      },
      {
        organizationId: org1.id,
        userId: user2.id,
        monthKey: currentMonth,
        reminderNumber: 1,
        sentAt: new Date('2026-04-01'),
        channel: 'WHATSAPP' as ReminderChannel,
      },
      {
        organizationId: org1.id,
        userId: user2.id,
        monthKey: currentMonth,
        reminderNumber: 2,
        sentAt: new Date('2026-04-08'),
        channel: 'SMS' as ReminderChannel,
      },
    ],
  });

  // Notifications
  console.log('🔔 Creating notifications...');

  await prisma.notification.createMany({
    data: [
      {
        organizationId: org1.id,
        userId: user1.id,
        title: 'הזמנה חדשה נוצרה',
        body: 'הזמנה עבור משפחת כהן נוצרה בהצלחה לשבוע הנוכחי',
        type: 'ORDER_CREATED' as NotificationType,
        isRead: false,
      },
      {
        organizationId: org1.id,
        userId: manager1.id,
        title: 'חלוקה הושלמה',
        body: 'כל ההזמנות עבור קבוצת רמת שלמה חולקו בהצלחה',
        type: 'DISTRIBUTION_COMPLETED' as NotificationType,
        isRead: true,
        readAt: new Date(),
      },
      {
        organizationId: org1.id,
        userId: user2.id,
        title: 'תשלום התקבל',
        body: 'התשלום עבור חודש מרץ התקבל בהצלחה',
        type: 'PAYMENT_RECEIVED' as NotificationType,
        isRead: true,
        readAt: new Date('2026-03-11'),
      },
      {
        organizationId: org1.id,
        userId: user1.id,
        title: 'תזכורת תשלום',
        body: 'תשלום עבור חודש אפריל ממתין לביצוע',
        type: 'PAYMENT_DUE' as NotificationType,
        isRead: false,
      },
      {
        organizationId: org1.id,
        userId: admin1.id,
        title: 'משתמש חדש הצטרף',
        body: 'מרים פרידמן הצטרפה למערכת',
        type: 'USER_INVITED' as NotificationType,
        isRead: false,
      },
    ],
  });

  // Audit Logs
  console.log('📝 Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: org1.id,
        userId: admin1.id,
        action: 'CREATE',
        entity: 'Group',
        entityId: group1.id,
        changes: { name: 'רמת שלמה', managerId: manager1.id },
        ipAddress: '192.168.1.100',
      },
      {
        organizationId: org1.id,
        userId: user1.id,
        action: 'UPDATE',
        entity: 'WeeklyOrder',
        entityId: completedOrder1.id,
        changes: { status: { from: 'PENDING', to: 'COMPLETED' } },
        ipAddress: '192.168.1.101',
      },
      {
        organizationId: org1.id,
        userId: admin1.id,
        action: 'CREATE',
        entity: 'Family',
        entityId: family1.id,
        changes: { familyName: 'משפחת כהן', contactPhone: '052-1111111' },
        ipAddress: '192.168.1.100',
      },
    ],
  });

  // ============================================================================
  // ORGANIZATION 2: חסד ואמת (Chesed V'Emet - Secondary test org)
  // ============================================================================

  console.log('📦 Creating Organization 2: חסד ואמת...');
  const org2 = await prisma.organization.create({
    data: {
      name: 'חסד ואמת',
      slug: 'chesed-vemet',
      phone: '039876543',
      email: 'info@chesedvemet.org.il',
      address: 'רחוב הרצל 30, בני ברק',
      isActive: true,
      setupCompleted: false, // Setup wizard not completed yet - for testing
      settings: {
        weeklyDistributionDay: 'WEDNESDAY',
        monthlyPaymentAmount: 200,
      },
    },
  });

  console.log('👥 Creating users for Organization 2...');

  const admin2 = await prisma.user.create({
    data: {
      organizationId: org2.id,
      phone: '0509999999',
      fullName: 'אברהם שטיין',
      email: 'abraham@chesedvemet.org.il',
      systemRole: 'ADMIN' as SystemRole,
      isActive: true,
      registrationCompleted: true,
    },
  });

  const manager3 = await prisma.user.create({
    data: {
      organizationId: org2.id,
      phone: '0508888888',
      fullName: 'חיים פרידמן',
      systemRole: 'USER' as SystemRole,
      isActive: true,
      registrationCompleted: true,
    },
  });

  console.log('🏘️  Creating group for Organization 2...');

  const group4 = await prisma.group.create({
    data: {
      organizationId: org2.id,
      name: 'בני ברק מרכז',
      managerId: manager3.id,
    },
  });

  await prisma.groupMembership.create({
    data: {
      organizationId: org2.id,
      groupId: group4.id,
      userId: manager3.id,
      role: 'MANAGER' as GroupRole,
    },
  });

  console.log('👨‍👩‍👧‍👦 Creating families for Organization 2...');

  const family6 = await prisma.family.create({
    data: {
      organizationId: org2.id,
      familyName: 'משפחת ויזל',
      address: 'רחוב רבי עקיבא 50, בני ברק',
      contactPhone: '0527777777',
      metadata: { size: 5 },
    },
  });

  await prisma.groupFamily.create({
    data: {
      organizationId: org2.id,
      groupId: group4.id,
      familyId: family6.id,
    },
  });

  await prisma.weeklyOrder.create({
    data: {
      organizationId: org2.id,
      groupId: group4.id,
      familyId: family6.id,
      weekStart: thisWeek,
      items: JSON.parse(JSON.stringify([
        { name: 'חלה', quantity: 2 },
        { name: 'חלב', quantity: 3 },
      ])),
      status: 'PENDING' as OrderStatus,
    },
  });

  // ============================================================================
  // ORGANIZATION 3: Empty org for testing first admin creation
  // ============================================================================

  console.log('📦 Creating Organization 3: עמותה חדשה (empty)...');
  const org3 = await prisma.organization.create({
    data: {
      name: 'עמותה חדשה',
      slug: 'new-org',
      isActive: true,
      setupCompleted: false,
    },
  });
  // No users created - SUPER_ADMIN will create first admin via platform UI

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Platform Users: 1 SUPER_ADMIN`);
  console.log(`   Organizations: 3`);
  console.log(`   - עמותת צדקה (tzedaka-org): 6 users, 3 groups, 5 families [SETUP COMPLETE ✓]`);
  console.log(`   - חסד ואמת (chesed-vemet): 2 users, 1 group, 1 family [SETUP INCOMPLETE]`);
  console.log(`   - עמותה חדשה (new-org): 0 users [NO ADMIN YET]`);
  console.log(`\n🔑 Test credentials (phone numbers):`);
  console.log(`   SUPER_ADMIN: 0500000000 (Platform Administrator)`);
  console.log(`   Admin (עמותת צדקה): 0501234567 (דוד כהן)`);
  console.log(`   Manager (עמותת צדקה): 0502345678 (שרה לוי)`);
  console.log(`   User (עמותת צדקה): 0504567890 (רחל גולדשטיין)`);
  console.log(`   Admin (חסד ואמת): 0509999999 (אברהם שטיין)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });