# Migrate Airtable Data

Map Airtable table schema to Prisma model and generate migration script. Never deletes Airtable records.

## Input Parameters
- `airtableBaseId` - Base ID from AIRTABLE_BASE_ID env var
- `airtableTableName` - Name of table in Airtable (e.g., "תורמים" for donors)
- `prismaModelName` - Target Prisma model name (e.g., "Donor")
- `organizationId` - Target organization ID for migrated records
- `dryRun` - Preview without writing (default: true)

## Steps

### 1. Fetch Airtable schema
```bash
# Read Airtable table to understand structure
airtable list "{airtableBaseId}" "{airtableTableName}"
```

Examine:
- Field names and types
- How many records
- Duplicate handling (look for phone, email uniqueness)
- Date formats
- Relationship fields

### 2. Map Airtable fields to Prisma model

Create a field mapping document:

```markdown
## Airtable → Prisma Mapping

| Airtable Field | Airtable Type | Prisma Field | Prisma Type | Transform |
|---|---|---|---|---|
| שם | singleLineText | name | String | Trim whitespace |
| דוא"ל | email | email | String? | Normalize email to lowercase |
| טלפון | singleLineText | phone | String? | Remove spaces/dashes, validate format |
| תאריך | date | donationDate | DateTime? | Parse ISO format |
| סכום | currency | amount | Decimal | Parse currency amount |
| הערות | multilineText | notes | String? | Preserve formatting |
| מצב | singleSelect | status | String | Map to enum values |

## Field-Level Validation Rules
- **name**: Required, non-empty, trim whitespace
- **email**: Optional, valid email format, lowercase
- **phone**: Optional, Israeli format: 05X-XXXXXXX or +972-5X-XXXXXXX
- **donationDate**: Optional, valid ISO 8601 date
- **amount**: Optional, non-negative decimal

## Duplicate Detection Strategy
Primary key: **phone** (if email missing)
Fallback: **email** (if phone missing)
Action on duplicate: **Skip or merge** (decide per migration)
```

### 3. Verify Prisma schema

Check `prisma/schema.prisma` to ensure model exists:

```prisma
model Donor {
  id             String    @id @default(cuid())
  organizationId String    // Will be set to migration org
  
  // Required fields
  name           String
  
  // Optional fields  
  email          String?
  phone          String?
  donationDate   DateTime?
  amount         Decimal?
  notes          String?
  status         String?
  
  // Standard fields
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?
  
  @@index([organizationId])
  @@index([phone])
  @@unique([organizationId, email])  // If email unique per org
}
```

### 4. Create migration script

Path: `scripts/migrate-airtable-{modelName}.ts`

Template:
```typescript
import { PrismaClient } from '@prisma/client';
import Airtable from 'airtable';

// Initialize Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY,
});

const base = new Airtable.Base(process.env.AIRTABLE_BASE_ID);

// Target organization
const TARGET_ORG_ID = 'org-xyz'; // Pass as parameter

// Prisma client
const prisma = new PrismaClient();

// Deduplication tracking
const seenPhones = new Set<string>();
const seenEmails = new Set<string>();

interface AirtableDonorRecord {
  fields: {
    שם: string;
    'דוא"ל'?: string;
    טלפון?: string;
    תאריך?: string;
    סכום?: number;
    הערות?: string;
    מצב?: string;
  };
}

interface DonorCreateInput {
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  donationDate?: Date;
  amount?: string;
  notes?: string;
  status?: string;
}

async function main() {
  console.log('Starting Airtable → Prisma migration...');
  const DRY_RUN = process.env.DRY_RUN === 'true';
  console.log(`Dry run: ${DRY_RUN}`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors: { record: any; error: string }[] = [];

  try {
    // Fetch all records from Airtable
    const airtableRecords: AirtableDonorRecord[] = [];
    
    await base('תורמים').select().eachPage(
      (records) => {
        airtableRecords.push(...(records as AirtableDonorRecord[]));
      },
      (error) => {
        if (error) {
          console.error('Airtable fetch error:', error);
          throw error;
        }
      }
    );

    console.log(`Fetched ${airtableRecords.length} records from Airtable`);

    // Process each record
    for (const record of airtableRecords) {
      try {
        const { fields } = record;

        // Validate required fields
        if (!fields['שם'] || !fields['שם'].trim()) {
          errors.push({
            record: fields,
            error: 'Missing required field: name (שם)',
          });
          skipCount++;
          continue;
        }

        // Transform fields
        const name = fields['שם'].trim();
        const email = fields['דוא"ל']
          ? fields['דוא"ל'].trim().toLowerCase()
          : undefined;
        const phone = fields['טלפון']
          ? normalizePhoneNumber(fields['טלפון'].trim())
          : undefined;
        const donationDate = fields['תאריך']
          ? parseDate(fields['תאריך'])
          : undefined;
        const amount = fields['סכום']
          ? String(fields['סכום'])
          : undefined;
        const notes = fields['הערות'] ? fields['הערות'].trim() : undefined;
        const status = fields['מצב'] || 'unknown';

        // Validate email format
        if (email && !isValidEmail(email)) {
          errors.push({
            record: fields,
            error: `Invalid email format: ${email}`,
          });
          skipCount++;
          continue;
        }

        // Validate phone format (if present)
        if (phone && !isValidIsraeliPhone(phone)) {
          errors.push({
            record: fields,
            error: `Invalid phone format: ${phone}`,
          });
          skipCount++;
          continue;
        }

        // Detect duplicates by phone or email
        if (phone && seenPhones.has(phone)) {
          console.warn(`Skipping duplicate phone: ${phone}`);
          skipCount++;
          continue;
        }

        if (email && seenEmails.has(email)) {
          console.warn(`Skipping duplicate email: ${email}`);
          skipCount++;
          continue;
        }

        // Track for deduplication
        if (phone) seenPhones.add(phone);
        if (email) seenEmails.add(email);

        // Create donor object
        const donorData: DonorCreateInput = {
          organizationId: TARGET_ORG_ID,
          name,
          email,
          phone,
          donationDate,
          amount,
          notes,
          status,
        };

        console.log(`Processing: ${name}`);

        if (!DRY_RUN) {
          // Upsert by phone if available, else by email
          let existingDonor = null;

          if (phone) {
            existingDonor = await prisma.donor.findFirst({
              where: {
                organizationId: TARGET_ORG_ID,
                phone,
                deletedAt: null,
              },
            });
          }

          if (!existingDonor && email) {
            existingDonor = await prisma.donor.findFirst({
              where: {
                organizationId: TARGET_ORG_ID,
                email,
                deletedAt: null,
              },
            });
          }

          if (existingDonor) {
            // Update existing record
            await prisma.donor.update({
              where: { id: existingDonor.id },
              data: donorData,
            });
            console.log(`  Updated existing donor: ${existingDonor.id}`);
          } else {
            // Create new record
            const created = await prisma.donor.create({
              data: donorData,
            });
            console.log(`  Created new donor: ${created.id}`);
          }
        } else {
          console.log(`  [DRY RUN] Would create: ${donorData}`);
        }

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          record: record.fields,
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`Error processing record:`, error);
      }
    }

    // Print summary
    console.log('\n=== Migration Summary ===');
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`Total: ${successCount + skipCount + errorCount}`);

    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach(({ record, error }) => {
        console.log(`  ${record['שם']}: ${error}`);
      });
    }

    if (DRY_RUN) {
      console.log('\n⚠️  Dry run completed. No data written.');
      console.log('Run with DRY_RUN=false to write changes.');
    } else {
      console.log('\n✅ Migration complete.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions
function normalizePhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let normalized = phone.replace(/[\s\-()]/g, '');

  // Convert leading +972 to 0
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.slice(4);
  }

  return normalized;
}

function isValidIsraeliPhone(phone: string): boolean {
  // Israeli phone format: 05X-XXXXXXX or similar
  const pattern = /^0[1-9]\d{7,8}$/;
  return pattern.test(phone);
}

function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

function parseDate(dateStr: string): Date | undefined {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

main().catch(console.error);
```

### 5. Run migration script (dry run first)

```bash
# Set environment variables
export AIRTABLE_API_KEY="your-key"
export AIRTABLE_BASE_ID="your-base-id"
export DRY_RUN=true
export TARGET_ORG_ID="org-xyz"

# Run migration (preview)
pnpm tsx scripts/migrate-airtable-donor.ts

# Review output and errors
# Then run with DRY_RUN=false to commit
```

### 6. Review results

Check:
- [ ] Success count matches expected
- [ ] Skipped count documented (duplicates? missing fields?)
- [ ] Error count is low (investigate if high)
- [ ] No data integrity issues
- [ ] Phone numbers formatted correctly
- [ ] Email addresses normalized
- [ ] Dates parsed correctly

### 7. Verify data integrity

```bash
# Check imported records
pnpm prisma studio

# Or via SQL
SELECT COUNT(*) FROM "Donor" WHERE "organizationId" = 'org-xyz' AND "deletedAt" IS NULL;

# Spot-check a few records
SELECT "name", "email", "phone" FROM "Donor" LIMIT 10;
```

### 8. Never delete Airtable records

```bash
# NEVER do this:
# airtable delete "{baseId}" "{tableName}" "{recordId}"

# Airtable records are the source of truth for legacy data
# Keep them as an audit trail
```

### 9. Document migration

Create migration summary:

```markdown
## Migration: Airtable Donor Table → Prisma

**Date**: 2024-04-14
**Organization**: org-xyz
**Source**: Airtable - תורמים table
**Target**: Prisma Donor model
**Status**: ✅ Complete

### Results
- **Created**: 145 records
- **Updated**: 23 records
- **Skipped**: 8 records (duplicates)
- **Errors**: 2 records (invalid format)
- **Total**: 178 records processed

### Issues Encountered
- 2 records with invalid email format (skipped)
- 8 duplicate phone numbers (kept first occurrence)
- Date format variations (all successfully parsed)

### Validation
- All names present and non-empty
- 142 records with email
- 175 records with phone
- 89 records with donation history
- No cross-organization contamination

### Next Steps
- [ ] Review imported data in application
- [ ] Test donor search/filter functionality
- [ ] Update any sync/mapping code
- [ ] Archive migration script location
```

## Success Criteria

- [ ] All required fields present
- [ ] No data integrity violations
- [ ] Duplicates handled correctly
- [ ] Airtable records preserved
- [ ] organizationId scoped correctly
- [ ] Created records queryable in database
- [ ] Migration script documented
- [ ] Error report reviewed and validated
- [ ] Data spot-checked for accuracy
