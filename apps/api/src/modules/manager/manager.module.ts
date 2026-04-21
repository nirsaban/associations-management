import { Module } from '@nestjs/common';
import { PrismaModule } from '@common/prisma/prisma.module';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { UserExperienceController } from './user-experience.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ManagerController, UserExperienceController],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
