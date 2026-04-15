import { ApiProperty } from '@nestjs/swagger';

export class ImportRowErrorDto {
  @ApiProperty({ description: 'מספר שורה (כולל שורת כותרת)' })
  row!: number;

  @ApiProperty({ description: 'סיבת השגיאה' })
  reason!: string;

  @ApiProperty({ description: 'נתוני השורה', required: false })
  data?: Record<string, unknown>;
}

export class ImportResultDto {
  @ApiProperty({ description: 'סך שורות בקובץ' })
  totalRows!: number;

  @ApiProperty({ description: 'שורות תקינות' })
  validRows!: number;

  @ApiProperty({ description: 'שורות עם שגיאות' })
  invalidRows!: number;

  @ApiProperty({ description: 'רשומות שנוצרו (רק בעת commit)' })
  createdCount!: number;

  @ApiProperty({ description: 'רשומות שעודכנו (רק בעת commit)' })
  updatedCount!: number;

  @ApiProperty({ description: 'רשומות שדולגו (כפולות)' })
  skippedCount!: number;

  @ApiProperty({ description: 'רשימת שגיאות לפי שורה', type: [ImportRowErrorDto] })
  errors!: ImportRowErrorDto[];
}
