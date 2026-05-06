import { Module } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CloudinaryService } from '@common/services/cloudinary.service';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService, PrismaService, CloudinaryService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
