import { Module } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  controllers: [PlatformController],
  providers: [PlatformService, PrismaService],
  exports: [PlatformService],
})
export class PlatformModule {}
