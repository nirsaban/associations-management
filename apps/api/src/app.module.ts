import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';

import { PrismaModule } from '@common/prisma/prisma.module';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { TenantInterceptor } from '@common/tenant/tenant.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { GroupsModule } from '@modules/groups/groups.module';
import { FamiliesModule } from '@modules/families/families.module';
import { WeeklyOrdersModule } from '@modules/weekly-orders/weekly-orders.module';
import { WeeklyDistributorsModule } from '@modules/weekly-distributors/weekly-distributors.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { RemindersModule } from '@modules/reminders/reminders.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { CsvImportModule } from '@modules/csv-import/csv-import.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { PlatformModule } from '@modules/platform/platform.module';
import { PlatformAdminModule } from '@modules/platform-admin/platform-admin.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { HomepageModule } from '@modules/homepage/homepage.module';
import { ManagerModule } from '@modules/manager/manager.module';
import { AdminModule } from '@modules/admin/admin.module';
import { ActivationModule } from '@modules/activation/activation.module';
import { AlertsModule } from '@modules/alerts/alerts.module';
import { HealthModule } from '@modules/health/health.module';
import { LandingModule } from '@modules/landing/landing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        'apps/api/.env',
        '../../.env',
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    GroupsModule,
    FamiliesModule,
    WeeklyOrdersModule,
    WeeklyDistributorsModule,
    PaymentsModule,
    RemindersModule,
    NotificationsModule,
    CsvImportModule,
    DashboardModule,
    PlatformModule,
    PlatformAdminModule,
    OrganizationModule,
    HomepageModule,
    ManagerModule,
    AdminModule,
    ActivationModule,
    AlertsModule,
    HealthModule,
    LandingModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
