import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ActivationController } from './activation.controller';
import { ActivationService } from './activation.service';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    AuthModule,
  ],
  controllers: [ActivationController],
  providers: [ActivationService],
  exports: [ActivationService],
})
export class ActivationModule {}
