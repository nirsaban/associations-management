import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { CsvImportService } from './csv-import.service';
import { ImportUsersDto } from './dto/import-users.dto';
import { ImportFamiliesDto } from './dto/import-families.dto';
import { ImportResultDto } from './dto/import-result.dto';

@ApiTags('Admin - CSV Import')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/import')
export class CsvImportController {
  constructor(private readonly csvImportService: CsvImportService) {}

  @Post('users/preview')
  @ApiOperation({
    summary: 'תצוגה מקדימה לייבוא משתמשים',
    description: 'אימות שורות CSV לפני הייבוא — אין יצירת נתונים',
  })
  async previewUsers(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ImportUsersDto,
  ): Promise<{ data: ImportResultDto }> {
    const result = await this.csvImportService.importUsers(user.organizationId, dto.csvContent, true);
    return { data: result };
  }

  @Post('users/commit')
  @ApiOperation({
    summary: 'ייבוא משתמשים',
    description: 'יצירת משתמשים תקינים מקובץ CSV לאחר אימות',
  })
  async commitUsers(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ImportUsersDto,
  ): Promise<{ data: ImportResultDto }> {
    const result = await this.csvImportService.importUsers(user.organizationId, dto.csvContent, false);
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
