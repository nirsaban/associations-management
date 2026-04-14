import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from '@common/prisma/prisma.module';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
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
import { AssociationsModule } from '@modules/associations/associations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
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
    AssociationsModule,
  ],
  providers: [
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
