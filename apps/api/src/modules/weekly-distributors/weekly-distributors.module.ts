import { Module } from '@nestjs/common';
import { WeeklyDistributorsService } from './weekly-distributors.service';
import { WeeklyDistributorsController } from './weekly-distributors.controller';

@Module({
  controllers: [WeeklyDistributorsController],
  providers: [WeeklyDistributorsService],
  exports: [WeeklyDistributorsService],
})
export class WeeklyDistributorsModule {}
