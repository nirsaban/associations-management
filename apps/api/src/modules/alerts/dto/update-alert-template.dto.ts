import { PartialType } from '@nestjs/swagger';
import { CreateAlertTemplateDto } from './create-alert-template.dto';

export class UpdateAlertTemplateDto extends PartialType(CreateAlertTemplateDto) {}
