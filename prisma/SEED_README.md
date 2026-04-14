# Seed Data Documentation

This document describes the comprehensive seed data for testing the Amutot platform.

## Running the Seed

```bash
# From project root
pnpm prisma:seed

# Or from apps/api directory
pnpm prisma:seed
```

The seed script will:
1. Clean all existing data (in safe dependency order)
2. Create fresh test data for 2 organizations
3. Display a summary of created data

## Test Organizations

### 1. עמותת צדקה (Tzedaka Organization)
**Slug:** `tzedaka-org`

Primary test organization with comprehensive data including:
- 6 users (1 admin, 2 group managers, 3 regular users)
- 3 groups (distribution groups in different Jerusalem neighborhoods)
- 5 families assigned to groups
- Weekly orders (current week pending, last week completed)
- Weekly distributors assigned
- Payment records (pending, completed, failed)
- Payment reminders
- Notifications
- Audit logs

**Settings:**
- Weekly distribution day: Thursday
- Monthly payment amount: ₪150
- Default order items: חלה, חלב, ביצים, שמן, סוכר, קמח

### 2. חסד ואמת (Chesed V'Emet)
**Slug:** `chesed-vemet`

Secondary test organization for multi-tenancy testing:
- 2 users (1 admin, 1 manager)
- 1 group
- 1 family with orders

**Settings:**
- Weekly distribution day: Wednesday
- Monthly payment amount: ₪200

## Test Users

All users use phone-based OTP authentication. Use these phone numbers to log in:

### Organization 1: עמותת צדקה

| Phone | Name | Role | Status |
|---|---|---|---|
| `0501234567` | דוד כהן | ADMIN | Active, completed |
| `0502345678` | שרה לוי | USER (Manager of רמת שלמה) | Active, completed |
| `0503456789` | משה אברהם | USER (Manager of גאולה) | Active, completed |
| `0504567890` | רחל גולדשטיין | USER | Active, completed |
| `0505678901` | יוסף ברקוביץ | USER | Active, completed |
| `0506789012` | מרים פרידמן | USER | Active, NOT completed |

### Organization 2: חסד ואמת

| Phone | Name | Role | Status |
|---|---|---|---|
| `0509999999` | אברהם שטיין | ADMIN | Active, completed |
| `0508888888` | חיים פרידמן | USER (Manager) | Active, completed |

## Groups & Families

### Organization 1 Groups

1. **רמת שלמה** (Ramat Shlomo)
   - Manager: שרה לוי
   - Members: רחל גולדשטיין, יוסף ברקוביץ
   - Families: משפחת כהן, משפחת לוי, משפחת שוורץ

2. **גאולה** (Geula)
   - Manager: משה אברהם
   - Members: מרים פרידמן
   - Families: משפחת גרין, משפחת ברקוביץ

3. **מאה שערים** (Mea Shearim)
   - Manager: דוד כהן (admin)
   - Members: רחל גולדשטיין
   - Families: משפחת כהן (also in Group 1)

### Families

| Family Name | Address | Phone | Notes |
|---|---|---|---|
| משפחת כהן | רחוב משה 12, ירושלים | 0521111111 | 5 children, baby |
| משפחת לוי | רחוב הרב 8, ירושלים | 0522222222 | 3 children |
| משפחת שוורץ | רחוב מלכי ישראל 45, ירושלים | 0523333333 | - |
| משפחת גרין | רחוב שמואל הנביא 22, ירושלים | 0524444444 | New family |
| משפחת ברקוביץ | רחוב סורוצקין 18, ירושלים | 0525555555 | Twins |

## Weekly Orders

The seed creates orders for multiple weeks:

### Current Week (PENDING)
- Group 1: 2 families with orders (משפחת כהן, משפחת לוי)
- Group 2: 1 family with order (משפחת גרין)

### Last Week (COMPLETED)
- Group 1: 2 families with completed orders
- Completed by: רחל גולדשטיין, יוסף ברקוביץ

### Weekly Distributors
- Current week: רחל גולדשטיין (Group 1), מרים פרידמן (Group 2)
- Last week: יוסף ברקוביץ (Group 3)

## Payments

Payment data across 3 months:

### 2026-04 (Current - PENDING)
- רחל גולדשטיין: ₪150 (Credit Card)
- יוסף ברקוביץ: ₪150 (Bank Transfer)

### 2026-03 (Last Month - COMPLETED)
- רחל גולדשטיין: ₪150 (Credit Card) - Paid Mar 5
- שרה לוי: ₪150 (Cash) - Paid Mar 10

### 2026-02 (Two Months Ago - FAILED)
- מרים פרידמן: ₪150 (Credit Card) - Failed

## Payment Reminders

Multiple reminders sent for April 2026:
- רחל גולדשטיין: 1st reminder (SMS) on Apr 1
- יוסף ברקוביץ: 1st reminder (WhatsApp) on Apr 1, 2nd reminder (SMS) on Apr 8

## Notifications

5 notifications created covering:
- Order created
- Distribution completed
- Payment received
- Payment due
- User invited

Some read, some unread for testing notification states.

## Audit Logs

Sample audit logs for:
- Group creation
- Order status update
- Family creation

## Testing Scenarios

The seed data supports testing:

1. **Multi-tenancy**: Two separate organizations with isolated data
2. **User roles**: Admin vs regular users vs group managers
3. **Group management**: Users belonging to multiple groups, families in multiple groups
4. **Order workflow**: Pending orders, completed orders, weekly distributor assignment
5. **Payment lifecycle**: Pending payments, completed payments, failed payments, reminder system
6. **Notifications**: Read/unread states, different notification types
7. **Audit trail**: Entity creation and updates
8. **Registration flow**: User with incomplete registration (מרים פרידמן)

## Notes

- All user-facing text is in Hebrew (RTL)
- Phone numbers follow Israeli format (05XXXXXXXX)
- Addresses are realistic Jerusalem/Bnei Brak locations
- Family metadata includes size and special needs
- Order items stored as JSON arrays with name/quantity
- All entities properly scoped by `organizationId` for multi-tenancy
- Proper soft-delete fields (`deletedAt`) on all models
