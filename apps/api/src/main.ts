import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import morgan from 'morgan';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3010',
    credentials: true,
  });

  // Use morgan for HTTP request logging
  app.use(morgan('combined'));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Amutot API')
    .setDescription('API for Amutot Management Platform - Multi-tenant SaaS for Israeli nonprofits')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Platform', 'Platform management (SUPER_ADMIN only)')
    .addTag('Organization', 'Organization setup and management (ADMIN only)')
    .addTag('Users', 'User management endpoints')
    .addTag('Groups', 'Group management endpoints')
    .addTag('Families', 'Family management endpoints')
    .addTag('Weekly Orders', 'Weekly order management')
    .addTag('Weekly Distributors', 'Distributor assignment')
    .addTag('Payments', 'Payment processing')
    .addTag('Reminders', 'Reminder management')
    .addTag('Notifications', 'User notifications')
    .addTag('CSV Import', 'CSV import utilities')
    .addTag('Dashboard', 'Dashboard data')
    .addTag('Homepage', 'Homepage context engine')
    .addTag('Manager', 'Group manager operations')
    .addTag('Admin', 'Admin dashboard and analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const PORT = process.env.PORT || 3003;
  await app.listen(PORT);
  const logger = new Logger('Bootstrap');
  logger.log(`Server running on http://localhost:${PORT}`);
  logger.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
