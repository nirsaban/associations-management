import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { PlatformAdminSchemaService } from './platform-admin-schema.service';

interface FindManyParams {
  page: number;
  limit: number;
  search?: string;
  organizationId?: string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

@Injectable()
export class PlatformAdminCrudService {
  private readonly logger = new Logger(PlatformAdminCrudService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schemaService: PlatformAdminSchemaService,
  ) {}

  private getDelegate(modelName: string) {
    if (!this.schemaService.isValidModel(modelName)) {
      throw new BadRequestException(`מודל לא חוקי: ${modelName}`);
    }
    const key = this.schemaService.toDelegateKey(modelName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any)[key];
  }

  async findMany(
    modelName: string,
    params: FindManyParams,
  ): Promise<{ data: unknown[]; meta: { total: number; page: number; limit: number } }> {
    const delegate = this.getDelegate(modelName);
    const { page, limit, search, organizationId, orderBy, orderDir } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Soft delete filter
    const schema = this.schemaService.getModelSchema(modelName);
    if (schema?.hasSoftDelete) {
      where.deletedAt = null;
    }

    // Org filter
    if (organizationId && schema?.isTenantScoped) {
      where.organizationId = organizationId;
    }

    // Search across string fields
    if (search) {
      const stringFields = this.schemaService.getScalarStringFields(modelName);
      if (stringFields.length > 0) {
        where.OR = stringFields.map((field) => ({
          [field]: { contains: search, mode: 'insensitive' },
        }));
      }
    }

    // Build orderBy
    const orderByClause = orderBy
      ? { [orderBy]: orderDir || 'desc' }
      : { createdAt: 'desc' as const };

    // Build includes for relations
    const include = this.schemaService.getRelationIncludes(modelName);
    const hasIncludes = Object.keys(include).length > 0;

    const [data, total] = await Promise.all([
      delegate.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
        ...(hasIncludes ? { include } : {}),
      }),
      delegate.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findOne(modelName: string, id: string): Promise<unknown> {
    const delegate = this.getDelegate(modelName);
    const include = this.schemaService.getRelationIncludes(modelName);
    const hasIncludes = Object.keys(include).length > 0;

    const record = await delegate.findFirst({
      where: { id },
      ...(hasIncludes ? { include } : {}),
    });

    if (!record) {
      throw new NotFoundException('רשומה לא נמצאה');
    }

    return record;
  }

  async create(modelName: string, data: Record<string, unknown>): Promise<unknown> {
    const delegate = this.getDelegate(modelName);
    const cleaned = this.cleanData(modelName, data);

    this.logger.log(`Creating ${modelName} record`);

    return delegate.create({ data: cleaned });
  }

  async update(
    modelName: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    const delegate = this.getDelegate(modelName);

    // Verify exists
    const existing = await delegate.findFirst({ where: { id } });
    if (!existing) {
      throw new NotFoundException('רשומה לא נמצאה');
    }

    const cleaned = this.cleanData(modelName, data);
    this.logger.log(`Updating ${modelName} record ${id}`);

    return delegate.update({ where: { id }, data: cleaned });
  }

  async remove(modelName: string, id: string): Promise<void> {
    const delegate = this.getDelegate(modelName);

    const existing = await delegate.findFirst({ where: { id } });
    if (!existing) {
      throw new NotFoundException('רשומה לא נמצאה');
    }

    this.logger.log(`Deleting ${modelName} record ${id}`);

    if (this.schemaService.isSoftDeleteModel(modelName)) {
      await delegate.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } else {
      await delegate.delete({ where: { id } });
    }
  }

  async count(modelName: string): Promise<number> {
    const delegate = this.getDelegate(modelName);
    const schema = this.schemaService.getModelSchema(modelName);
    const where: Record<string, unknown> = {};
    if (schema?.hasSoftDelete) {
      where.deletedAt = null;
    }
    return delegate.count({ where });
  }

  private cleanData(
    modelName: string,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const schema = this.schemaService.getModelSchema(modelName);
    if (!schema) return data;

    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const field = schema.fields.find((f) => f.name === key);
      if (!field) continue;
      if (field.isReadOnly) continue;
      if (field.kind === 'object') continue;

      // Sanitize string fields
      if (field.type === 'String' && typeof value === 'string') {
        cleaned[key] = value.replace(/<[^>]*>/g, '').trim();
      } else if (field.type === 'Int' || field.type === 'BigInt') {
        cleaned[key] = value !== null && value !== '' ? Number(value) : null;
      } else if (field.type === 'Float' || field.type === 'Decimal') {
        cleaned[key] = value !== null && value !== '' ? Number(value) : null;
      } else if (field.type === 'Boolean') {
        cleaned[key] = Boolean(value);
      } else if (field.type === 'DateTime') {
        cleaned[key] = value ? new Date(value as string) : null;
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }
}
