import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { AuthService } from '@modules/auth/auth.service';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server/script/deps';
import { PushSubscribeDto } from './dto/push-subscribe.dto';
import { WebauthnRegisterVerifyDto } from './dto/webauthn-register.dto';
import { WebauthnAuthenticateOptionsDto, WebauthnAuthenticateVerifyDto } from './dto/webauthn-authenticate.dto';

// In-memory challenge store (per-user, short-lived)
const challengeStore = new Map<string, { challenge: string; expiresAt: Date }>();

function getRpId(): string {
  return process.env.WEBAUTHN_RP_ID || 'localhost';
}

function getRpName(): string {
  return process.env.WEBAUTHN_RP_NAME || 'ניהול עמותות';
}

function getOrigin(): string {
  return process.env.WEBAUTHN_ORIGIN || 'http://localhost:3010';
}

@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // ── Push Notifications ───────────────────────────────────────────────────

  async pushSubscribe(userId: string, organizationId: string | null, dto: PushSubscribeDto) {
    const deviceInfo = dto.userAgent ? { userAgent: dto.userAgent } : {};

    await this.prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: { userId, endpoint: dto.endpoint },
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        deviceInfo,
        isActive: true,
      },
      create: {
        userId,
        organizationId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        deviceInfo,
        isActive: true,
      },
    });

    return { ok: true };
  }

  async pushUnsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { ok: true };
  }

  getVapidPublicKey(): string {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) {
      throw new BadRequestException('VAPID public key not configured');
    }
    return key;
  }

  // ── WebAuthn Registration ────────────────────────────────────────────────

  async generateRegisterOptions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, fullName: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const existingCredentials = await this.prisma.webauthnCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName: getRpName(),
      rpID: getRpId(),
      userID: new TextEncoder().encode(user.id),
      userName: user.phone,
      userDisplayName: user.fullName,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.credentialId,
        transports: cred.transports as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    // Store challenge
    challengeStore.set(`reg:${userId}`, {
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return options;
  }

  async verifyRegister(userId: string, dto: WebauthnRegisterVerifyDto) {
    const stored = challengeStore.get(`reg:${userId}`);
    if (!stored || new Date() > stored.expiresAt) {
      challengeStore.delete(`reg:${userId}`);
      throw new BadRequestException('Registration challenge expired');
    }

    const verification = await verifyRegistrationResponse({
      response: dto.attestation as unknown as RegistrationResponseJSON,
      expectedChallenge: stored.challenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
    });

    challengeStore.delete(`reg:${userId}`);

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('WebAuthn registration verification failed');
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await this.prisma.webauthnCredential.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: (credential.transports as string[]) || [],
        deviceName: dto.deviceName || null,
      },
    });

    this.logger.log(`WebAuthn credential registered for user ${userId}`);
    return { verified: true };
  }

  // ── WebAuthn Authentication ──────────────────────────────────────────────

  async generateAuthenticateOptions(dto: WebauthnAuthenticateOptionsDto) {
    // Find all users with this phone (across orgs)
    const users = await this.prisma.user.findMany({
      where: { phone: dto.phone, deletedAt: null, isActive: true },
      select: { id: true },
    });

    if (users.length === 0) {
      throw new BadRequestException('משתמש לא נמצא');
    }

    const userIds = users.map((u) => u.id);

    const credentials = await this.prisma.webauthnCredential.findMany({
      where: { userId: { in: userIds } },
      select: { credentialId: true, transports: true },
    });

    if (credentials.length === 0) {
      throw new BadRequestException('אין אמצעי ביומטרי רשום למספר זה');
    }

    const options = await generateAuthenticationOptions({
      rpID: getRpId(),
      allowCredentials: credentials.map((cred) => ({
        id: cred.credentialId,
        transports: cred.transports as AuthenticatorTransportFuture[],
      })),
      userVerification: 'preferred',
    });

    // Store challenge keyed by phone
    challengeStore.set(`auth:${dto.phone}`, {
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return options;
  }

  async verifyAuthenticate(dto: WebauthnAuthenticateVerifyDto) {
    const stored = challengeStore.get(`auth:${dto.phone}`);
    if (!stored || new Date() > stored.expiresAt) {
      challengeStore.delete(`auth:${dto.phone}`);
      throw new UnauthorizedException('זיהוי ביומטרי נכשל — אנא התחבר עם קוד חד-פעמי');
    }

    const assertion = dto.assertion as unknown as AuthenticationResponseJSON;

    // Find the credential
    const credential = await this.prisma.webauthnCredential.findUnique({
      where: { credentialId: assertion.id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullName: true,
            email: true,
            organizationId: true,
            platformRole: true,
            systemRole: true,
            isActive: true,
            deletedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!credential || !credential.user.isActive || credential.user.deletedAt) {
      challengeStore.delete(`auth:${dto.phone}`);
      throw new UnauthorizedException('זיהוי ביומטרי נכשל — אנא התחבר עם קוד חד-פעמי');
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: assertion,
        expectedChallenge: stored.challenge,
        expectedOrigin: getOrigin(),
        expectedRPID: getRpId(),
        credential: {
          id: credential.credentialId,
          publicKey: credential.publicKey,
          counter: Number(credential.counter),
          transports: credential.transports as AuthenticatorTransportFuture[],
        },
      });
    } catch {
      challengeStore.delete(`auth:${dto.phone}`);
      throw new UnauthorizedException('זיהוי ביומטרי נכשל — אנא התחבר עם קוד חד-פעמי');
    }

    challengeStore.delete(`auth:${dto.phone}`);

    if (!verification.verified) {
      throw new UnauthorizedException('זיהוי ביומטרי נכשל — אנא התחבר עם קוד חד-פעמי');
    }

    // Update credential counter + lastUsedAt
    await this.prisma.webauthnCredential.update({
      where: { id: credential.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    // Issue JWT using existing auth service's token generation
    const user = credential.user;
    const tokens = await this.authService.issueTokens({
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      email: user.email,
      organizationId: user.organizationId,
      platformRole: user.platformRole,
      systemRole: user.systemRole,
      createdAt: user.createdAt,
    });

    this.logger.log(`User ${user.id} authenticated via WebAuthn`);
    return tokens;
  }

  // ── Activation Complete ──────────────────────────────────────────────────

  async completeActivation(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { activationCompleted: true },
    });

    return { ok: true };
  }
}
