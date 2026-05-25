import { Module } from '@nestjs/common';
import { ProfessionsController } from './professions/professions.controller';
import { ProfessionsService } from './professions/professions.service';
import { PeopleController } from './people/people.controller';
import { PeopleService } from './people/people.service';
import { ProfileUpdateController } from './profile/profile-update.controller';
import { ProfileUpdateService } from './profile/profile-update.service';
import { PassItOnController } from './pass-it-on/pass-it-on.controller';
import { PassItOnService } from './pass-it-on/pass-it-on.service';
import { TehillimController } from './tehillim/tehillim.controller';
import { TehillimService } from './tehillim/tehillim.service';
import { BusinessesController } from './businesses/businesses.controller';
import { BusinessesService } from './businesses/businesses.service';
import { CloudinaryService } from '@common/services/cloudinary.service';
import { AlertsModule } from '@modules/alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  controllers: [
    ProfessionsController,
    PeopleController,
    ProfileUpdateController,
    PassItOnController,
    TehillimController,
    BusinessesController,
  ],
  providers: [
    ProfessionsService,
    PeopleService,
    ProfileUpdateService,
    PassItOnService,
    TehillimService,
    BusinessesService,
    CloudinaryService,
  ],
})
export class CommunityModule {}
