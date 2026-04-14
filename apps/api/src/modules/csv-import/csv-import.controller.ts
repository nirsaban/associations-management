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
import { ImportCsvDto } from './dto/import-csv.dto';

@ApiTags('CSV Import')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Controller('csv-import')
export class CsvImportController {
  constructor(private readonly csvImportService: CsvImportService) {}

  @Post('users')
  @ApiOperation({
    summary: 'Import users from CSV',
    description: 'Import users from CSV file (with optional dry-run)',
  })
  async importUsers(
    @CurrentUser() user: ICurrentUser,
    @Body() importCsvDto: ImportCsvDto,
  ): Promise<object> {
    return this.csvImportService.importUsers(user.organizationId, importCsvDto);
  }

  @Post('families')
  @ApiOperation({
    summary: 'Import families from CSV',
    description: 'Import families from CSV file (with optional dry-run)',
  })
  async importFamilies(
    @CurrentUser() user: ICurrentUser,
    @Body() importCsvDto: ImportCsvDto,
  ): Promise<object> {
    return this.csvImportService.importFamilies(user.organizationId, importCsvDto);
  }

  @Post('groups')
  @ApiOperation({
    summary: 'Import groups from CSV',
    description: 'Import groups from CSV file (with optional dry-run)',
  })
  async importGroups(
    @CurrentUser() user: ICurrentUser,
    @Body() importCsvDto: ImportCsvDto,
  ): Promise<object> {
    return this.csvImportService.importGroups(user.organizationId, importCsvDto);
  }
}
