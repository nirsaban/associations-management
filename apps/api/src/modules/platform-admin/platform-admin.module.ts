import { Module } from '@nestjs/common';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminSchemaService } from './platform-admin-schema.service';
import { PlatformAdminCrudService } from './platform-admin-crud.service';

@Module({
  controllers: [PlatformAdminController],
  providers: [PlatformAdminSchemaService, PlatformAdminCrudService],
})
export class PlatformAdminModule {}
