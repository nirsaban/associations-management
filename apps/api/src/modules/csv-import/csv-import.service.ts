import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ImportResultDto, ImportRowErrorDto } from './dto/import-result.dto';

// Role mapping: Hebrew UI → internal
const ROLE_MAP: Record<string, { systemRole: 'USER'; groupRole?: 'MANAGER' | 'MEMBER' }> = {
  'תורם': { systemRole: 'USER' },
  'חבר קבוצה': { systemRole: 'USER', groupRole: 'MEMBER' },
  'מנהל קבוצה': { systemRole: 'USER', groupRole: 'MANAGER' },
};

function normalizePhone(phone: string): string {
  let trimmed = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  // CSV strips leading zero from phone numbers — pad it back
  if (/^[5-9]\d{7,8}$/.test(trimmed)) {
    trimmed = '0' + trimmed;
  }
  if (trimmed.startsWith('+972')) return trimmed;
  if (trimmed.startsWith('972')) return '+' + trimmed;
  if (trimmed.startsWith('0')) return '+972' + trimmed.slice(1);
  return trimmed;
}

function isValidIsraeliPhone(phone: string): boolean {
  let trimmed = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  // CSV strips leading zero — treat 9-digit numbers starting with 5-9 as valid
  if (/^[5-9]\d{7,8}$/.test(trimmed)) {
    trimmed = '0' + trimmed;
  }
  return /^(0[5-9]\d{7,8}|\+9725\d{8})$/.test(trimmed);
}

export interface UserImportValidateResult {
  validRows: ValidatedRow[];
  errorRows: ImportRowErrorDto[];
  summary: { validCount: number; errorCount: number };
}

export interface UserImportCommitResult {
  usersCreated: number;
  groupsCreated: number;
  membersCreated: number;
  managersCreated: number;
}

interface ValidatedRow {
  rowNum: number;
  phone: string;
  fullName: string;
  groupName: string | null;
  groupRole: 'MANAGER' | 'MEMBER' | null;
}

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate CSV rows without writing to DB
   */
  async validateUsers(
    organizationId: string,
    csvContent: string,
  ): Promise<UserImportValidateResult> {
    this.logger.log(`Validating users CSV for organization ${organizationId}`);

    const rows = this.parseCSV(csvContent);
    if (rows.length === 0) {
      throw new BadRequestException('קובץ CSV חייב לכלול לפחות שורת נתונים אחת');
    }

    const errors: ImportRowErrorDto[] = [];
    const validRows: ValidatedRow[] = [];

    // Track managers per group within this import
    const managersPerGroup = new Map<string, number>();

    // Pre-fetch existing phones in this org
    const existingUsers = await this.prisma.user.findMany({
      where: { organizationId, deletedAt: null },
      select: { phone: true },
    });
    const existingPhones = new Set(existingUsers.map((u) => u.phone));

    // Pre-fetch existing groups with managers
    const existingGroups = await this.prisma.group.findMany({
      where: { organizationId, deletedAt: null },
      select: { name: true, managerUserId: true },
    });
    const groupsWithManager = new Set(
      existingGroups.filter((g) => g.managerUserId).map((g) => g.name),
    );

    // Track phones within this CSV to detect duplicates
    const csvPhones = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header

      // Validate phone
      const rawPhone = String(row.phone || '').trim();
      if (!rawPhone) {
        errors.push({ row: rowNum, reason: 'מספר טלפון הוא שדה חובה', data: row });
        continue;
      }
      if (!isValidIsraeliPhone(rawPhone)) {
        errors.push({ row: rowNum, reason: `מספר טלפון לא תקין: ${rawPhone}`, data: row });
        continue;
      }
      const normalizedPhone = normalizePhone(rawPhone);

      // Validate fullName
      const fullName = String(row.fullName || '').trim();
      if (!fullName) {
        errors.push({ row: rowNum, reason: 'שם מלא הוא שדה חובה', data: row });
        continue;
      }
      if (fullName.length < 2) {
        errors.push({ row: rowNum, reason: 'שם מלא חייב להכיל לפחות 2 תווים', data: row });
        continue;
      }

      // Validate role
      const roleStr = String(row.role || '').trim();
      if (!roleStr) {
        errors.push({ row: rowNum, reason: 'תפקיד הוא שדה חובה', data: row });
        continue;
      }
      let roleDef = ROLE_MAP[roleStr];
      if (!roleDef) {
        errors.push({
          row: rowNum,
          reason: `תפקיד לא מוכר: "${roleStr}". ערכים אפשריים: תורם, חבר קבוצה, מנהל קבוצה`,
          data: row,
        });
        continue;
      }

      const groupName = String(row.groupName || '').trim() || null;

      // Validate groupName × role matrix
      if (!groupName && roleDef.groupRole === 'MEMBER') {
        errors.push({ row: rowNum, reason: 'חבר קבוצה חייב שם קבוצה', data: row });
        continue;
      }
      if (!groupName && roleDef.groupRole === 'MANAGER') {
        errors.push({ row: rowNum, reason: 'מנהל קבוצה חייב שם קבוצה', data: row });
        continue;
      }
      // If groupName is filled but role is תורם, auto-assign as חבר קבוצה
      if (groupName && !roleDef.groupRole) {
        roleDef = ROLE_MAP['חבר קבוצה'];
      }

      // Check phone uniqueness in org
      if (existingPhones.has(normalizedPhone)) {
        errors.push({ row: rowNum, reason: 'מספר הטלפון כבר קיים בעמותה', data: row });
        continue;
      }

      // Check phone uniqueness within CSV
      if (csvPhones.has(normalizedPhone)) {
        errors.push({ row: rowNum, reason: 'מספר טלפון כפול בקובץ', data: row });
        continue;
      }

      // Check manager uniqueness per group
      if (groupName && roleDef.groupRole === 'MANAGER') {
        if (groupsWithManager.has(groupName)) {
          errors.push({ row: rowNum, reason: 'כבר הוגדר מנהל לקבוצה זו', data: row });
          continue;
        }
        const csvManagerCount = managersPerGroup.get(groupName) || 0;
        if (csvManagerCount > 0) {
          errors.push({ row: rowNum, reason: 'כבר הוגדר מנהל לקבוצה זו', data: row });
          continue;
        }
        managersPerGroup.set(groupName, csvManagerCount + 1);
      }

      csvPhones.add(normalizedPhone);
      validRows.push({
        rowNum,
        phone: normalizedPhone,
        fullName,
        groupName,
        groupRole: roleDef.groupRole || null,
      });
    }

    return {
      validRows,
      errorRows: errors,
      summary: { validCount: validRows.length, errorCount: errors.length },
    };
  }

  /**
   * Commit validated rows in a single transaction
   */
  async commitUsers(
    organizationId: string,
    validRows: ValidatedRow[],
  ): Promise<UserImportCommitResult> {
    this.logger.log(`Committing ${validRows.length} users for organization ${organizationId}`);

    let usersCreated = 0;
    let groupsCreated = 0;
    let membersCreated = 0;
    let managersCreated = 0;

    await this.prisma.$transaction(async (tx) => {
      // Collect unique group names to create
      const groupNames = new Set<string>();
      for (const row of validRows) {
        if (row.groupName) groupNames.add(row.groupName);
      }

      // Fetch or create groups
      const groupMap = new Map<string, string>(); // groupName → groupId
      for (const name of groupNames) {
        let group = await tx.group.findFirst({
          where: { organizationId, name, deletedAt: null },
        });
        if (!group) {
          group = await tx.group.create({
            data: { organizationId, name, isActive: true },
          });
          groupsCreated++;
        }
        groupMap.set(name, group.id);
      }

      // Create users and memberships
      for (const row of validRows) {
        const user = await tx.user.create({
          data: {
            organizationId,
            phone: row.phone,
            fullName: row.fullName,
            systemRole: 'USER',
            isImported: true,
            isActive: true,
          },
        });
        usersCreated++;

        if (row.groupName && row.groupRole) {
          const groupId = groupMap.get(row.groupName)!;

          await tx.groupMembership.create({
            data: {
              organizationId,
              groupId,
              userId: user.id,
              role: row.groupRole,
              status: 'ACTIVE',
            },
          });

          if (row.groupRole === 'MANAGER') {
            // Set the manager on the group
            await tx.group.update({
              where: { id: groupId },
              data: { managerUserId: user.id },
            });
            managersCreated++;
          } else {
            membersCreated++;
          }
        }
      }
    });

    return { usersCreated, groupsCreated, membersCreated, managersCreated };
  }

  // Legacy methods kept for backward compatibility with existing families import
  async importUsers(
    organizationId: string,
    csvContent: string,
    dryRun: boolean,
  ): Promise<ImportResultDto> {
    const result = await this.validateUsers(organizationId, csvContent);

    if (dryRun) {
      return {
        totalRows: result.validRows.length + result.errorRows.length,
        validRows: result.validRows.length,
        invalidRows: result.errorRows.length,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errors: result.errorRows,
      };
    }

    const commitResult = await this.commitUsers(organizationId, result.validRows);
    return {
      totalRows: result.validRows.length + result.errorRows.length,
      validRows: result.validRows.length,
      invalidRows: result.errorRows.length,
      createdCount: commitResult.usersCreated,
      updatedCount: 0,
      skippedCount: 0,
      errors: result.errorRows,
    };
  }

  async importFamilies(
    organizationId: string,
    csvContent: string,
    dryRun: boolean,
  ): Promise<ImportResultDto> {
    this.logger.log(
      `${dryRun ? 'Previewing' : 'Committing'} families import for organization ${organizationId}`,
    );

    const rows = this.parseCSV(csvContent);
    const errors: ImportRowErrorDto[] = [];
    let validRows = 0;
    let createdCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      if (!row.familyName) {
        errors.push({ row: rowNum, reason: 'שדה חובה חסר: familyName', data: row });
        continue;
      }

      const familyName = String(row.familyName).trim();
      if (familyName.length < 2) {
        errors.push({ row: rowNum, reason: 'שם משפחה חייב להכיל לפחות 2 תווים', data: row });
        continue;
      }

      if (row.contactPhone) {
        const rawPhone = String(row.contactPhone).trim();
        if (!isValidIsraeliPhone(rawPhone)) {
          errors.push({ row: rowNum, reason: `מספר טלפון לא תקין: ${rawPhone}`, data: row });
          continue;
        }
      }

      validRows++;

      if (!dryRun) {
        const contactPhone = row.contactPhone
          ? normalizePhone(String(row.contactPhone).trim())
          : null;

        await this.prisma.family.create({
          data: {
            organizationId,
            familyName,
            address: row.address ? String(row.address).trim() : null,
            contactPhone,
            notes: row.notes ? String(row.notes).trim() : null,
          },
        });
        createdCount++;
      }
    }

    return {
      totalRows: rows.length,
      validRows,
      invalidRows: errors.length,
      createdCount,
      updatedCount: 0,
      skippedCount: 0,
      errors,
    };
  }

  private parseCSV(content: string): Record<string, unknown>[] {
    // Strip BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');
    const lines = cleanContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new BadRequestException('קובץ CSV חייב לכלול שורת כותרת ולפחות שורת נתונים אחת');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });

      rows.push(row);
    }

    return rows;
  }
}
