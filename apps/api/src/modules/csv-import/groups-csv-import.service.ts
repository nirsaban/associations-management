import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { parse } from 'csv-parse/sync';

// Phone normalization (shared logic)
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

export interface GroupRowMember {
  phone: string;
  exists: boolean;
}

export interface GroupRowFamily {
  name: string;
  action: 'link_existing' | 'auto_create' | 'replace_link';
}

export interface GroupValidatedRow {
  rowNumber: number;
  groupName: string;
  phoneManager: string;
  members: GroupRowMember[];
  families: GroupRowFamily[];
  status: 'valid' | 'valid_with_warnings' | 'error';
  warnings: string[];
  errors: { field: string; message: string }[];
}

export interface GroupValidateResult {
  summary: {
    totalRows: number;
    validRows: number;
    rowsWithWarnings: number;
    rowsWithErrors: number;
    groupsToCreate: number;
    groupsToUpdate: number;
    familiesToAutoCreate: number;
    skippedMemberPhones: number;
  };
  rows: GroupValidatedRow[];
}

export interface GroupCommitResult {
  groupsCreated: number;
  groupsUpdated: number;
  membersAdded: number;
  managersAssigned: number;
  managersReplaced: number;
  familiesCreated: number;
  familiesLinked: number;
  skippedMemberPhones: { row: number; phone: string; reason: string }[];
}

@Injectable()
export class GroupsCsvImportService {
  private readonly logger = new Logger(GroupsCsvImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validateGroups(
    organizationId: string,
    csvContent: string,
  ): Promise<GroupValidateResult> {
    this.logger.log(`Validating groups CSV for organization ${organizationId}`);

    const records = this.parseCsv(csvContent);
    if (records.length === 0) {
      throw new BadRequestException('קובץ CSV חייב לכלול לפחות שורת נתונים אחת');
    }

    // Pre-fetch org users (phone → id) — map both raw and normalized forms
    const orgUsers = await this.prisma.user.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, phone: true },
    });
    const userByPhone = new Map<string, string>();
    for (const u of orgUsers) {
      userByPhone.set(u.phone, u.id);
      userByPhone.set(normalizePhone(u.phone), u.id);
    }

    // Pre-fetch existing groups
    const existingGroups = await this.prisma.group.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true, managerUserId: true },
    });
    const groupByName = new Map(existingGroups.map((g) => [g.name, g]));

    // Pre-fetch families
    const existingFamilies = await this.prisma.family.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, familyName: true, groupId: true },
    });
    const familyByName = new Map(existingFamilies.map((f) => [f.familyName, f]));

    // First pass: merge rows with same groupName
    const mergedRows = this.mergeRows(records);

    const rows: GroupValidatedRow[] = [];
    let groupsToCreate = 0;
    let groupsToUpdate = 0;
    let familiesToAutoCreate = 0;
    let totalSkippedPhones = 0;

    for (const merged of mergedRows) {
      const rowResult: GroupValidatedRow = {
        rowNumber: merged.firstRowNum,
        groupName: merged.groupName,
        phoneManager: merged.phoneManager,
        members: [],
        families: [],
        status: 'valid',
        warnings: [],
        errors: [],
      };

      // Add merge warnings
      if (merged.mergedFromRows.length > 1) {
        rowResult.warnings.push(
          `קבוצה "${merged.groupName}" הופיעה ב-${merged.mergedFromRows.length} שורות — מוזגו (שורות ${merged.mergedFromRows.join(', ')})`,
        );
      }

      // Validate groupName
      if (!merged.groupName) {
        rowResult.errors.push({ field: 'groupName', message: 'שם קבוצה הוא שדה חובה' });
        rowResult.status = 'error';
        rows.push(rowResult);
        continue;
      }

      // Validate phoneManager format
      if (!merged.phoneManager) {
        rowResult.errors.push({ field: 'phoneManager', message: 'טלפון מנהל הוא שדה חובה' });
        rowResult.status = 'error';
        rows.push(rowResult);
        continue;
      }

      if (!isValidIsraeliPhone(merged.phoneManager)) {
        rowResult.errors.push({ field: 'phoneManager', message: `מספר טלפון מנהל לא תקין: ${merged.phoneManager}` });
        rowResult.status = 'error';
        rows.push(rowResult);
        continue;
      }

      const normalizedManager = normalizePhone(merged.phoneManager);
      rowResult.phoneManager = normalizedManager;

      // Validate phoneManager exists in org
      if (!userByPhone.has(normalizedManager)) {
        rowResult.errors.push({ field: 'phoneManager', message: `מנהל ${merged.phoneManager} לא נמצא כמשתמש בעמותה` });
        rowResult.status = 'error';
        rows.push(rowResult);
        continue;
      }

      // Check existing group
      const existingGroup = groupByName.get(merged.groupName);
      if (existingGroup) {
        groupsToUpdate++;
        rowResult.warnings.push('קבוצה קיימת תעודכן');
        // Check manager replacement
        if (existingGroup.managerUserId) {
          const existingManagerId = existingGroup.managerUserId;
          const newManagerId = userByPhone.get(normalizedManager)!;
          if (existingManagerId !== newManagerId) {
            rowResult.warnings.push('מנהל הקבוצה יוחלף');
          }
        }
      } else {
        groupsToCreate++;
      }

      // Validate members
      const memberPhones = new Set<string>();
      for (const rawPhone of merged.memberPhones) {
        if (!rawPhone) continue;
        if (!isValidIsraeliPhone(rawPhone)) {
          rowResult.members.push({ phone: rawPhone, exists: false });
          rowResult.warnings.push(`טלפון חבר לא תקין: ${rawPhone} — ידלג`);
          totalSkippedPhones++;
          continue;
        }
        const normalized = normalizePhone(rawPhone);
        if (memberPhones.has(normalized) || normalized === normalizedManager) {
          // Deduplicate silently
          continue;
        }
        memberPhones.add(normalized);

        if (userByPhone.has(normalized)) {
          rowResult.members.push({ phone: normalized, exists: true });
        } else {
          rowResult.members.push({ phone: normalized, exists: false });
          rowResult.warnings.push(`חבר ${rawPhone} לא נמצא בעמותה — ידלג`);
          totalSkippedPhones++;
        }
      }

      // Validate families
      for (const familyName of merged.familyNames) {
        if (!familyName) continue;
        const existing = familyByName.get(familyName);
        if (existing) {
          if (existing.groupId && existingGroup && existing.groupId === existingGroup.id) {
            rowResult.families.push({ name: familyName, action: 'link_existing' });
          } else if (existing.groupId && existing.groupId !== (existingGroup?.id || null)) {
            rowResult.families.push({ name: familyName, action: 'replace_link' });
            rowResult.warnings.push(`משפחת "${familyName}" משויכת לקבוצה אחרת — תועבר לקבוצה זו`);
          } else {
            rowResult.families.push({ name: familyName, action: 'link_existing' });
          }
        } else {
          rowResult.families.push({ name: familyName, action: 'auto_create' });
          familiesToAutoCreate++;
        }
      }

      // Set final status
      if (rowResult.warnings.length > 0) {
        rowResult.status = 'valid_with_warnings';
      }

      rows.push(rowResult);
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
        groupsToCreate,
        groupsToUpdate,
        familiesToAutoCreate,
        skippedMemberPhones: totalSkippedPhones,
      },
      rows,
    };
  }

  async commitGroups(
    organizationId: string,
    validatedRows: GroupValidatedRow[],
  ): Promise<GroupCommitResult> {
    this.logger.log(`Committing groups for organization ${organizationId}`);

    const importableRows = validatedRows.filter((r) => r.status !== 'error');
    if (importableRows.length === 0) {
      return {
        groupsCreated: 0,
        groupsUpdated: 0,
        membersAdded: 0,
        managersAssigned: 0,
        managersReplaced: 0,
        familiesCreated: 0,
        familiesLinked: 0,
        skippedMemberPhones: [],
      };
    }

    let groupsCreated = 0;
    let groupsUpdated = 0;
    let membersAdded = 0;
    let managersAssigned = 0;
    let managersReplaced = 0;
    let familiesCreated = 0;
    let familiesLinked = 0;
    const skippedMemberPhones: { row: number; phone: string; reason: string }[] = [];

    await this.prisma.$transaction(async (tx) => {
      // Pre-fetch users — map both raw and normalized phone forms
      const orgUsers = await tx.user.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, phone: true },
      });
      const userByPhone = new Map<string, string>();
      for (const u of orgUsers) {
        userByPhone.set(u.phone, u.id);
        userByPhone.set(normalizePhone(u.phone), u.id);
      }

      for (const row of importableRows) {
        // Resolve or create group
        let group = await tx.group.findFirst({
          where: { organizationId, name: row.groupName, deletedAt: null },
        });

        const managerUserId = userByPhone.get(row.phoneManager)!;

        if (group) {
          groupsUpdated++;
          // Replace manager if different
          if (group.managerUserId !== managerUserId) {
            // Remove old manager membership role if any
            if (group.managerUserId) {
              managersReplaced++;
              await tx.groupMembership.updateMany({
                where: { groupId: group.id, userId: group.managerUserId, role: 'MANAGER' },
                data: { role: 'MEMBER' },
              });
            }
            await tx.group.update({
              where: { id: group.id },
              data: { managerUserId },
            });
          }
        } else {
          group = await tx.group.create({
            data: { organizationId, name: row.groupName, managerUserId, isActive: true },
          });
          groupsCreated++;
        }

        // Ensure manager has MANAGER membership
        const existingManagerMembership = await tx.groupMembership.findFirst({
          where: { groupId: group.id, userId: managerUserId },
        });
        if (existingManagerMembership) {
          if (existingManagerMembership.role !== 'MANAGER') {
            await tx.groupMembership.update({
              where: { id: existingManagerMembership.id },
              data: { role: 'MANAGER', status: 'ACTIVE' },
            });
          }
        } else {
          await tx.groupMembership.create({
            data: { organizationId, groupId: group.id, userId: managerUserId, role: 'MANAGER', status: 'ACTIVE' },
          });
        }
        managersAssigned++;

        // Add members
        for (const member of row.members) {
          if (!member.exists) {
            skippedMemberPhones.push({ row: row.rowNumber, phone: member.phone, reason: 'לא נמצא בעמותה' });
            continue;
          }
          const memberId = userByPhone.get(member.phone);
          if (!memberId || memberId === managerUserId) continue; // skip manager duplicate

          const existingMembership = await tx.groupMembership.findFirst({
            where: { groupId: group.id, userId: memberId },
          });
          if (!existingMembership) {
            await tx.groupMembership.create({
              data: { organizationId, groupId: group.id, userId: memberId, role: 'MEMBER', status: 'ACTIVE' },
            });
            membersAdded++;
          }
        }

        // Handle families
        for (const familyEntry of row.families) {
          let family = await tx.family.findFirst({
            where: { organizationId, familyName: familyEntry.name, deletedAt: null },
          });

          if (family) {
            if (family.groupId !== group.id) {
              await tx.family.update({
                where: { id: family.id },
                data: { groupId: group.id },
              });
              familiesLinked++;
            }
          } else {
            await tx.family.create({
              data: { organizationId, groupId: group.id, familyName: familyEntry.name, status: 'active' },
            });
            familiesCreated++;
            familiesLinked++;
          }
        }
      }
    });

    return {
      groupsCreated,
      groupsUpdated,
      membersAdded,
      managersAssigned,
      managersReplaced,
      familiesCreated,
      familiesLinked,
      skippedMemberPhones,
    };
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

  private mergeRows(records: Record<string, string>[]): MergedGroupRow[] {
    const map = new Map<string, MergedGroupRow>();

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowNum = i + 2;
      const groupName = (rec.groupName || '').trim();
      const phoneManager = (rec.phoneManager || '').trim();
      const membersRaw = (rec.groupMembers || '').trim();
      const familiesRaw = (rec.familiesWhoCare || '').trim();

      const memberPhones = membersRaw
        ? membersRaw.split(',').map((p) => p.trim()).filter(Boolean)
        : [];
      const familyNames = familiesRaw
        ? familiesRaw.split(',').map((f) => f.trim()).filter(Boolean)
        : [];

      if (map.has(groupName)) {
        const existing = map.get(groupName)!;
        existing.mergedFromRows.push(rowNum);
        // 2nd row's manager replaces 1st
        if (phoneManager) {
          existing.phoneManager = phoneManager;
        }
        // Union members
        for (const p of memberPhones) {
          existing.memberPhones.push(p);
        }
        // Union families
        for (const f of familyNames) {
          if (!existing.familyNames.includes(f)) {
            existing.familyNames.push(f);
          }
        }
      } else {
        map.set(groupName, {
          firstRowNum: rowNum,
          mergedFromRows: [rowNum],
          groupName,
          phoneManager,
          memberPhones,
          familyNames,
        });
      }
    }

    return Array.from(map.values());
  }
}

interface MergedGroupRow {
  firstRowNum: number;
  mergedFromRows: number[];
  groupName: string;
  phoneManager: string;
  memberPhones: string[];
  familyNames: string[];
}
