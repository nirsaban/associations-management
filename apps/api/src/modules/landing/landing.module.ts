import { Module } from '@nestjs/common';
import { LandingController, PublicLandingController } from './landing.controller';
import { LandingService } from './landing.service';
import { ReferralsModule } from '@modules/referrals/referrals.module';

@Module({
  imports: [ReferralsModule],
  controllers: [LandingController, PublicLandingController],
  providers: [LandingService],
  exports: [LandingService],
})
export class LandingModule {}
