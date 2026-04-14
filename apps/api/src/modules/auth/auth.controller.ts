import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login with phone number',
    description: 'Initiates login by sending OTP to phone number. Returns organizations if phone exists in multiple.',
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
    summary: 'Verify OTP and get tokens',
    description: 'Verifies the OTP sent to phone and returns access/refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: TokenResponseDto,
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<TokenResponseDto> {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Uses refresh token to generate new access token',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed',
    type: TokenResponseDto,
  })
  async refresh(@Body() body: { refreshToken: string }): Promise<TokenResponseDto> {
    return this.authService.refreshToken(body.refreshToken);
  }
}
