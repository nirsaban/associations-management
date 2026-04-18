import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Models that have a deletedAt field for soft deletes
  private readonly softDeleteModels = new Set([
    'Organization',
    'User',
    'Group',
    'Family',
  ]);

  async onModuleInit(): Promise<void> {
    // Add middleware to enforce soft deletes only on models that support it
    this.$use(async (params, next) => {
      if (!params.model || !this.softDeleteModels.has(params.model)) {
        return next(params);
      }

      // For find queries, always exclude soft-deleted records
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

    await this.$connect();
    this.logger.log('Prisma connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }
}
