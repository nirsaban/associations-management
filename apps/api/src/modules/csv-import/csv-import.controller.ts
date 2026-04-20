import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { CsvImportService, UserImportValidateResult, UserImportCommitResult } from './csv-import.service';
import { GroupsCsvImportService, GroupValidateResult, GroupCommitResult, GroupValidatedRow } from './groups-csv-import.service';
import { FamiliesCsvImportService, FamilyValidateResult, FamilyCommitResult, FamilyValidatedRow } from './families-csv-import.service';
import { ImportUsersDto } from './dto/import-users.dto';
import { ImportFamiliesDto } from './dto/import-families.dto';
import { ImportResultDto } from './dto/import-result.dto';
import { PrismaService } from '@common/prisma/prisma.service';

@ApiTags('Admin - CSV Import')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/import')
export class CsvImportController {
  constructor(
    private readonly csvImportService: CsvImportService,
    private readonly groupsCsvImportService: GroupsCsvImportService,
    private readonly familiesCsvImportService: FamiliesCsvImportService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Guard: setupCompleted must be true before importing
   */
  private async ensureSetupCompleted(organizationId: string): Promise<void> {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { setupCompleted: true },
    });
    if (!org?.setupCompleted) {
      throw new ForbiddenException('יש להשלים את אשף ההגדרות לפני ייבוא');
    }
  }

  @Post('users/validate')
  @ApiOperation({
    summary: 'אימות CSV משתמשים',
    description: 'אימות שורות CSV לפי כללי ייבוא — ללא יצירת נתונים',
  })
  async validateUsers(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ImportUsersDto,
  ): Promise<{ data: UserImportValidateResult }> {
    await this.ensureSetupCompleted(user.organizationId);
    const result = await this.csvImportService.validateUsers(user.organizationId, dto.csvContent);
    return { data: result };
  }

  @Post('users/commit')
  @ApiOperation({
    summary: 'ייבוא משתמשים',
    description: 'יצירת משתמשים, קבוצות וחברויות מנתוני CSV מאומתים',
  })
  async commitUsers(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ImportUsersDto,
  ): Promise<{ data: UserImportCommitResult }> {
    await this.ensureSetupCompleted(user.organizationId);
    // Re-validate before commit to prevent stale data
    const validated = await this.csvImportService.validateUsers(user.organizationId, dto.csvContent);
    if (validated.validRows.length === 0) {
      return { data: { usersCreated: 0, groupsCreated: 0, membersCreated: 0, managersCreated: 0 } };
    }
    const result = await this.csvImportService.commitUsers(user.organizationId, validated.validRows);
    return { data: result };
  }

  @Get('users/template')
  @ApiOperation({
    summary: 'הורדת תבנית CSV משתמשים',
    description: 'מחזיר קובץ CSV לדוגמה עם UTF-8 BOM',
  })
  async getUsersTemplate(@Res() res: Response): Promise<void> {
    const BOM = '\uFEFF';
    const template = `phone,fullName,groupName,role
0501234567,ישראל ישראלי,ביתר א,מנהל קבוצה
0501234568,חיים כהן,ביתר א,חבר קבוצה
0501234569,שרה לוי,,תורם`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users-template.csv"');
    res.send(BOM + template);
  }

  // ─── Groups CSV Import ──────────────────────────────────────────────────

  @Post('groups/validate')
  @ApiOperation({
    summary: 'אימות CSV קבוצות',
    description: 'אימות קבוצות, חברים ומשפחות — ללא יצירת נתונים',
  })
  async validateGroups(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ImportUsersDto,
  ): Promise<{ data: GroupValidateResult }> {
    await this.ensureSetupCompleted(user.organizationId);
    const result = await this.groupsCsvImportService.validateGroups(user.organizationId, dto.csvContent);
    return { data: result };
  }

  @Post('groups/commit')
  @ApiOperation({
    summary: 'ייבוא קבוצות',
    description: 'יצירת/עדכון קבוצות, חברויות ומשפחות מנתוני CSV מאומתים',
  })
  async commitGroups(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: { csvContent: string; rows: GroupValidatedRow[] },
  ): Promise<{ data: GroupCommitResult }> {
    await this.ensureSetupCompleted(user.organizationId);
    // Re-validate to prevent stale data, then commit importable rows
    const validated = await this.groupsCsvImportService.validateGroups(user.organizationId, dto.csvContent);
    const result = await this.groupsCsvImportService.commitGroups(user.organizationId, validated.rows);
    return { data: result };
  }

  @Get('groups/template')
  @ApiOperation({
    summary: 'הורדת תבנית CSV קבוצות',
    description: 'מחזיר קובץ CSV לדוגמה עם UTF-8 BOM',
  })
  async getGroupsTemplate(@Res() res: Response): Promise<void> {
    const BOM = '\uFEFF';
    const template = `groupName,phoneManager,groupMembers,familiesWhoCare
ביתר א,0501234567,"0501234568,0501234569","משפחת כהן,משפחת לוי"
ביתר ב,0501234571,"0501234572,0501234573","משפחת מזרחי"`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="groups-template.csv"');
    res.send(BOM + template);
  }

  // ─── Families CSV Import ────────────────────────────────────────────────

  @Post('families/validate')
  @ApiOperation({
    summary: 'אימות CSV משפחות',
    description: 'אימות משפחות — ללא יצירת נתונים. מזהה יצירה/עדכון לכל שורה.',
  })
  async validateFamilies2(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ImportUsersDto,
  ): Promise<{ data: FamilyValidateResult }> {
    await this.ensureSetupCompleted(user.organizationId);
    const result = await this.familiesCsvImportService.validateFamilies(user.organizationId, dto.csvContent);
    return { data: result };
  }

  @Post('families/commit')
  @ApiOperation({
    summary: 'ייבוא משפחות',
    description: 'יצירת/עדכון משפחות וקישור לקבוצות',
  })
  async commitFamilies2(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: { csvContent: string; rows: FamilyValidatedRow[] },
  ): Promise<{ data: FamilyCommitResult }> {
    await this.ensureSetupCompleted(user.organizationId);
    // Re-validate before commit
    const validated = await this.familiesCsvImportService.validateFamilies(user.organizationId, dto.csvContent);
    const result = await this.familiesCsvImportService.commitFamilies(user.organizationId, validated.rows);
    return { data: result };
  }

  @Get('families/template')
  @ApiOperation({
    summary: 'הורדת תבנית CSV משפחות',
    description: 'מחזיר קובץ CSV לדוגמה עם UTF-8 BOM',
  })
  async getFamiliesTemplate(@Res() res: Response): Promise<void> {
    const BOM = '\uFEFF';
    const template = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address
משפחת כהן,0501112222,3,ביתר א,5,רחוב הרצל 10 ירושלים
משפחת לוי,0503334444,,ביתר א,,רחוב יפו 22 ירושלים
משפחת מזרחי,,,,,`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="families-template.csv"');
    res.send(BOM + template);
  }

  // Legacy endpoints kept for backward compatibility
  @Post('users/preview')
  @ApiOperation({
    summary: 'תצוגה מקדימה לייבוא משתמשים (legacy)',
    description: 'אימות שורות CSV לפני הייבוא — אין יצירת נתונים',
  })
  async previewUsers(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ImportUsersDto,
  ): Promise<{ data: ImportResultDto }> {
    const result = await this.csvImportService.importUsers(user.organizationId, dto.csvContent, true);
    return { data: result };
  }

  @Post('families/preview')
  @ApiOperation({
    summary: 'תצוגה מקדימה לייבוא משפחות',
    description: 'אימות שורות CSV לפני הייבוא — אין יצירת נתונים',
  })
  async previewFamilies(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ImportFamiliesDto,
  ): Promise<{ data: ImportResultDto }> {
    const result = await this.csvImportService.importFamilies(user.organizationId, dto.csvContent, true);
    return { data: result };
  }

  @Post('families/commit')
  @ApiOperation({
    summary: 'ייבוא משפחות',
    description: 'יצירת משפחות תקינות מקובץ CSV לאחר אימות',
  })
  async commitFamilies(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ImportFamiliesDto,
  ): Promise<{ data: ImportResultDto }> {
    const result = await this.csvImportService.importFamilies(user.organizationId, dto.csvContent, false);
    return { data: result };
  }
}
