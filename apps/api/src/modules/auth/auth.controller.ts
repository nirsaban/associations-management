import { Controller, Post, Get, Body, HttpCode, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('start-login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'התחלת התחברות עם מספר טלפון',
    description: 'שליחת OTP למספר טלפון. מחזיר sessionId לשלב האימות.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP נשלח',
    type: LoginResponseDto,
  })
  async startLogin(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login with phone number',
    description: 'Initiates login by sending OTP to phone number (alias for start-login).',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: LoginResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({
    summary: 'אימות קוד OTP',
    description: 'מאמת את קוד ה-OTP ומחזיר access/refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: TokenResponseDto,
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<TokenResponseDto> {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'פרטי משתמש מחובר',
    description: 'מחזיר פרטי המשתמש המחובר כולל פרטי הארגון וסטטוס ה-setup',
  })
  @ApiResponse({
    status: 200,
    description: 'User details including organization and setupCompleted',
  })
  async getMe(@CurrentUser() user: ICurrentUser): Promise<{ data: Record<string, unknown> }> {
    const me = await this.authService.getMe(user.sub);
    return { data: me };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'רענון access token',
    description: 'שימוש ב-refresh token ליצירת access token חדש',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed',
    type: TokenResponseDto,
  })
  async refresh(@Body() body: { refreshToken: string }): Promise<TokenResponseDto> {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'התנתקות',
    description: 'התנתקות מהמערכת',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req: Request): Promise<{ data: { success: boolean } }> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      this.authService.revokeToken(token);
    }
    return { data: { success: true } };
  }
}
