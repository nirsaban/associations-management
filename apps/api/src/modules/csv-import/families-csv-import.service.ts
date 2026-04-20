import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { parse } from 'csv-parse/sync';

function normalizePhone(phone: string): string {
  let trimmed = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (/^[5-9]\d{7,8}$/.test(trimmed)) {
    trimmed = '0' + trimmed;
  }
  // Always store in 0-prefix format
  if (trimmed.startsWith('+972')) return '0' + trimmed.slice(4);
  if (trimmed.startsWith('972')) return '0' + trimmed.slice(3);
  return trimmed;
}

function isValidIsraeliPhone(phone: string): boolean {
  let trimmed = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (/^[5-9]\d{7,8}$/.test(trimmed)) {
    trimmed = '0' + trimmed;
  }
  return /^(0[5-9]\d{7,8}|\+9725\d{8})$/.test(trimmed);
}

// --- Types ---

export interface FieldDiff {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface FamilyGroupLink {
  name: string;
  action: 'link_existing' | 'auto_create' | 'clear' | 'none';
}

export interface FamilyValidatedRow {
  rowNumber: number;
  familyName: string;
  action: 'create' | 'update';
  fieldDiff: FieldDiff[];
  groupLink: FamilyGroupLink | null;
  status: 'valid' | 'valid_with_warnings' | 'error';
  warnings: string[];
  errors: { field: string; message: string }[];
  // Internal data for commit
  contactPhone: string | null;
  childrenMinorCount: number | null;
  totalMemberCount: number | null;
  address: string | null;
  groupName: string | null;
}

export interface FamilyValidateResult {
  summary: {
    totalRows: number;
    validRows: number;
    rowsWithWarnings: number;
    rowsWithErrors: number;
    familiesToCreate: number;
    familiesToUpdate: number;
    groupsToAutoCreate: number;
  };
  rows: FamilyValidatedRow[];
}

export interface FamilyCommitResult {
  familiesCreated: number;
  familiesUpdated: number;
  groupsAutoCreated: number;
  familiesLinkedToGroup: number;
  familyGroupsCleared: number;
}

@Injectable()
export class FamiliesCsvImportService {
  private readonly logger = new Logger(FamiliesCsvImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validateFamilies(
    organizationId: string,
    csvContent: string,
  ): Promise<FamilyValidateResult> {
    this.logger.log(`Validating families CSV for organization ${organizationId}`);

    const records = this.parseCsv(csvContent);
    if (records.length === 0) {
      throw new BadRequestException('קובץ CSV חייב לכלול לפחות שורת נתונים אחת');
    }

    // Pre-fetch existing families in org
    const existingFamilies = await this.prisma.family.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, familyName: true, contactPhone: true, childrenMinorCount: true, totalMemberCount: true, address: true, groupId: true },
    });
    const familyByName = new Map(existingFamilies.map((f) => [f.familyName, f]));

    // Pre-fetch existing groups in org
    const existingGroups = await this.prisma.group.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true },
    });
    const groupByName = new Map(existingGroups.map((g) => [g.name, g]));

    // Pre-fetch existing user phones in org (both raw and normalized)
    const orgUsers = await this.prisma.user.findMany({
      where: { organizationId, deletedAt: null },
      select: { phone: true },
    });
    const userPhones = new Set<string>();
    for (const u of orgUsers) {
      userPhones.add(u.phone);
      userPhones.add(normalizePhone(u.phone));
    }

    // Pre-fetch existing family contactPhones in org
    const familyPhones = new Map<string, string>(); // normalized phone → familyName
    for (const f of existingFamilies) {
      if (f.contactPhone) {
        familyPhones.set(normalizePhone(f.contactPhone), f.familyName);
        familyPhones.set(f.contactPhone, f.familyName);
      }
    }

    // Deduplicate: last row with same familyName wins
    const lastRowByName = new Map<string, number>(); // familyName → last row index
    for (let i = 0; i < records.length; i++) {
      const name = (records[i].familyName || '').trim();
      if (name) lastRowByName.set(name, i);
    }

    const rows: FamilyValidatedRow[] = [];
    let familiesToCreate = 0;
    let familiesToUpdate = 0;
    let groupsToAutoCreate = 0;
    const autoCreatedGroupNames = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowNum = i + 2;
      const familyName = (rec.familyName || '').trim();

      const row: FamilyValidatedRow = {
        rowNumber: rowNum,
        familyName,
        action: 'create',
        fieldDiff: [],
        groupLink: null,
        status: 'valid',
        warnings: [],
        errors: [],
        contactPhone: null,
        childrenMinorCount: null,
        totalMemberCount: null,
        address: null,
        groupName: null,
      };

      // Validate familyName
      if (!familyName) {
        row.errors.push({ field: 'familyName', message: 'שם משפחה הוא שדה חובה' });
        row.status = 'error';
        rows.push(row);
        continue;
      }

      // Check if this is a duplicate name within CSV (not the last occurrence)
      if (lastRowByName.get(familyName) !== i) {
        row.warnings.push('שם משפחה חוזר — שורה אחרונה קובעת');
        row.status = 'valid_with_warnings';
        // Still process for preview but mark it
      }

      // Parse contactPhone
      const rawPhone = (rec.contactPhone || '').trim();
      if (rawPhone) {
        if (!isValidIsraeliPhone(rawPhone)) {
          row.errors.push({ field: 'contactPhone', message: `מספר טלפון לא תקין: ${rawPhone}` });
          row.status = 'error';
          rows.push(row);
          continue;
        }
        const normalized = normalizePhone(rawPhone);
        row.contactPhone = normalized;

        // Check conflict with existing users in same org
        if (userPhones.has(normalized) || userPhones.has(rawPhone)) {
          row.errors.push({
            field: 'contactPhone',
            message: 'טלפון איש קשר כבר שייך למשתמש קיים בעמותה. אנא בחר אחד מהשניים — או שהטלפון משויך למשתמש, או לאיש קשר של משפחה',
          });
          row.status = 'error';
          rows.push(row);
          continue;
        }

        // Check duplicate with other families (warning, not error)
        const otherFamily = familyPhones.get(normalized);
        if (otherFamily && otherFamily !== familyName) {
          row.warnings.push(`טלפון זה כבר מופיע במשפחה אחרת (${otherFamily})`);
        }
      }

      // Parse childrenMinorCount
      const childrenRaw = (rec.childrenMinorCount || '').trim();
      if (childrenRaw) {
        const parsed = parseInt(childrenRaw, 10);
        if (isNaN(parsed) || parsed < 0 || String(parsed) !== childrenRaw) {
          row.errors.push({ field: 'childrenMinorCount', message: 'מספר ילדים קטינים חייב להיות מספר שלם חיובי או אפס' });
          row.status = 'error';
          rows.push(row);
          continue;
        }
        row.childrenMinorCount = parsed;
      }

      // Parse totalMemberCount
      const totalRaw = (rec.totalMemberCount || '').trim();
      if (totalRaw) {
        const parsed = parseInt(totalRaw, 10);
        if (isNaN(parsed) || parsed < 1 || String(parsed) !== totalRaw) {
          row.errors.push({ field: 'totalMemberCount', message: 'סך נפשות חייב להיות מספר שלם חיובי (1 ומעלה)' });
          row.status = 'error';
          rows.push(row);
          continue;
        }
        row.totalMemberCount = parsed;
      }

      // Cross-validate children vs total
      if (row.childrenMinorCount !== null && row.totalMemberCount !== null) {
        if (row.childrenMinorCount > row.totalMemberCount) {
          row.errors.push({ field: 'childrenMinorCount', message: 'מספר הילדים הקטינים לא יכול לעלות על סך הנפשות במשפחה' });
          row.status = 'error';
          rows.push(row);
          continue;
        }
      }

      // Parse address
      const addressRaw = (rec.address || '').trim();
      row.address = addressRaw || null;

      // Parse groupName
      const groupName = (rec.groupName || '').trim();
      row.groupName = groupName || null;

      // Determine action (create vs update)
      const existing = familyByName.get(familyName);
      if (existing) {
        row.action = 'update';
        familiesToUpdate++;

        // Calculate field diffs
        const diffs: FieldDiff[] = [];
        if ((row.contactPhone || null) !== (existing.contactPhone || null)) {
          diffs.push({ field: 'contactPhone', oldValue: existing.contactPhone, newValue: row.contactPhone });
        }
        if (row.childrenMinorCount !== existing.childrenMinorCount) {
          diffs.push({ field: 'childrenMinorCount', oldValue: existing.childrenMinorCount?.toString() ?? null, newValue: row.childrenMinorCount?.toString() ?? null });
        }
        if (row.totalMemberCount !== existing.totalMemberCount) {
          diffs.push({ field: 'totalMemberCount', oldValue: existing.totalMemberCount?.toString() ?? null, newValue: row.totalMemberCount?.toString() ?? null });
        }
        if ((row.address || null) !== (existing.address || null)) {
          diffs.push({ field: 'address', oldValue: existing.address, newValue: row.address });
        }
        row.fieldDiff = diffs;
      } else {
        row.action = 'create';
        familiesToCreate++;
      }

      // Group link resolution
      if (groupName) {
        const existingGroup = groupByName.get(groupName);
        if (existingGroup) {
          row.groupLink = { name: groupName, action: 'link_existing' };
        } else if (autoCreatedGroupNames.has(groupName)) {
          row.groupLink = { name: groupName, action: 'link_existing' };
        } else {
          row.groupLink = { name: groupName, action: 'auto_create' };
          autoCreatedGroupNames.add(groupName);
          groupsToAutoCreate++;
          row.warnings.push('קבוצה נוצרה אוטומטית — יש לשייך לה מנהל');
        }
      } else if (existing && existing.groupId) {
        // Had a group before, now clearing
        row.groupLink = { name: '', action: 'clear' };
        row.warnings.push('שיוך לקבוצה יוסר');
      } else {
        row.groupLink = { name: '', action: 'none' };
      }

      // Set final status
      if (row.status !== 'error' && row.warnings.length > 0) {
        row.status = 'valid_with_warnings';
      }

      rows.push(row);
    }

    const validRows = rows.filter((r) => r.status !== 'error').length;
    const rowsWithWarnings = rows.filter((r) => r.status === 'valid_with_warnings').length;
    const rowsWithErrors = rows.filter((r) => r.status === 'error').length;

    return {
      summary: {
        totalRows: records.length,
        validRows,
        rowsWithWarnings,
        rowsWithErrors,
        familiesToCreate,
        familiesToUpdate,
        groupsToAutoCreate,
      },
      rows,
    };
  }

  async commitFamilies(
    organizationId: string,
    validatedRows: FamilyValidatedRow[],
  ): Promise<FamilyCommitResult> {
    this.logger.log(`Committing families for organization ${organizationId}`);

    // Only import rows that aren't errors, and for duplicate names only the last row
    const importableRows = this.deduplicateRows(
      validatedRows.filter((r) => r.status !== 'error'),
    );

    if (importableRows.length === 0) {
      return { familiesCreated: 0, familiesUpdated: 0, groupsAutoCreated: 0, familiesLinkedToGroup: 0, familyGroupsCleared: 0 };
    }

    let familiesCreated = 0;
    let familiesUpdated = 0;
    let groupsAutoCreated = 0;
    let familiesLinkedToGroup = 0;
    let familyGroupsCleared = 0;

    await this.prisma.$transaction(async (tx) => {
      // Pre-fetch groups
      const existingGroups = await tx.group.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, name: true },
      });
      const groupByName = new Map(existingGroups.map((g) => [g.name, g.id]));

      for (const row of importableRows) {
        // Resolve groupId
        let groupId: string | null = null;
        if (row.groupName) {
          if (groupByName.has(row.groupName)) {
            groupId = groupByName.get(row.groupName)!;
          } else {
            // Auto-create group
            const newGroup = await tx.group.create({
              data: { organizationId, name: row.groupName, isActive: true },
            });
            groupByName.set(row.groupName, newGroup.id);
            groupId = newGroup.id;
            groupsAutoCreated++;
          }
          familiesLinkedToGroup++;
        }

        // Check if family exists
        const existing = await tx.family.findFirst({
          where: { organizationId, familyName: row.familyName, deletedAt: null },
        });

        if (existing) {
          // Track if group is being cleared
          if (existing.groupId && !groupId) {
            familyGroupsCleared++;
          }

          await tx.family.update({
            where: { id: existing.id },
            data: {
              contactPhone: row.contactPhone,
              childrenMinorCount: row.childrenMinorCount,
              totalMemberCount: row.totalMemberCount,
              address: row.address,
              groupId,
            },
          });
          familiesUpdated++;
        } else {
          await tx.family.create({
            data: {
              organizationId,
              familyName: row.familyName,
              contactPhone: row.contactPhone,
              childrenMinorCount: row.childrenMinorCount,
              totalMemberCount: row.totalMemberCount,
              address: row.address,
              groupId,
              status: 'active',
            },
          });
          familiesCreated++;
        }
      }
    });

    return { familiesCreated, familiesUpdated, groupsAutoCreated, familiesLinkedToGroup, familyGroupsCleared };
  }

  // For duplicate familyName within CSV, only keep the last occurrence
  private deduplicateRows(rows: FamilyValidatedRow[]): FamilyValidatedRow[] {
    const lastByName = new Map<string, FamilyValidatedRow>();
    for (const row of rows) {
      lastByName.set(row.familyName, row);
    }
    return Array.from(lastByName.values());
  }

  private parseCsv(content: string): Record<string, string>[] {
    const cleanContent = content.replace(/^\uFEFF/, '');
    try {
      const records = parse(cleanContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
      }) as Record<string, string>[];
      return records;
    } catch (err: any) {
      throw new BadRequestException(`שגיאה בקריאת CSV: ${err.message}`);
    }
  }
}
