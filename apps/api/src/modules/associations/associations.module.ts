import { Module } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { AssociationsController } from './associations.controller';
import { AssociationsService } from './associations.service';

@Module({
  controllers: [AssociationsController],
  providers: [AssociationsService, PrismaService],
  exports: [AssociationsService],
})
export class AssociationsModule {}
