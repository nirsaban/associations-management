import { Module } from '@nestjs/common';
import { PrismaModule } from '@common/prisma/prisma.module';
import { OmerService } from './omer.service';

@Module({
  imports: [PrismaModule],
  providers: [OmerService],
})
export class OmerModule {}
