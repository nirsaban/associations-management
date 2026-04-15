import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ImportResultDto, ImportRowErrorDto } from './dto/import-result.dto';

function normalizePhone(phone: string): string {
  const trimmed = phone.trim().replace(/\s+/g, '');
  if (trimmed.startsWith('+972')) return trimmed;
  if (trimmed.startsWith('972')) return '+' + trimmed;
  if (trimmed.startsWith('0')) return '+972' + trimmed.slice(1);
  return trimmed;
}

function isValidPhone(phone: string): boolean {
  return /^(\+972|0)\d{8,9}$/.test(phone);
}

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importUsers(
    organizationId: string,
    csvContent: string,
    dryRun: boolean,
  ): Promise<ImportResultDto> {
    this.logger.log(
      `${dryRun ? 'Previewing' : 'Committing'} users import for organization ${organizationId}`,
    );

    const rows = this.parseCSV(csvContent);
    const errors: ImportRowErrorDto[] = [];
    let validRows = 0;
    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header offset

      // Validate required fields
      if (!row.phone || !row.fullName) {
        errors.push({
          row: rowNum,
          reason: 'שדות חובה חסרים: phone, fullName',
          data: row,
        });
        continue;
      }

      const rawPhone = String(row.phone).trim();
      const normalizedPhone = normalizePhone(rawPhone);

      if (!isValidPhone(rawPhone) && !isValidPhone(normalizedPhone)) {
        errors.push({
          row: rowNum,
          reason: `מספר טלפון לא תקין: ${rawPhone}`,
          data: row,
        });
        continue;
      }

      const fullName = String(row.fullName).trim();
      if (fullName.length < 2) {
        errors.push({
          row: rowNum,
          reason: 'שם מלא חייב להכיל לפחות 2 תווים',
          data: row,
        });
        continue;
      }

      // Duplicate detection — phone is globally unique
      const existing = await this.prisma.user.findFirst({
        where: { phone: normalizedPhone, deletedAt: null },
      });

      if (existing) {
        if (existing.organizationId === organizationId) {
          skippedCount++;
          // Don't add to validRows — it's a skip
          continue;
        } else {
          errors.push({
            row: rowNum,
            reason: `מספר טלפון ${normalizedPhone} כבר קיים במערכת`,
            data: row,
          });
          continue;
        }
      }

      validRows++;

      if (!dryRun) {
        await this.prisma.user.create({
          data: {
            organizationId,
            phone: normalizedPhone,
            fullName,
            systemRole: 'USER',
            isImported: true,
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
      skippedCount,
      errors,
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

      // Validate required fields
      if (!row.familyName) {
        errors.push({
          row: rowNum,
          reason: 'שדה חובה חסר: familyName',
          data: row,
        });
        continue;
      }

      const familyName = String(row.familyName).trim();
      if (familyName.length < 2) {
        errors.push({
          row: rowNum,
          reason: 'שם משפחה חייב להכיל לפחות 2 תווים',
          data: row,
        });
        continue;
      }

      // Validate contactPhone if provided
      if (row.contactPhone) {
        const rawPhone = String(row.contactPhone).trim();
        const normalizedPhone = normalizePhone(rawPhone);
        if (!isValidPhone(rawPhone) && !isValidPhone(normalizedPhone)) {
          errors.push({
            row: rowNum,
            reason: `מספר טלפון לא תקין: ${rawPhone}`,
            data: row,
          });
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
    const lines = content.trim().split('\n');
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
