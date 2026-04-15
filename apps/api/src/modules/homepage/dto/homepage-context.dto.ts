import { ApiProperty } from '@nestjs/swagger';

export class UserSummaryDto {
  @ApiProperty({ description: 'מזהה משתמש' })
  id!: string;

  @ApiProperty({ description: 'שם מלא' })
  fullName!: string;

  @ApiProperty({ description: 'טלפון' })
  phone!: string;

  @ApiProperty({ description: 'תפקיד במערכת' })
  systemRole!: string;
}

export class OrganizationSummaryDto {
  @ApiProperty({ description: 'שם העמותה' })
  name!: string;

  @ApiProperty({ description: 'האם ההגדרה הראשונית הושלמה' })
  setupCompleted!: boolean;
}

export class PaymentSummaryDto {
  @ApiProperty({ description: 'חודש נוכחי (YYYY-MM)' })
  currentMonth!: string;

  @ApiProperty({ description: 'האם שולם החודש' })
  isPaid!: boolean;

  @ApiProperty({ description: 'סכום לתשלום', required: false })
  amountDue?: number;

  @ApiProperty({ description: 'תאריך תשלום אחרון', required: false })
  lastPaymentDate?: Date;
}

export class GroupSummaryDto {
  @ApiProperty({ description: 'מזהה קבוצה' })
  groupId!: string;

  @ApiProperty({ description: 'שם קבוצה' })
  groupName!: string;

  @ApiProperty({ description: 'מספר חברים' })
  memberCount!: number;
}

export class ManagerSummaryDto {
  @ApiProperty({ description: 'קבוצות מנוהלות' })
  managedGroups!: number;

  @ApiProperty({ description: 'משימות ממתינות' })
  pendingTasks!: number;

  @ApiProperty({ description: 'חברים ששילמו החודש' })
  membersPaid!: number;

  @ApiProperty({ description: 'חברים שלא שילמו החודש' })
  membersUnpaid!: number;
}

export class DistributorSummaryDto {
  @ApiProperty({ description: 'שבוע נוכחי' })
  currentWeek!: string;

  @ApiProperty({ description: 'קבוצה משויכת' })
  assignedGroup!: string | null;

  @ApiProperty({ description: 'מספר משפחות למשלוח' })
  deliveriesCount!: number;
}

export class AdminSummaryDto {
  @ApiProperty({ description: 'סך משתמשים' })
  totalUsers!: number;

  @ApiProperty({ description: 'סך קבוצות' })
  totalGroups!: number;

  @ApiProperty({ description: 'סך משפחות' })
  totalFamilies!: number;

  @ApiProperty({ description: 'משתמשים שלא שילמו החודש' })
  unpaidCount!: number;

  @ApiProperty({ description: 'הכנסות חודש נוכחי' })
  currentMonthRevenue!: number;
}

export class QuickActionDto {
  @ApiProperty({ description: 'מזהה פעולה' })
  id!: string;

  @ApiProperty({ description: 'כותרת' })
  title!: string;

  @ApiProperty({ description: 'תיאור', required: false })
  description?: string;

  @ApiProperty({ description: 'נתיב' })
  path!: string;
}

export class HomepageContextDto {
  @ApiProperty({ type: UserSummaryDto })
  user!: UserSummaryDto;

  @ApiProperty({ type: OrganizationSummaryDto, required: false })
  organization?: OrganizationSummaryDto;

  @ApiProperty({ type: PaymentSummaryDto, required: false })
  payment?: PaymentSummaryDto;

  @ApiProperty({ type: GroupSummaryDto, required: false })
  group?: GroupSummaryDto;

  @ApiProperty({ type: ManagerSummaryDto, required: false })
  manager?: ManagerSummaryDto;

  @ApiProperty({ type: DistributorSummaryDto, required: false })
  distributor?: DistributorSummaryDto;

  @ApiProperty({ type: AdminSummaryDto, required: false })
  admin?: AdminSummaryDto;

  @ApiProperty({ description: 'כרטיסים לתצוגה', type: [String] })
  visibleCards!: string[];

  @ApiProperty({ description: 'פעולות זמינות', type: [QuickActionDto] })
  quickActions!: QuickActionDto[];

  @ApiProperty({ description: 'הודעות שלא נקראו' })
  unreadNotifications!: number;
}
