import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// טעינת משתני סביבה מקובץ .env בשורש
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * נתוני seed מקיפים לפלטפורמת עמותות
 *
 * יוצר:
 * - 1 סופר אדמין
 * - 2 עמותות (A + B), שתיהן ACTIVE
 * - לכל עמותה: 1 אדמין, 2 מנהלי קבוצות, 5 משתמשים רגילים, 2 קבוצות, 3 משפחות
 * - הזמנות שבועיות, תשלומים ל-3 חודשים, התראות
 * - טלפון זהה (0501234571) קיים בשתי העמותות — להוכחת ייחודיות לפי עמותה
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

async function seedOrganization(
  superAdminId: string,
  orgData: {
    name: string;
    slug: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    setupCompleted?: boolean;
  },
  phones: {
    admin: string;
    manager1: string;
    manager2: string;
    users: string[];
  },
  names: {
    admin: string;
    manager1: string;
    manager2: string;
    users: string[];
    groups: [string, string];
    families: [string, string, string];
  },
) {
  const weekKey = getCurrentWeekKey();
  const currentMonth = getMonthKey(0);
  const lastMonth = getMonthKey(1);
  const twoMonthsAgo = getMonthKey(2);

  // יצירת עמותה
  const org = await prisma.organization.create({
    data: {
      name: orgData.name,
      slug: orgData.slug,
      contactPhone: orgData.contactPhone,
      contactEmail: orgData.contactEmail,
      address: orgData.address,
      status: 'ACTIVE',
      setupCompleted: orgData.setupCompleted ?? true,
      createdBySuperAdminId: superAdminId,
      settings: {
        monthlyPaymentAmount: 150,
        weeklyDistributionDay: 'THURSDAY',
      },
    },
  });

  console.log(`  עמותה נוצרה: ${org.name} (${org.slug})`);

  // אדמין
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      phone: phones.admin,
      fullName: names.admin,
      email: `admin@${orgData.slug}.org.il`,
      systemRole: 'ADMIN',
      isActive: true,
      registrationCompleted: true,
    },
  });

  // מנהלי קבוצות
  const manager1 = await prisma.user.create({
    data: {
      organizationId: org.id,
      phone: phones.manager1,
      fullName: names.manager1,
      email: `manager1@${orgData.slug}.org.il`,
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      organizationId: org.id,
      phone: phones.manager2,
      fullName: names.manager2,
      email: `manager2@${orgData.slug}.org.il`,
      systemRole: 'USER',
      isActive: true,
      registrationCompleted: true,
    },
  });

  // משתמשים רגילים
  const users = [];
  for (let i = 0; i < phones.users.length; i++) {
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        phone: phones.users[i],
        fullName: names.users[i],
        systemRole: 'USER',
        isActive: true,
        registrationCompleted: i < 4, // משתמש אחרון לא השלים הרשמה
      },
    });
    users.push(user);
  }

  // קבוצות
  const group1 = await prisma.group.create({
    data: {
      organizationId: org.id,
      name: names.groups[0],
      managerUserId: manager1.id,
      isActive: true,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      organizationId: org.id,
      name: names.groups[1],
      managerUserId: manager2.id,
      isActive: true,
    },
  });

  // חברויות בקבוצה 1 (מנהל + 3 משתמשים)
  await prisma.groupMembership.create({
    data: { organizationId: org.id, groupId: group1.id, userId: manager1.id, role: 'MANAGER', status: 'ACTIVE' },
  });
  await prisma.groupMembership.create({
    data: { organizationId: org.id, groupId: group1.id, userId: users[0].id, role: 'MEMBER', status: 'ACTIVE' },
  });
  await prisma.groupMembership.create({
    data: { organizationId: org.id, groupId: group1.id, userId: users[1].id, role: 'MEMBER', status: 'ACTIVE' },
  });
  await prisma.groupMembership.create({
    data: { organizationId: org.id, groupId: group1.id, userId: users[4].id, role: 'MEMBER', status: 'ACTIVE' },
  });

  // חברויות בקבוצה 2 (מנהל + 2 משתמשים)
  await prisma.groupMembership.create({
    data: { organizationId: org.id, groupId: group2.id, userId: manager2.id, role: 'MANAGER', status: 'ACTIVE' },
  });
  await prisma.groupMembership.create({
    data: { organizationId: org.id, groupId: group2.id, userId: users[2].id, role: 'MEMBER', status: 'ACTIVE' },
  });
  await prisma.groupMembership.create({
    data: { organizationId: org.id, groupId: group2.id, userId: users[3].id, role: 'MEMBER', status: 'ACTIVE' },
  });

  // משפחות
  const family1 = await prisma.family.create({
    data: {
      organizationId: org.id,
      groupId: group1.id,
      familyName: names.families[0],
      contactName: 'איש קשר',
      address: 'רחוב ביאליק 5',
      contactPhone: '0521234567',
      notes: 'אלרגיה לבוטנים',
      status: 'active',
    },
  });

  const family2 = await prisma.family.create({
    data: {
      organizationId: org.id,
      groupId: group1.id,
      familyName: names.families[1],
      contactName: 'איש קשר',
      address: 'שדרות רוטשילד 10',
      contactPhone: '0522234567',
      status: 'active',
    },
  });

  const family3 = await prisma.family.create({
    data: {
      organizationId: org.id,
      groupId: group2.id,
      familyName: names.families[2],
      contactName: 'איש קשר',
      address: 'רחוב הנביאים 3',
      contactPhone: '0523234567',
      notes: 'יש לצלצל לפני הגעה',
      status: 'active',
    },
  });

  // הזמנות שבועיות
  await prisma.weeklyOrder.create({
    data: {
      organizationId: org.id,
      groupId: group1.id,
      familyId: family1.id,
      weekKey,
      createdByUserId: manager1.id,
      shoppingListJson: [
        { item: 'לחם', quantity: 2, unit: 'יחידות' },
        { item: 'חלב', quantity: 3, unit: 'ליטר' },
      ],
      status: 'COMPLETED',
    },
  });

  await prisma.weeklyOrder.create({
    data: {
      organizationId: org.id,
      groupId: group1.id,
      familyId: family2.id,
      weekKey,
      createdByUserId: manager1.id,
      shoppingListJson: [
        { item: 'קמח', quantity: 1, unit: 'ק"ג' },
      ],
      status: 'DRAFT',
    },
  });

  await prisma.weeklyOrder.create({
    data: {
      organizationId: org.id,
      groupId: group2.id,
      familyId: family3.id,
      weekKey,
      createdByUserId: manager2.id,
      shoppingListJson: [
        { item: 'אורז', quantity: 2, unit: 'ק"ג' },
      ],
      status: 'COMPLETED',
    },
  });

  // מחלק שבועי
  await prisma.weeklyDistributorAssignment.create({
    data: {
      organizationId: org.id,
      groupId: group1.id,
      weekKey,
      assignedUserId: users[0].id,
      assignedByUserId: manager1.id,
    },
  });

  // תשלומים — users[0] שילם 3 חודשים, users[1] שילם 2, השאר לא שילמו
  const payments = [];
  for (const monthKey of [currentMonth, lastMonth, twoMonthsAgo]) {
    const p = await prisma.payment.create({
      data: {
        organizationId: org.id,
        userId: users[0].id,
        amount: 150,
        currency: 'ILS',
        monthKey,
        paymentDate: new Date(),
        source: 'bank_transfer',
        externalTransactionId: `txn-${orgData.slug}-${monthKey}-user0`,
        status: 'COMPLETED',
      },
    });
    payments.push(p);
  }

  for (const monthKey of [lastMonth, twoMonthsAgo]) {
    await prisma.payment.create({
      data: {
        organizationId: org.id,
        userId: users[1].id,
        amount: 150,
        currency: 'ILS',
        monthKey,
        paymentDate: new Date(),
        source: 'credit_card',
        externalTransactionId: `txn-${orgData.slug}-${monthKey}-user1`,
        status: 'COMPLETED',
      },
    });
  }

  // סטטוס תשלום חודשי
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: users[0].id, monthKey: currentMonth, isPaid: true, paidAt: new Date(), paymentId: payments[0].id, reminderCount: 0 },
  });
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: users[0].id, monthKey: lastMonth, isPaid: true, paidAt: new Date(), paymentId: payments[1].id, reminderCount: 0 },
  });
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: users[0].id, monthKey: twoMonthsAgo, isPaid: true, paidAt: new Date(), paymentId: payments[2].id, reminderCount: 0 },
  });

  // users[1] — לא שילם חודש נוכחי
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: users[1].id, monthKey: currentMonth, isPaid: false, reminderCount: 1, lastReminderAt: new Date() },
  });

  // users[2..4] — לא שילמו חודש נוכחי
  for (let i = 2; i < 5; i++) {
    await prisma.monthlyPaymentStatus.create({
      data: { organizationId: org.id, userId: users[i].id, monthKey: currentMonth, isPaid: false, reminderCount: 0 },
    });
  }

  // תזכורות תשלום
  await prisma.paymentReminder.create({
    data: { organizationId: org.id, userId: users[1].id, monthKey: currentMonth, reminderNumber: 1, channel: 'PUSH', status: 'SENT', sentAt: new Date() },
  });

  // התראות
  await prisma.notification.create({
    data: {
      organizationId: org.id,
      userId: users[0].id,
      type: 'PAYMENT_RECEIVED',
      title: 'תשלום התקבל',
      body: `תשלום חודשי עבור ${currentMonth} התקבל בהצלחה`,
      channel: 'PUSH',
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      organizationId: org.id,
      userId: manager1.id,
      type: 'ORDER_CREATED',
      title: 'הזמנה שבועית',
      body: `נדרש ליצור הזמנה שבועית עבור ${weekKey}`,
      channel: 'PUSH',
      status: 'READ',
      sentAt: new Date(),
    },
  });

  return { org, admin, manager1, manager2, users, group1, group2 };
}

async function main() {
  console.log('מתחיל seed...');

  // ניקוי נתונים קיימים (בסדר הפוך לתלויות)
  console.log('מנקה נתונים קיימים...');
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

  // יצירת סופר אדמין
  console.log('יוצר סופר אדמין...');
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
  console.log(`  סופר אדמין: ${superAdmin.phone}`);

  // עמותה A — setupCompleted=false to test onboarding wizard
  console.log('\nיוצר עמותה A...');
  const orgA = await seedOrganization(
    superAdmin.id,
    {
      name: 'עמותת חסד ואהבה',
      slug: 'chesed-veahava',
      contactPhone: '025812345',
      contactEmail: 'info@chesed.org.il',
      address: 'רחוב הרצל 1, תל אביב',
      setupCompleted: false,
    },
    {
      admin: '0501234568',
      manager1: '0501234569',
      manager2: '0501234570',
      // הערה: 0501234571 קיים גם בעמותה B — הוכחה לייחודיות לפי עמותה
      users: ['0501234571', '0501234572', '0501234573', '0501234574', '0501234575'],
    },
    {
      admin: 'ישראל מנהל',
      manager1: 'דוד מנהל קבוצה',
      manager2: 'שרה מנהלת קבוצה',
      users: ['יוסף כהן', 'רחל לוי', 'משה ישראלי', 'מרים אברהם', 'יצחק שפירו'],
      groups: ["קבוצה א'", "קבוצה ב'"],
      families: ['משפחת כהן', 'משפחת לוי', 'משפחת ישראלי'],
    },
  );

  // עמותה B
  console.log('\nיוצר עמותה B...');
  const orgB = await seedOrganization(
    superAdmin.id,
    {
      name: 'עמותת אור לעם',
      slug: 'or-laam',
      contactPhone: '039876543',
      contactEmail: 'info@or-laam.org.il',
      address: 'רחוב בן יהודה 20, ירושלים',
    },
    {
      admin: '0509876543',
      manager1: '0509876544',
      manager2: '0509876545',
      // הערה: 0501234571 קיים גם בעמותה A — הוכחה לייחודיות לפי עמותה
      users: ['0501234571', '0509876547', '0509876548', '0509876549', '0509876550'],
    },
    {
      admin: 'אברהם ניהול',
      manager1: 'יעקב מנהל קבוצה',
      manager2: 'לאה מנהלת קבוצה',
      users: ['חיים דוד', 'דינה שמואל', 'נתן גולד', 'תמר רוזן', 'אלי ברק'],
      groups: ["קבוצת צפון", "קבוצת דרום"],
      families: ['משפחת דוד', 'משפחת שמואל', 'משפחת גולד'],
    },
  );

  console.log('\n========================================');
  console.log('Seed הושלם בהצלחה!');
  console.log('========================================');
  console.log('');
  console.log('סיכום:');
  console.log(`  סופר אדמין: ${superAdmin.phone} (${superAdmin.fullName})`);
  console.log('');
  console.log(`  עמותה A: ${orgA.org.name} (${orgA.org.slug})`);
  console.log(`    אדמין: ${orgA.admin.phone} (${orgA.admin.fullName})`);
  console.log(`    מנהל קבוצה 1: ${orgA.manager1.phone} (${orgA.manager1.fullName})`);
  console.log(`    מנהל קבוצה 2: ${orgA.manager2.phone} (${orgA.manager2.fullName})`);
  console.log(`    משתמשים: ${orgA.users.map(u => u.phone).join(', ')}`);
  console.log('');
  console.log(`  עמותה B: ${orgB.org.name} (${orgB.org.slug})`);
  console.log(`    אדמין: ${orgB.admin.phone} (${orgB.admin.fullName})`);
  console.log(`    מנהל קבוצה 1: ${orgB.manager1.phone} (${orgB.manager1.fullName})`);
  console.log(`    מנהל קבוצה 2: ${orgB.manager2.phone} (${orgB.manager2.fullName})`);
  console.log(`    משתמשים: ${orgB.users.map(u => u.phone).join(', ')}`);
  console.log('');
  console.log('  טלפון משותף (הוכחת ייחודיות לפי עמותה): 0501234571');
  console.log(`  שבוע נוכחי: ${getCurrentWeekKey()}`);
  console.log(`  חודש נוכחי: ${getMonthKey(0)}`);
}

main()
  .catch((e) => {
    console.error('שגיאת seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
