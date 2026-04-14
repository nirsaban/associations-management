# CSV Import

Handle CSV imports with validation, deduplication, preview, and error reporting.

## Input Parameters
- `csvFilePath` - Path to CSV file
- `entityType` - Type of entity to import: "users", "donors", "members", "volunteers", "families", "groups"
- `organizationId` - Target organization ID
- `dryRun` - Preview without committing (default: true)
- `mergeStrategy` - How to handle duplicates: "skip", "merge", "replace"

## Steps

### 1. Define CSV schemas per entity type

#### Users CSV Schema
```
Headers: ID, שם משפחה, שם פרטי, דוא"ל, טלפון, תפקיד, הערות

Fields:
- ID (optional): Internal reference, will be ignored if auto-ID
- שם משפחה (required): Last name
- שם פרטי (required): First name
- דוא"ל (required): Email, must be unique per organization
- טלפון (optional): Phone number, Israeli format
- תפקיד (required): Role (Admin, Manager, Viewer)
- הערות (optional): Notes
```

#### Donors CSV Schema
```
Headers: ID, שם, דוא"ל, טלפון, עיר, מצב, סכום כולל, תאריך תרומה אחרונה, הערות

Fields:
- ID (optional): Internal reference
- שם (required): Donor name
- דוא"ל (optional): Email
- טלפון (optional but recommended): Phone number, Israeli format
- עיר (optional): City
- מצב (optional): Status (פעיל, לא_פעיל, חדש)
- סכום כולל (optional): Total donations
- תאריך תרומה אחרונה (optional): Last donation date (YYYY-MM-DD)
- הערות (optional): Notes
```

#### Members CSV Schema
```
Headers: ID, שם, דוא"ל, טלפון, תאריך הצטרפות, סטטוס, קבוצה

Fields:
- ID (optional): Internal reference
- שם (required): Member name
- דוא"ל (optional): Email
- טלפון (optional): Phone
- תאריך הצטרפות (optional): Join date (YYYY-MM-DD)
- סטטוס (optional): Status (פעיל, לא_פעיל)
- קבוצה (optional): Group name
```

#### Volunteers CSV Schema
```
Headers: ID, שם, דוא"ל, טלפון, שעות, תאריך הצטרפות, תחום התנדבות, סטטוס

Fields:
- ID (optional): Internal reference
- שם (required): Volunteer name
- דוא"ל (optional): Email
- טלפון (optional): Phone
- שעות (optional): Total hours
- תאריך הצטרפות (optional): Join date (YYYY-MM-DD)
- תחום התנדבות (optional): Volunteer type/area
- סטטוס (optional): Status (פעיל, לא_פעיל)
```

#### Families CSV Schema
```
Headers: ID, שם משפחה, שם איש קשר, דוא"ל, טלפון, גודל משפחה, סטטוס, הערות

Fields:
- ID (optional): Internal reference
- שם משפחה (required): Family name
- שם איש קשר (required): Contact person name
- דוא"ל (optional): Email
- טלפון (required): Phone number, Israeli format
- גודל משפחה (optional): Number of family members
- סטטוס (optional): Status (פעיל, לא_פעיל)
- הערות (optional): Notes
```

#### Groups CSV Schema
```
Headers: ID, שם הקבוצה, תיאור, כמות חברים, מנהל הקבוצה, סטטוס

Fields:
- ID (optional): Internal reference
- שם הקבוצה (required): Group name
- תיאור (optional): Group description
- כמות חברים (optional): Member count
- מנהל הקבוצה (optional): Group manager name
- סטטוס (optional): Status (פעיל, לא_פעיל)
```

### 2. Create import script

Path: `scripts/import-csv-{entityType}.ts`

Template:
```typescript
import fs from 'fs';
import csv from 'csv-parse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ImportOptions {
  csvFilePath: string;
  organizationId: string;
  entityType: 'users' | 'donors' | 'members' | 'volunteers' | 'families' | 'groups';
  dryRun: boolean;
  mergeStrategy: 'skip' | 'merge' | 'replace';
}

interface ImportResult {
  success: number;
  skipped: number;
  errors: number;
  total: number;
  errorDetails: { row: number; error: string }[];
  preview: any[];
}

// Track duplicates within import
const importedEmails = new Set<string>();
const importedPhones = new Set<string>();

async function importCSV(options: ImportOptions): Promise<ImportResult> {
  const {
    csvFilePath,
    organizationId,
    entityType,
    dryRun,
    mergeStrategy,
  } = options;

  console.log(`Starting CSV import: ${entityType}`);
  console.log(`File: ${csvFilePath}`);
  console.log(`Organization: ${organizationId}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Merge strategy: ${mergeStrategy}\n`);

  const result: ImportResult = {
    success: 0,
    skipped: 0,
    errors: 0,
    total: 0,
    errorDetails: [],
    preview: [],
  };

  return new Promise((resolve) => {
    const parser = fs.createReadStream(csvFilePath).pipe(
      csv.parse({
        columns: true,
        trim: true,
        skip_empty_lines: true,
        encoding: 'utf-8',
      })
    );

    let rowNumber = 1;

    parser.on('data', async (row: any) => {
      try {
        console.log(`\n📄 Row ${rowNumber}: ${row.שם || row['שם משפחה'] || 'Unknown'}`);

        // Validate headers
        const validation = validateRow(row, entityType, rowNumber);
        if (!validation.isValid) {
          console.warn(`  ❌ ${validation.error}`);
          result.errorDetails.push({
            row: rowNumber,
            error: validation.error,
          });
          result.errors++;
          rowNumber++;
          return;
        }

        // Parse and transform
        const parsedData = parseRow(row, entityType);

        // Check for duplicates
        const isDuplicate = checkDuplicate(parsedData, entityType);
        if (isDuplicate && mergeStrategy === 'skip') {
          console.log(`  ⏭️  Skipped (duplicate)`);
          result.skipped++;
          rowNumber++;
          return;
        }

        // Track for deduplication
        if (parsedData.email) importedEmails.add(parsedData.email);
        if (parsedData.phone) importedPhones.add(parsedData.phone);

        // Add to preview
        if (result.preview.length < 5) {
          result.preview.push(parsedData);
        }

        if (!dryRun) {
          // Import into database
          const dbResult = await importRow(
            parsedData,
            organizationId,
            entityType,
            mergeStrategy
          );

          if (dbResult) {
            console.log(`  ✅ Imported (ID: ${dbResult.id})`);
            result.success++;
          } else {
            console.log(`  ⏭️  Skipped (already exists)`);
            result.skipped++;
          }
        } else {
          console.log(`  ✅ [DRY RUN] Would import`);
          result.success++;
        }

        result.total++;
      } catch (error) {
        console.error(`  ❌ Error:`, error);
        result.errorDetails.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : String(error),
        });
        result.errors++;
        result.total++;
      }

      rowNumber++;
    });

    parser.on('end', () => {
      console.log('\n=== Import Summary ===');
      console.log(`✅ Imported: ${result.success}`);
      console.log(`⏭️  Skipped: ${result.skipped}`);
      console.log(`❌ Errors: ${result.errors}`);
      console.log(`Total: ${result.total}`);

      if (result.errorDetails.length > 0) {
        console.log('\n=== Errors ===');
        result.errorDetails.forEach(({ row, error }) => {
          console.log(`  Row ${row}: ${error}`);
        });
      }

      if (result.preview.length > 0) {
        console.log('\n=== Preview (first 5 rows) ===');
        console.table(result.preview);
      }

      if (dryRun) {
        console.log('\n⚠️  Dry run completed. No data written.');
      } else {
        console.log('\n✅ Import complete.');
      }

      resolve(result);
    });

    parser.on('error', (error) => {
      console.error('CSV parse error:', error);
      result.errors++;
      resolve(result);
    });
  });
}

function validateRow(
  row: any,
  entityType: string,
  rowNumber: number
): { isValid: boolean; error?: string } {
  switch (entityType) {
    case 'users':
      if (!row['דוא"ל']) return { isValid: false, error: 'Missing email' };
      if (!row['שם משפחה'])
        return { isValid: false, error: 'Missing last name' };
      if (!row['שם פרטי'])
        return { isValid: false, error: 'Missing first name' };
      if (!isValidEmail(row['דוא"ל']))
        return { isValid: false, error: 'Invalid email format' };
      break;

    case 'donors':
      if (!row['שם']) return { isValid: false, error: 'Missing name' };
      if (row['טלפון'] && !isValidIsraeliPhone(row['טלפון']))
        return { isValid: false, error: 'Invalid phone format' };
      break;

    case 'families':
      if (!row['שם משפחה'])
        return { isValid: false, error: 'Missing family name' };
      if (!row['שם איש קשר'])
        return { isValid: false, error: 'Missing contact name' };
      if (!row['טלפון'])
        return { isValid: false, error: 'Missing phone number' };
      if (!isValidIsraeliPhone(row['טלפון']))
        return { isValid: false, error: 'Invalid phone format' };
      break;

    // Add other entity type validations...
  }

  return { isValid: true };
}

function parseRow(row: any, entityType: string): any {
  const parsed: any = {
    name: row['שם'] || `${row['שם פרטי']} ${row['שם משפחה']}`,
    email: row['דוא"ל'] ? row['דוא"ל'].toLowerCase().trim() : undefined,
    phone: row['טלפון']
      ? normalizePhoneNumber(row['טלפון'].trim())
      : undefined,
  };

  // Entity-specific fields
  if (entityType === 'users') {
    parsed.role = row['תפקיד'] || 'Viewer';
    parsed.firstName = row['שם פרטי'];
    parsed.lastName = row['שם משפחה'];
  }

  if (entityType === 'donors') {
    parsed.city = row['עיר'] || undefined;
    parsed.status = row['מצב'] || 'חדש';
    parsed.totalDonations = row['סכום כולל']
      ? parseFloat(row['סכום כולל'])
      : undefined;
    parsed.lastDonationDate = row['תאריך תרומה אחרונה']
      ? new Date(row['תאריך תרומה אחרונה'])
      : undefined;
  }

  if (entityType === 'families') {
    parsed.familyName = row['שם משפחה'];
    parsed.contactName = row['שם איש קשר'];
    parsed.familySize = row['גודל משפחה']
      ? parseInt(row['גודל משפחה'], 10)
      : undefined;
  }

  parsed.notes = row['הערות'] || undefined;

  return parsed;
}

function checkDuplicate(data: any, entityType: string): boolean {
  // Check if email or phone already in import batch
  if (data.email && importedEmails.has(data.email)) {
    return true;
  }
  if (data.phone && importedPhones.has(data.phone)) {
    return true;
  }
  return false;
}

async function importRow(
  data: any,
  organizationId: string,
  entityType: string,
  mergeStrategy: string
): Promise<any> {
  switch (entityType) {
    case 'donors':
      return importDonor(data, organizationId, mergeStrategy);
    case 'users':
      return importUser(data, organizationId, mergeStrategy);
    case 'families':
      return importFamily(data, organizationId, mergeStrategy);
    // Add other entity type imports...
  }
}

async function importDonor(data: any, orgId: string, strategy: string) {
  // Check if donor exists
  let existing = null;

  if (data.phone) {
    existing = await prisma.donor.findFirst({
      where: {
        organizationId: orgId,
        phone: data.phone,
        deletedAt: null,
      },
    });
  }

  if (!existing && data.email) {
    existing = await prisma.donor.findFirst({
      where: {
        organizationId: orgId,
        email: data.email,
        deletedAt: null,
      },
    });
  }

  if (existing) {
    if (strategy === 'replace') {
      // Update existing record
      return await prisma.donor.update({
        where: { id: existing.id },
        data: {
          ...data,
          organizationId: orgId,
          updatedAt: new Date(),
        },
      });
    } else {
      // Skip if already exists
      return null;
    }
  }

  // Create new donor
  return await prisma.donor.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  });
}

async function importUser(data: any, orgId: string, strategy: string) {
  // Similar pattern to importDonor
  let existing = await prisma.user.findFirst({
    where: {
      organizationId: orgId,
      email: data.email,
    },
  });

  if (existing && strategy === 'replace') {
    return await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...data,
        organizationId: orgId,
      },
    });
  } else if (existing) {
    return null;
  }

  return await prisma.user.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  });
}

async function importFamily(data: any, orgId: string, strategy: string) {
  // Similar pattern
  let existing = await prisma.family.findFirst({
    where: {
      organizationId: orgId,
      phone: data.phone,
      deletedAt: null,
    },
  });

  if (existing && strategy === 'replace') {
    return await prisma.family.update({
      where: { id: existing.id },
      data: {
        ...data,
        organizationId: orgId,
      },
    });
  } else if (existing) {
    return null;
  }

  return await prisma.family.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  });
}

// Helper functions
function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/[\s\-()]/g, '');
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.slice(4);
  }
  return normalized;
}

function isValidIsraeliPhone(phone: string): boolean {
  const pattern = /^0[1-9]\d{7,8}$/;
  return pattern.test(phone);
}

function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// Main execution
const csvPath = process.argv[2] || './import.csv';
const entityType = process.argv[3] || 'donors';
const orgId = process.argv[4] || 'org-default';
const dryRun = process.argv[5] !== 'commit';

importCSV({
  csvFilePath: csvPath,
  organizationId: orgId,
  entityType: entityType as any,
  dryRun,
  mergeStrategy: 'skip',
})
  .then((result) => {
    process.exit(result.errors > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

### 3. Run import with dry run

```bash
# Prepare CSV file in project root or uploads directory
# Format: UTF-8 encoding, Hebrew headers, proper delimiters

# Run dry run (preview)
pnpm tsx scripts/import-csv-donors.ts ./donors.csv donors org-xyz

# Review output:
# - How many will be imported
# - How many duplicates
# - Error details
# - Preview of first 5 rows
```

### 4. Review results

Check dry run output:
- [ ] Import count seems reasonable
- [ ] Skipped count matches duplicates found
- [ ] Error count is low
- [ ] Preview looks correct
- [ ] All phone numbers properly formatted
- [ ] All emails normalized to lowercase

### 5. Run import for real

```bash
# Once dry run looks good, run actual import
pnpm tsx scripts/import-csv-donors.ts ./donors.csv donors org-xyz commit

# Monitor output for any errors
```

### 6. Verify imported data

```bash
# Check in database
pnpm prisma studio

# Or via SQL
SELECT COUNT(*) FROM "Donor" WHERE "organizationId" = 'org-xyz' AND "deletedAt" IS NULL;

# Check email uniqueness
SELECT "email", COUNT(*) as count FROM "Donor" 
WHERE "organizationId" = 'org-xyz' AND "deletedAt" IS NULL
GROUP BY "email" HAVING count > 1;

# Spot-check records
SELECT "name", "email", "phone" FROM "Donor" LIMIT 20;
```

### 7. Document import

Create summary:
```markdown
## CSV Import Summary

**Date**: 2024-04-14
**Entity Type**: Donors
**Organization**: org-xyz
**File**: donors.csv
**Status**: ✅ Complete

### Results
- **Imported**: 245
- **Skipped**: 12 (duplicates)
- **Errors**: 3
- **Total Processed**: 260

### Error Details
- Row 105: Invalid email format
- Row 178: Invalid phone number
- Row 203: Missing required name field

### Data Validation
- 243 with valid emails
- 258 with valid phone numbers
- All names populated
- 0 cross-organization records

### Next Steps
- [ ] Spot-check imported records in UI
- [ ] Run queries to verify data integrity
- [ ] Test search/filter functionality
- [ ] Archive CSV file
```

## Success Criteria

- [ ] CSV properly formatted with correct headers
- [ ] All required fields present
- [ ] Phone numbers normalized
- [ ] Emails converted to lowercase
- [ ] Duplicates handled per merge strategy
- [ ] No cross-organization data
- [ ] organizationId correctly set
- [ ] Error report reviewed
- [ ] Imported records verified in database
- [ ] Dry run matches actual results
