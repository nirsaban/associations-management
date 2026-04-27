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
  private readonly revokedTokens = new Map<string, number>(); // token -> expiry timestamp

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly greenApiService: GreenApiService,
  ) {}

  private normalizePhoneToLocal(phone: string): string {
    let trimmed = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (/^[5-9]\d{7,8}$/.test(trimmed)) trimmed = '0' + trimmed;
    if (trimmed.startsWith('+972')) return '0' + trimmed.slice(4);
    if (trimmed.startsWith('972')) return '0' + trimmed.slice(3);
    return trimmed;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const phone = this.normalizePhoneToLocal(loginDto.phone);

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

    // Generate 6-digit OTP — fixed to 123456 for all environments
    const otp = '123456';

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
    // OTP_OVERRIDE_PHONE: send all OTPs to a single phone for testing all roles
    const otpRecipient = process.env.OTP_OVERRIDE_PHONE || phone;
    try {
      await this.greenApiService.sendOtpSms(otpRecipient, otp);
      this.logger.log(`OTP sent successfully to ${this.maskPhoneNumber(otpRecipient)}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${this.maskPhoneNumber(otpRecipient)}`, (error as Error).stack);
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
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<TokenResponseDto> {
    const phone = this.normalizePhoneToLocal(verifyOtpDto.phone);
    const { otp, organizationId, sessionId } = verifyOtpDto;

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

    // Accept default dev password "123456" only when explicitly enabled
    const isDevBypass =
      process.env.ALLOW_DEV_OTP === 'true' &&
      process.env.NODE_ENV !== 'production' &&
      otp === '123456';
    if (!isDevBypass && otp !== session.otp) {
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
        platformRole: user.platformRole ?? undefined,
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
          id: (decoded as Record<string, unknown>).sub as string,
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
          platformRole: user.platformRole ?? undefined,
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
            status: true,
          },
        },
        groupMemberships: {
          select: { groupId: true, role: true },
        },
        managedGroups: {
          select: { id: true },
          where: { deletedAt: null },
        },
      },
    });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const managerMembership = user.groupMemberships.find((m) => m.role === 'MANAGER');
    const anyMembership = user.groupMemberships[0] ?? null;
    // Check both GroupMembership role AND Group.managerUserId as fallback
    const isGroupManager = !!managerMembership || user.managedGroups.length > 0;
    const managedGroupId = managerMembership?.groupId ?? user.managedGroups[0]?.id ?? null;
    const groupMembershipGroupId = anyMembership?.groupId ?? null;

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
      activationCompleted: user.activationCompleted,
      isGroupManager,
      managedGroupId,
      groupMembershipGroupId,
      createdAt: user.createdAt,
    };
  }

  /**
   * Issue JWT tokens for a user. Used by both OTP verification and WebAuthn authentication.
   */
  async issueTokens(user: {
    id: string;
    phone: string;
    fullName: string;
    email: string | null;
    organizationId: string | null;
    platformRole: string | null;
    systemRole: string;
    createdAt: Date;
  }): Promise<TokenResponseDto> {
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
        platformRole: user.platformRole ?? undefined,
        systemRole: user.systemRole,
        organizationId: user.organizationId,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  revokeToken(token: string): void {
    try {
      const payload = this.jwtService.decode(token) as { exp?: number } | null;
      const expiry = payload?.exp ?? Math.floor(Date.now() / 1000) + 3600;
      this.revokedTokens.set(token, expiry);
      // Clean up expired entries
      const now = Math.floor(Date.now() / 1000);
      for (const [t, exp] of this.revokedTokens) {
        if (exp < now) this.revokedTokens.delete(t);
      }
    } catch {
      // If decode fails, still revoke with 1-hour expiry
      this.revokedTokens.set(token, Math.floor(Date.now() / 1000) + 3600);
    }
  }

  isTokenRevoked(token: string): boolean {
    return this.revokedTokens.has(token);
  }

  private maskPhoneNumber(phone: string): string {
    return phone.replace(/\d(?=\d{3})/g, '*');
  }
}
