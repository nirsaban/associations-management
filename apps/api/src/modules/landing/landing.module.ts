import { Module } from '@nestjs/common';
import { LandingController, PublicLandingController } from './landing.controller';
import { LandingService } from './landing.service';
import { CloudinaryService } from '@common/services/cloudinary.service';
import { ReferralsModule } from '@modules/referrals/referrals.module';

@Module({
  imports: [ReferralsModule],
  controllers: [LandingController, PublicLandingController],
  providers: [LandingService, CloudinaryService],
  exports: [LandingService],
})
export class LandingModule {}
