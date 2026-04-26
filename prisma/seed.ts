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

function dateToWeekKey(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getCurrentWeekKey(): string {
  return dateToWeekKey(new Date());
}

function getWeekKeyNWeeksAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return dateToWeekKey(d);
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
    paymentLink?: string;
    paymentDescription?: string;
    logoUrl?: string;
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
      paymentLink: orgData.paymentLink ?? null,
      paymentDescription: orgData.paymentDescription ?? null,
      logoUrl: orgData.logoUrl ?? null,
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
      activationCompleted: true,
      activationCompleted: true,
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
      activationCompleted: true,
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
      activationCompleted: true,
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
      address: 'רחוב ביאליק 5, תל אביב',
      contactPhone: '0521234567',
      childrenMinorCount: 3,
      totalMemberCount: 5,
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
      address: 'שדרות רוטשילד 10, תל אביב',
      contactPhone: '0522234567',
      childrenMinorCount: 2,
      totalMemberCount: 4,
      status: 'active',
    },
  });

  // Third family in group1 — deliberately NO order for current week (tests "not all filled")
  await prisma.family.create({
    data: {
      organizationId: org.id,
      groupId: group1.id,
      familyName: names.families[2],
      contactName: 'איש קשר',
      address: 'רחוב הנביאים 3, ירושלים',
      contactPhone: '0523234567',
      childrenMinorCount: 1,
      totalMemberCount: 3,
      notes: 'יש לצלצל לפני הגעה',
      status: 'active',
    },
  });

  // Fourth family in group2
  const family4 = await prisma.family.create({
    data: {
      organizationId: org.id,
      groupId: group2.id,
      familyName: `משפחת אברהמי`,
      contactName: 'איש קשר',
      address: 'רחוב יפו 50, ירושלים',
      contactPhone: '0524234567',
      childrenMinorCount: 4,
      totalMemberCount: 7,
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

  // Only 2 of 3 families in group1 have orders = NOT all filled (for testing the button state)
  // family3 deliberately has NO order for current week

  // Group2 orders
  await prisma.weeklyOrder.create({
    data: {
      organizationId: org.id,
      groupId: group2.id,
      familyId: family4.id,
      weekKey,
      createdByUserId: manager2.id,
      shoppingListJson: { text: 'אורז 2 ק"ג, שמן, סוכר' },
      status: 'COMPLETED',
    },
  });

  // מחלק שבועי — group1 current week
  await prisma.weeklyDistributorAssignment.create({
    data: {
      organizationId: org.id,
      groupId: group1.id,
      weekKey,
      assignedUserId: users[0].id,
      assignedByUserId: manager1.id,
    },
  });

  // Past distributor assignments for workload testing (group1)
  const pastWeeks = [1, 2, 3, 4, 5, 6, 7, 8].map(n => getWeekKeyNWeeksAgo(n));
  // Rotate distributors among users[0], users[1], users[4] (group1 members)
  const group1Members = [users[0], users[1], users[4]];
  for (let i = 0; i < pastWeeks.length; i++) {
    const assignee = group1Members[i % group1Members.length];
    await prisma.weeklyDistributorAssignment.create({
      data: {
        organizationId: org.id,
        groupId: group1.id,
        weekKey: pastWeeks[i],
        assignedUserId: assignee.id,
        assignedByUserId: manager1.id,
      },
    });
  }

  // ─── Payments — spread across 6 months for revenue chart ───────────────────
  const monthKeys = Array.from({ length: 6 }, (_, i) => getMonthKey(i));

  // Helper for payment creation
  async function createPayment(userId: string, monthKey: string, amount: number, source: string, idx: number) {
    const paymentDate = new Date();
    paymentDate.setMonth(paymentDate.getMonth() - idx);
    const p = await prisma.payment.create({
      data: {
        organizationId: org.id,
        userId,
        amount,
        currency: 'ILS',
        monthKey,
        paymentDate,
        source,
        externalTransactionId: `txn-${orgData.slug}-${monthKey}-${userId.slice(-4)}-${idx}`,
        status: 'COMPLETED',
      },
    });
    return p;
  }

  // users[0] — paid all 6 months (group1 member)
  const user0Payments = [];
  for (let i = 0; i < 6; i++) {
    const p = await createPayment(users[0].id, monthKeys[i], 150, 'bank_transfer', i);
    user0Payments.push(p);
  }

  // users[1] — paid 4 of 6 months, NOT current month (group1 member)
  for (let i = 1; i < 5; i++) {
    await createPayment(users[1].id, monthKeys[i], 150, 'credit_card', i);
  }

  // users[4] — paid 2 months (group1 member)
  for (let i = 0; i < 2; i++) {
    await createPayment(users[4].id, monthKeys[i], 150, 'credit_card', i);
  }

  // manager1 — paid all 6 months (manager IS also a donor)
  const mgr1Payments = [];
  for (let i = 0; i < 6; i++) {
    const p = await createPayment(manager1.id, monthKeys[i], 200, 'credit_card', i);
    mgr1Payments.push(p);
  }

  // users[2] — paid 3 months (group2 member)
  for (let i = 0; i < 3; i++) {
    await createPayment(users[2].id, monthKeys[i], 150, 'bank_transfer', i);
  }

  // users[3] — paid 1 month only, NOT current (group2 member)
  await createPayment(users[3].id, monthKeys[2], 150, 'cash', 2);

  // ─── Monthly payment status ───────────────────────────────────────────────

  // users[0] — paid current month
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: users[0].id, monthKey: currentMonth, isPaid: true, paidAt: new Date(), paymentId: user0Payments[0].id, reminderCount: 0 },
  });

  // users[1] — NOT paid current month
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: users[1].id, monthKey: currentMonth, isPaid: false, reminderCount: 1, lastReminderAt: new Date() },
  });

  // users[4] — paid current month (group1)
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: users[4].id, monthKey: currentMonth, isPaid: true, paidAt: new Date(), reminderCount: 0 },
  });

  // manager1 — paid current month
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: manager1.id, monthKey: currentMonth, isPaid: true, paidAt: new Date(), paymentId: mgr1Payments[0].id, reminderCount: 0 },
  });

  // users[2] — paid current month (group2)
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: users[2].id, monthKey: currentMonth, isPaid: true, paidAt: new Date(), reminderCount: 0 },
  });

  // users[3] — NOT paid current month (group2)
  await prisma.monthlyPaymentStatus.create({
    data: { organizationId: org.id, userId: users[3].id, monthKey: currentMonth, isPaid: false, reminderCount: 0 },
  });

  // תזכורות תשלום
  await prisma.paymentReminder.create({
    data: { organizationId: org.id, userId: users[1].id, monthKey: currentMonth, reminderNumber: 1, channel: 'PUSH', status: 'SENT', sentAt: new Date() },
  });

  // ─── Alerts (new Alert model) ──────────────────────────────────────────────
  await prisma.alert.create({
    data: {
      organizationId: org.id,
      title: 'עדכון חשוב לכל המשתמשים',
      body: 'שימו לב: השבוע יתקיים אירוע מיוחד של העמותה. כל החברים מוזמנים להגיע ביום חמישי בשעה 18:00 לאולם המרכזי.',
      audience: 'ALL_USERS',
      publishedById: admin.id,
      deliveredCount: 5,
      recipientCount: 8,
      publishedAt: new Date(),
    },
  });

  await prisma.alert.create({
    data: {
      organizationId: org.id,
      title: 'תזכורת למנהלי קבוצות — סיום הזמנות',
      body: 'נא לוודא שכל ההזמנות השבועיות מולאו עד יום רביעי בצהריים. משפחות שלא מולאו לגביהן הזמנה לא יקבלו חבילה.',
      audience: 'GROUP_MANAGERS',
      publishedById: admin.id,
      deliveredCount: 2,
      recipientCount: 2,
      publishedAt: new Date(Date.now() - 86400000), // yesterday
    },
  });

  await prisma.alert.create({
    data: {
      organizationId: org.id,
      title: 'שינוי במועד החלוקה',
      body: 'החלוקה השבוע תתקיים ביום שישי במקום יום חמישי עקב החג.',
      audience: 'ALL_USERS',
      publishedById: admin.id,
      deliveredCount: 7,
      recipientCount: 8,
      publishedAt: new Date(Date.now() - 3 * 86400000), // 3 days ago
    },
  });

  await prisma.alert.create({
    data: {
      organizationId: org.id,
      title: 'ברכות לרגל השנה החדשה',
      body: 'צוות העמותה מאחל לכל המתנדבים, התורמים והמשפחות שנה טובה ומבורכת. תודה על השותפות!',
      audience: 'ALL_USERS',
      publishedById: admin.id,
      deliveredCount: 8,
      recipientCount: 8,
      publishedAt: new Date(Date.now() - 10 * 86400000), // 10 days ago
    },
  });

  // Notifications (existing model)
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
  await prisma.weeklyFamilyDelivery.deleteMany();
  await prisma.alert.deleteMany();
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
      activationCompleted: true,
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
      setupCompleted: true,
      paymentLink: 'https://meshulam.co.il/purchase?b=demo123',
      paymentDescription: 'תרומה חודשית לעמותת חסד ואהבה — תמיכה במשפחות נזקקות בתל אביב והמרכז',
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
      paymentLink: 'https://meshulam.co.il/purchase?b=demo456',
      paymentDescription: 'תרומה חודשית לעמותת אור לעם — סיוע לקהילות מוחלשות בירושלים',
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

  // Landing page for or-laam with all 13 sections
  console.log('\nיוצר דף נחיתה לעמותה B (or-laam)...');
  const landingPage = await prisma.landingPage.create({
    data: {
      organizationId: orgB.org.id,
      slug: 'or-laam',
      title: 'עמותת אור לעם — דף נחיתה',
      theme: 'MODERN',
      published: true,
      publishedAt: new Date(),
      sections: {
        create: [
          {
            type: 'hero',
            position: 0,
            visible: true,
            data: {
              pill_text: 'פעיל · קמפיין פתוח',
              since_text: 'עמותה רשומה · נוסדה 1994',
              headline: 'דרך שקטה לתת כתף',
              accent_word_index: 2,
              subheadline: 'חונכות, תכניות אחר־צהריים וביטחון תזונתי למשפחות בקהילה שלנו. ממומן על־ידי שכנים, למען שכנים.',
              cta_label: 'תרמו עכשיו →',
              cta_action: 'payment',
              secondary_cta_label: 'צפו בסיפור שלנו',
              secondary_cta_target: '#story',
              stats: [
                { value: '140', label: 'משפחות בשבוע' },
                { value: '32', label: 'שנות פעילות' },
                { value: '68%', label: 'מימון מקומי' },
                { value: '1,240', label: 'שעות התנדבות' },
              ],
            },
          },
          {
            type: 'marquee',
            position: 1,
            visible: true,
            data: { items: ['חונכות', 'מזון', 'חינוך', 'קהילה', 'תקווה'] },
          },
          {
            type: 'video',
            position: 2,
            visible: true,
            data: {
              eyebrow: 'הסיפור שלנו',
              title: 'העבודה, במילותיהן של המשפחות שחיו אותה.',
              description: '',
              source: '',
            },
          },
          {
            type: 'about',
            position: 3,
            visible: true,
            data: {
              eyebrow: 'אודות',
              title: 'התחלנו סביב שולחן מטבח ב־1994. וכך אנחנו ממשיכים.',
              body_rich_text: '<p>התחלנו עם ארבע משפחות, ארוחה משותפת אחת בשבוע, ואמונה ששכנים יודעים הכי טוב מה שכנים צריכים.</p><p>שלושה עשורים לאחר מכן אנחנו מפעילים חונכות אחר־צהריים, תכנית מזון שבועית, וקייטנת נוער קיצית — אבל צורת העבודה לא השתנתה הרבה.</p>',
              badge_text: 'מאז 1994',
            },
          },
          {
            type: 'activities',
            position: 4,
            visible: true,
            data: {
              eyebrow: 'מה אנחנו עושים',
              title: 'שש תכניות, בכל שבוע של השנה.',
              items: [
                { title: 'חונכות נוער', description: 'התאמה אישית בין תלמידי תיכון למתנדבים סטודנטים, מדי שבוע לאורך שנת לימודים.' },
                { title: 'תכנית אחר־צהריים', description: 'חדר חם ובטוח בין 14:00 ל־18:00, עם תגבור, עזרה בשיעורים וארוחה חמה.' },
                { title: 'סל מזון שבועי', description: 'ירקות ומצרכי יסוד נמסרים ל־140 משפחות בכל יום חמישי, בלי טפסים ובלי שאלות.' },
                { title: 'קייטנת קיץ', description: 'עשרה ימים של טיולים, מוסיקה וחברות לילדים שמשפחותיהם לא יכולות לשלוח אותם בדרך אחרת.' },
                { title: 'מטבח קהילתי', description: 'מתנדבים, סטודנטים וסבתות מבשלים יחד עבור שכנים שזקוקים לארוחה.' },
                { title: 'פעילות חגים', description: 'מבצעי מתנות ומצרכים לפני כל חג, המופעלים על־ידי מועצת המתנדבים הצעירים.' },
              ],
            },
          },
          {
            type: 'gallery',
            position: 5,
            visible: true,
            data: {
              eyebrow: 'בתוך הרגע',
              title: 'רגעים, שנשמרו על־ידי האנשים שהיו בהם.',
              images: [],
            },
          },
          {
            type: 'reviews',
            position: 6,
            visible: true,
            data: {
              eyebrow: 'במילים שלהם',
              title: 'הקהילה, על הקהילה.',
              cta_text: 'השאירו ביקורת שלכם',
              empty_text: 'היו הראשונים להשאיר הודעה.',
              items: [
                { name: 'רונית ל.', text: 'הבן שלי בתכנית אחר־הצהריים שנתיים. המדריכים מכירים אותו בשמו. זה מה שמשנה.', rating: 5 },
                { name: 'דוד ק.', text: 'אני תורם כאן כי אני יכול להיכנס, לראות את העבודה, ולצאת עם ידיים מלאות ירקות.', rating: 5 },
                { name: 'מרים א.', text: 'קייטנת הקיץ הייתה הפעם הראשונה שהבת שלי נסעה לבד. היא חזרה גבוהה יותר.', rating: 5 },
              ],
            },
          },
          {
            type: 'stats',
            position: 7,
            visible: true,
            data: {
              eyebrow: 'במספרים',
              items: [
                { value: '140', label: 'משפחות בשבוע' },
                { value: '32', label: 'שנים בשכונה' },
                { value: '68%', label: 'מהמימון מתורמים מקומיים' },
                { value: '1,240', label: 'שעות התנדבות אשתקד' },
              ],
            },
          },
          {
            type: 'cta_payment',
            position: 8,
            visible: true,
            data: {
              eyebrow: 'תרמו עכשיו',
              headline: 'כל שקל, *ישר לעבודה.*',
              subheadline: 'עיבוד באמצעות שותף הסליקה המאובטח שלנו. עד 12 תשלומים חודשיים ללא ריבית.',
              amounts: [100, 250, 500, 1000],
              default_amount_index: 2,
              allow_custom: true,
              installments_hint: true,
              receipt_hint: true,
              cta_label: 'תרמו',
              secure_label: 'סליקה מאובטחת',
              installments_label: 'עד 12 תשלומים',
              receipt_label: 'קבלה לפי סעיף 46',
            },
          },
          {
            type: 'join_us',
            position: 9,
            visible: true,
            data: {
              eyebrow: 'הצטרפו אלינו',
              headline: 'מקום ליד השולחן תמיד פתוח.',
              body: 'מתנדבים, שכנים, סטודנטים, סבתות — אם תרצו לעזור, השאירו לנו הודעה ונחזור אליכם תוך שבוע.',
              submit_label: 'שלחו →',
              success_title: 'קיבלנו. תודה רבה.',
              success_message: 'נחזור אליכם תוך מספר ימים.',
            },
          },
          {
            type: 'faq',
            position: 10,
            visible: true,
            data: {
              eyebrow: 'שאלות',
              title: 'הנפוצות ביותר.',
              items: [
                { question: 'האם התרומה מוכרת לזיכוי מס?', answer: 'כן. אנחנו עמותה רשומה בעלת אישור סעיף 46; קבלה לצורכי מס מונפקת אוטומטית לאחר כל תרומה.' },
                { question: 'האם ניתן לתרום בעילום שם?', answer: 'כן. תרומות בעילום שם מתקבלות בברכה ומופיעות בדוח השנתי ללא שם.' },
                { question: 'איך הכסף מנוצל?', answer: 'כ־82% הולך ישירות לתכניות; השאר מכסה שכר דירה, הוצאות שוטפות, ורכזת.' },
                { question: 'איך אפשר להתנדב?', answer: 'מלאו את הטופס למעלה או כתבו לנו. אנחנו מקיימים יום הכוונה קצר בתחילת כל חודש.' },
                { question: 'האם אתם מקבלים תרומות בעין?', answer: 'אנחנו מקבלים מזון, ספרים, וביגוד עונתי. אנא צרו איתנו קשר לפני הבאת פריטים.' },
              ],
            },
          },
          {
            type: 'footer',
            position: 11,
            visible: true,
            data: {
              big_text: 'לבנות קהילה.',
              big_accent: 'ביחד.',
              about: 'עמותה קהילתית המשרתת את משפחות השכונה שלנו מאז 1994.',
              visit_label: 'ביקור',
              contact_label: 'יצירת קשר',
              follow_label: 'עקבו',
              hours: 'א׳–ה׳, 9:00–17:00',
              registration_number: '',
              section_46: false,
            },
          },
        ],
      },
    },
  });
  console.log(`  דף נחיתה: ${landingPage.slug} (${landingPage.id})`);

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
