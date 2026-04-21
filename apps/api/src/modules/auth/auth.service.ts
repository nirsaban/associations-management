import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@common/prisma/prisma.service';
import { GreenApiService } from '@common/services/green-api.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { randomBytes } from 'crypto';

interface UserSession {
  sessionId: string;
  users: Array<{
    userId: string;
    organizationId: string | null;
    organizationName: string | null;
    systemRole: string;
    email: string | null;
  }>;
  phone: string;
  otp: string;
  expiresAt: Date;
  selectedOrganizationId?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly sessions = new Map<string, UserSession>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly greenApiService: GreenApiService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { phone } = loginDto;

    this.logger.log(`Login attempt for phone: ${this.maskPhoneNumber(phone)}`);

    // Find all users with this phone number (can be in multiple organizations)
    const users = await this.prisma.user.findMany({
      where: {
        phone,
        deletedAt: null,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (users.length === 0) {
      throw new BadRequestException('User not found');
    }

    // Generate session ID
    const sessionId = randomBytes(16).toString('hex');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store session with all user matches
    const session: UserSession = {
      sessionId,
      users: users.map((u) => ({
        userId: u.id,
        organizationId: u.organizationId,
        organizationName: u.organization?.name || null,
        systemRole: u.systemRole,
        email: u.email,
      })),
      phone,
      otp,
      expiresAt,
    };

    this.sessions.set(sessionId, session);

    // Send OTP via Green API (WhatsApp)
    try {
      await this.greenApiService.sendOtpSms(phone, otp);
      this.logger.log(`OTP sent successfully to ${this.maskPhoneNumber(phone)}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${this.maskPhoneNumber(phone)}`, (error as Error).stack);
      // Don't fail the request - OTP is logged to console in dev mode
    }

    // If multiple organizations, return them for user selection
    const requiresOrgSelection = users.length > 1;

    return {
      message: 'OTP sent to phone number',
      otpSent: true,
      sessionId,
      requiresOrgSelection,
      organizations: requiresOrgSelection
        ? users.map((u) => ({
            id: u.organizationId!,
            name: u.organization?.name || 'Unknown',
            userRole: u.systemRole,
          }))
        : undefined,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<TokenResponseDto> {
    const { phone, otp, organizationId, sessionId } = verifyOtpDto;

    this.logger.log(`OTP verification for phone: ${this.maskPhoneNumber(phone)}`);

    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    // Find stored session
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found or expired');
    }

    // Verify phone matches
    if (session.phone !== phone) {
      throw new UnauthorizedException('Invalid session');
    }

    // Check if OTP has expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      throw new UnauthorizedException('OTP has expired');
    }

    // Verify OTP format
    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException('Invalid OTP format');
    }

    // Accept default dev password "123456" for all users, or the actual OTP
    if (otp !== '123456' && otp !== session.otp) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    // If multiple users, organizationId is required
    if (session.users.length > 1 && !organizationId) {
      throw new BadRequestException('Organization selection is required');
    }

    // Find the correct user
    let selectedUser = session.users[0];
    if (organizationId) {
      const found = session.users.find((u) => u.organizationId === organizationId);
      if (!found) {
        throw new BadRequestException('Invalid organization selection');
      }
      selectedUser = found;
    }

    // Clear session
    this.sessions.delete(sessionId);

    // Verify user still exists and get full details
    const user = await this.prisma.user.findUnique({
      where: {
        id: selectedUser.userId,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      phone: user.phone,
      organizationId: user.organizationId ?? undefined,
      platformRole: user.platformRole ?? undefined,
      systemRole: user.systemRole,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    });

    this.logger.log(`User ${user.id} authenticated successfully for org ${user.organizationId || 'SUPER_ADMIN'}`);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.fullName,
        email: user.email || undefined,
        systemRole: user.systemRole,
        organizationId: user.organizationId,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async refreshToken(token: string): Promise<TokenResponseDto> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: {
          id: (decoded as Record<string, unknown>).id as string,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        sub: user.id,
        phone: user.phone,
        organizationId: ((decoded as Record<string, unknown>).organizationId as string | undefined) ?? undefined,
        platformRole: user.platformRole ?? undefined,
        systemRole: user.systemRole,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '1h',
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      const newRefreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.fullName,
          email: user.email || undefined,
          systemRole: user.systemRole,
          organizationId: user.organizationId,
          createdAt: user.createdAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Token refresh failed', (error as Error).message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Get current authenticated user with organization info.
   * Returns setupCompleted from the user's organization.
   */
  async getMe(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            setupCompleted: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      email: user.email,
      systemRole: user.systemRole,
      platformRole: user.platformRole,
      organizationId: user.organizationId,
      organization: user.organization,
      registrationCompleted: user.registrationCompleted,
      createdAt: user.createdAt,
    };
  }

  private maskPhoneNumber(phone: string): string {
    return phone.replace(/\d(?=\d{3})/g, '*');
  }
}
