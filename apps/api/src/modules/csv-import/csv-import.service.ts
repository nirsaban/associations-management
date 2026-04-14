import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ImportCsvDto } from './dto/import-csv.dto';

interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string }>;
  preview: Record<string, unknown>[];
}

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importUsers(
    organizationId: string,
    importCsvDto: ImportCsvDto,
  ): Promise<ImportResult> {
    this.logger.log(`Importing users for organization ${organizationId}`);

    const rows = this.parseCSV(importCsvDto.csvContent);
    const result: ImportResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
      preview: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // CSV rows are 1-indexed + header row

      try {
        // Validate required fields
        if (!row.email || !row.fullName || !row.phone) {
          throw new Error('Missing required fields: email, fullName, phone');
        }

        // Check for duplicates
        const existing = await this.prisma.user.findFirst({
          where: {
            OR: [{ email: row.email as string }, { phone: row.phone as string }],
            deletedAt: null,
          },
        });

        if (existing) {
          throw new Error('User already exists');
        }

        if (!importCsvDto.dryRun) {
          await this.prisma.user.create({
            data: {
              organizationId,
              email: row.email as string,
              fullName: row.fullName as string,
              phone: row.phone as string,
              systemRole: (row.systemRole as string) === 'ADMIN' ? 'ADMIN' : 'USER',
            },
          });
        }

        result.preview.push(row);
        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: rowNum,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  async importFamilies(
    organizationId: string,
    importCsvDto: ImportCsvDto,
  ): Promise<ImportResult> {
    this.logger.log(`Importing families for organization ${organizationId}`);

    const rows = this.parseCSV(importCsvDto.csvContent);
    const result: ImportResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
      preview: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        // Validate required fields
        if (!row.familyName || !row.contactPhone) {
          throw new Error('Missing required fields: familyName, contactPhone');
        }

        if (!importCsvDto.dryRun) {
          await this.prisma.family.create({
            data: {
              organizationId,
              familyName: row.familyName as string,
              contactPhone: row.contactPhone as string,
              address: (row.address as string) || null,
              notes: (row.notes as string) || null,
            },
          });
        }

        result.preview.push(row);
        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: rowNum,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  async importGroups(
    organizationId: string,
    importCsvDto: ImportCsvDto,
  ): Promise<ImportResult> {
    this.logger.log(`Importing groups for organization ${organizationId}`);

    const rows = this.parseCSV(importCsvDto.csvContent);
    const result: ImportResult = {
      successCount: 0,
      errorCount: 0,
      errors: [],
      preview: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        if (!row.name || !row.managerId) {
          throw new Error('Missing required fields: name, managerId');
        }

        if (!importCsvDto.dryRun) {
          await this.prisma.group.create({
            data: {
              organizationId,
              name: row.name as string,
              managerId: row.managerId as string,
            },
          });
        }

        result.preview.push(row);
        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: rowNum,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  private parseCSV(content: string): Record<string, unknown>[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have header and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });

      rows.push(row);
    }

    return rows;
  }
}
