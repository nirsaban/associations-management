import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { PlatformAdminSchemaService, FieldMeta } from './platform-admin-schema.service';

interface FindManyParams {
  page: number;
  limit: number;
  search?: string;
  filters?: Record<string, string>;
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
    const { page, limit, search, filters, organizationId, orderBy, orderDir } = params;
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

    // Per-field filters (professional search) — type-aware, combined with AND.
    // Only meaningful, non-empty values constrain the query. Stray sentinel
    // values ('', 'null', 'undefined', whitespace) from untouched/cleared
    // column inputs are ignored so they cannot zero-out other active filters.
    if (filters && typeof filters === 'object' && schema) {
      const andConditions: Record<string, unknown>[] = [];
      for (const [fieldName, rawValue] of Object.entries(filters)) {
        if (rawValue === undefined || rawValue === null) continue;
        const trimmed = String(rawValue).trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') continue;
        const field = schema.fields.find((f) => f.name === fieldName);
        if (!field) continue;
        const condition = this.buildFieldCondition(field, trimmed);
        if (condition) andConditions.push(condition);
      }
      if (andConditions.length > 0) {
        where.AND = andConditions;
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

  /**
   * Build a type-aware Prisma `where` condition for a single field filter.
   * Returns null when the value is unusable for the field's type.
   */
  private buildFieldCondition(
    field: FieldMeta,
    rawValue: string,
  ): Record<string, unknown> | null {
    const value = rawValue.trim();
    if (!value) return null;

    // Relation object: filter by the related record's display field (contains)
    if (field.kind === 'object') {
      if (!field.displayField) return null;
      return {
        [field.name]: {
          [field.displayField]: { contains: value, mode: 'insensitive' },
        },
      };
    }

    // Enum: exact match against a known value
    if (field.kind === 'enum') {
      if (field.enumValues && !field.enumValues.includes(value)) return null;
      return { [field.name]: value };
    }

    switch (field.type) {
      case 'Boolean': {
        if (value !== 'true' && value !== 'false') return null;
        return { [field.name]: value === 'true' };
      }
      case 'Int':
      case 'BigInt': {
        const n = Number(value);
        if (!Number.isFinite(n)) return null;
        return { [field.name]: Math.trunc(n) };
      }
      case 'Float':
      case 'Decimal': {
        const n = Number(value);
        if (!Number.isFinite(n)) return null;
        return { [field.name]: n };
      }
      case 'DateTime': {
        // value is expected as YYYY-MM-DD — match within that calendar day
        const start = new Date(value);
        if (Number.isNaN(start.getTime())) return null;
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return { [field.name]: { gte: start, lt: end } };
      }
      default:
        // String (incl. FK id) — case-insensitive partial match
        return { [field.name]: { contains: value, mode: 'insensitive' } };
    }
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

  async remove(modelName: string, id: string, options: { hard?: boolean } = {}): Promise<void> {
    const delegate = this.getDelegate(modelName);

    const existing = await delegate.findFirst({ where: { id } });
    if (!existing) {
      throw new NotFoundException('רשומה לא נמצאה');
    }

    const isSoftDelete = this.schemaService.isSoftDeleteModel(modelName);
    const hard = options.hard === true;

    this.logger.log(
      `${hard ? 'Hard-deleting' : isSoftDelete ? 'Soft-deleting' : 'Deleting'} ${modelName} record ${id}`,
    );

    if (isSoftDelete && !hard) {
      await delegate.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return;
    }

    if (hard && modelName === 'User') {
      // Users have RESTRICT FKs (alerts, tehillim, etc.) that block a naive
      // delete — route through the dedicated hard-delete cleanup path.
      await this.hardDeleteUser(id);
      return;
    }

    await delegate.delete({ where: { id } });
  }

  /**
   * SUPER_ADMIN hard-delete of a User. Mirrors UsersService.hardRemove but
   * without an organization scope (super admin operates platform-wide).
   */
  private async hardDeleteUser(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.passItOnItem.updateMany({
        where: { claimedById: id },
        data: { claimedById: null },
      }),
      this.prisma.tehillimReading.deleteMany({ where: { userId: id } }),
      this.prisma.tehillimDedication.deleteMany({ where: { userId: id } }),
      this.prisma.weeklyFamilyDelivery.deleteMany({ where: { markedByUserId: id } }),
      this.prisma.passItOnItem.deleteMany({ where: { postedById: id } }),
      this.prisma.alert.deleteMany({ where: { publishedById: id } }),
      this.prisma.alertTemplate.deleteMany({ where: { createdById: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);
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
