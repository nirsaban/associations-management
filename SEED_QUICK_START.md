# Seed Data Quick Start

## Run the Seed

```bash
pnpm prisma:seed
```

## Test Credentials

### Organization 1: עמותת צדקה (tzedaka-org)

| Phone | Name | Role | Password |
|---|---|---|---|
| `0501234567` | דוד כהן | ADMIN | OTP via phone |
| `0502345678` | שרה לוי | Manager (רמת שלמה) | OTP via phone |
| `0503456789` | משה אברהם | Manager (גאולה) | OTP via phone |
| `0504567890` | רחל גולדשטיין | User | OTP via phone |
| `0505678901` | יוסף ברקוביץ | User | OTP via phone |
| `0506789012` | מרים פרידמן | User (incomplete) | OTP via phone |

### Organization 2: חסד ואמת (chesed-vemet)

| Phone | Name | Role | Password |
|---|---|---|---|
| `0509999999` | אברהם שטיין | ADMIN | OTP via phone |
| `0508888888` | חיים פרידמן | Manager | OTP via phone |

## What's Included

### ✅ 2 Organizations
- **עמותת צדקה**: Full test data (6 users, 3 groups, 5 families)
- **חסד ואמת**: Minimal test data (2 users, 1 group, 1 family)

### ✅ Groups & Distribution
- 3 groups in Jerusalem neighborhoods (רמת שלמה, גאולה, מאה שערים)
- 5 families with realistic Hebrew addresses
- Users assigned to multiple groups
- Families assigned to multiple groups

### ✅ Weekly Orders
- Current week: 3 pending orders
- Last week: 2 completed orders
- Order items in JSON format with Hebrew names
- Weekly distributors assigned

### ✅ Payments
- **Current month (2026-04)**: 2 pending payments
- **Last month (2026-03)**: 2 completed payments
- **2 months ago (2026-02)**: 1 failed payment
- Payment methods: Credit Card, Bank Transfer, Cash

### ✅ Reminders & Notifications
- Multiple payment reminders (SMS, WhatsApp)
- Various notification types (orders, payments, users, distribution)
- Read/unread states for testing

### ✅ Audit Logs
- Entity creation and updates tracked
- IP addresses logged

## Test Scenarios Covered

1. **Multi-tenancy**: Two isolated organizations
2. **User roles**: Admins, managers, regular users
3. **Incomplete registration**: User `050-6789012` hasn't completed registration
4. **Order lifecycle**: Pending → Completed
5. **Payment states**: Pending, Completed, Failed
6. **Reminder system**: Multiple reminders per user
7. **Notifications**: Different types and read states
8. **Group management**: Users in multiple groups, families in multiple groups

## Quick Tests

### Test Login Flow
```typescript
// Try logging in with phone: 0501234567
// Should send OTP and allow admin access
```

### Test Multi-tenancy
```typescript
// Login as 0501234567 (org 1) - should see 5 families
// Login as 0509999999 (org 2) - should see 1 family
// Data should be completely isolated
```

### Test Order Management
```typescript
// Login as 0504567890 (user assigned as distributor)
// Should see pending orders for current week
// Can mark orders as completed
```

### Test Payment Flow
```typescript
// Login as 0504567890
// Should see pending payment for 2026-04
// Should see completed payment for 2026-03
```

## Database Verification

Open Prisma Studio to browse the data:

```bash
pnpm prisma:studio
```

Navigate to http://localhost:5555

## Re-seeding

To clear and re-seed the database:

```bash
pnpm prisma:seed
```

The seed script automatically cleans existing data before inserting new data.

## Need More Details?

See [prisma/SEED_README.md](./prisma/SEED_README.md) for comprehensive documentation.
