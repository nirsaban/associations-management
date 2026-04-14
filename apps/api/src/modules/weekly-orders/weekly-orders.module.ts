import { Module } from '@nestjs/common';
import { WeeklyOrdersService } from './weekly-orders.service';
import { WeeklyOrdersController } from './weekly-orders.controller';

@Module({
  controllers: [WeeklyOrdersController],
  providers: [WeeklyOrdersService],
  exports: [WeeklyOrdersService],
})
export class WeeklyOrdersModule {}
