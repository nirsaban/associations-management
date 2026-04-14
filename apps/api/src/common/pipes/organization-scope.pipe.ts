import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class OrganizationScopePipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (value === undefined || value === null) {
      throw new BadRequestException('organizationId is required');
    }

    if (typeof value !== 'string' || value.trim() === '') {
      throw new BadRequestException('organizationId must be a non-empty string');
    }

    return value;
  }
}
