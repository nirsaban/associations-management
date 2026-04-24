import { Module } from '@nestjs/common';
import { LandingController, PublicLandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  controllers: [LandingController, PublicLandingController],
  providers: [LandingService],
  exports: [LandingService],
})
export class LandingModule {}
