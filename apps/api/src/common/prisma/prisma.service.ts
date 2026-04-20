import { Injectable, Logger, OnModuleInit, OnModuleDestroy, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { TENANT_SCOPED_MODELS } from '../tenant/tenant.constants';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // מודלים שתומכים במחיקה רכה
  private readonly softDeleteModels = new Set([
    'Organization',
    'User',
    'Group',
    'Family',
  ]);

  private readonly tenantScopedModels = new Set<string>(TENANT_SCOPED_MODELS);

  constructor(private readonly cls: ClsService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Middleware למחיקה רכה — רק על מודלים שתומכים
    this.$use(async (params, next) => {
      if (!params.model || !this.softDeleteModels.has(params.model)) {
        return next(params);
      }

      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      }

      if (params.action === 'findMany') {
        if (params.args.where !== undefined) {
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        } else {
          params.args.where = {
            deletedAt: null,
          };
        }
      }

      return next(params);
    });

    // Middleware לבידוד שוכרים — הזרקת organizationId אוטומטית
    this.$use(async (params, next) => {
      if (!params.model || !this.tenantScopedModels.has(params.model)) {
        return next(params);
      }

      // קריאה בטוחה מ-CLS — אם אין CLS פעיל (למשל seed), דלג
      let platformRole: string | null = null;
      let organizationId: string | null = null;

      try {
        platformRole = this.cls.get('platformRole');
        organizationId = this.cls.get('organizationId');
      } catch {
        // אין CLS פעיל (seed, migration, script) — דלג על סינון
        return next(params);
      }

      // SUPER_ADMIN עוקף סינון שוכרים — רואה הכל
      if (platformRole === 'SUPER_ADMIN') {
        return next(params);
      }

      // אין CLS context פעיל (login, public routes) — דלג על סינון
      // TenantInterceptor מגדיר את הערכים רק אחרי אימות JWT
      if (!organizationId && !platformRole) {
        return next(params);
      }

      // משתמש מאומת ללא organizationId — אסור
      if (!organizationId) {
        throw new ForbiddenException('Organization context required');
      }

      // הזרקת organizationId לשאילתות קריאה
      const readActions = ['findFirst', 'findMany', 'findUnique', 'count', 'aggregate', 'groupBy'];
      if (readActions.includes(params.action)) {
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};
        params.args.where.organizationId = organizationId;
      }

      // הזרקת organizationId לעדכונים
      const updateActions = ['update', 'updateMany', 'delete', 'deleteMany'];
      if (updateActions.includes(params.action)) {
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};
        params.args.where.organizationId = organizationId;
      }

      // הזרקת organizationId ליצירה
      if (params.action === 'create') {
        if (!params.args) params.args = {};
        if (!params.args.data) params.args.data = {};
        if (!params.args.data.organizationId) {
          params.args.data.organizationId = organizationId;
        }
      }

      if (params.action === 'createMany') {
        if (!params.args) params.args = {};
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: Record<string, unknown>) => ({
            ...item,
            organizationId: item.organizationId || organizationId,
          }));
        }
      }

      if (params.action === 'upsert') {
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};
        params.args.where.organizationId = organizationId;
        if (!params.args.create) params.args.create = {};
        if (!params.args.create.organizationId) {
          params.args.create.organizationId = organizationId;
        }
      }

      return next(params);
    });

    await this.$connect();
    this.logger.log('Prisma connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }
}
