import { Module } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CsvImportService } from './csv-import.service';
import { GroupsCsvImportService } from './groups-csv-import.service';
import { FamiliesCsvImportService } from './families-csv-import.service';
import { CsvImportController } from './csv-import.controller';

@Module({
  controllers: [CsvImportController],
  providers: [CsvImportService, GroupsCsvImportService, FamiliesCsvImportService, PrismaService],
  exports: [CsvImportService, GroupsCsvImportService, FamiliesCsvImportService],
})
export class CsvImportModule {}
