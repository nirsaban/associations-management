import { Controller, Post, Get, Delete, Body, HttpCode, UseGuards, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { ActivationService } from './activation.service';
import { PushSubscribeDto } from './dto/push-subscribe.dto';
import { WebauthnRegisterVerifyDto } from './dto/webauthn-register.dto';
import { WebauthnAuthenticateOptionsDto, WebauthnAuthenticateVerifyDto } from './dto/webauthn-authenticate.dto';

@ApiTags('Activation')
@Controller('activation')
export class ActivationController {
  constructor(private readonly activationService: ActivationService) {}

  // ── Push Notifications ───────────────────────────────────────────────────

  @Post('push/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @ApiResponse({ status: 200, description: 'Subscribed successfully' })
  async pushSubscribe(@CurrentUser() user: ICurrentUser, @Body() dto: PushSubscribeDto) {
    return {
      data: await this.activationService.pushSubscribe(
        user.sub,
        user.organizationId || null,
        dto,
      ),
    };
  }

  @Delete('push/unsubscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  async pushUnsubscribe(@CurrentUser() user: ICurrentUser, @Query('endpoint') endpoint: string) {
    return { data: await this.activationService.pushUnsubscribe(user.sub, endpoint) };
  }

  @Get('push/vapid-public-key')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  @ApiResponse({ status: 200, description: 'VAPID public key' })
  async getVapidPublicKey() {
    return { data: { vapidPublicKey: this.activationService.getVapidPublicKey() } };
  }

  // ── WebAuthn Registration ────────────────────────────────────────────────

  @Post('webauthn/register/options')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate WebAuthn registration options' })
  @ApiResponse({ status: 200, description: 'Registration options generated' })
  async webauthnRegisterOptions(@CurrentUser() user: ICurrentUser) {
    return { data: await this.activationService.generateRegisterOptions(user.sub) };
  }

  @Post('webauthn/register/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify WebAuthn registration' })
  @ApiResponse({ status: 200, description: 'Registration verified' })
  async webauthnRegisterVerify(@CurrentUser() user: ICurrentUser, @Body() dto: WebauthnRegisterVerifyDto) {
    return { data: await this.activationService.verifyRegister(user.sub, dto) };
  }

  // ── WebAuthn Authentication (public — login path) ────────────────────────

  @Post('webauthn/authenticate/options')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Generate WebAuthn authentication options' })
  @ApiResponse({ status: 200, description: 'Authentication options generated' })
  async webauthnAuthenticateOptions(@Body() dto: WebauthnAuthenticateOptionsDto) {
    return { data: await this.activationService.generateAuthenticateOptions(dto) };
  }

  @Post('webauthn/authenticate/verify')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify WebAuthn authentication and issue tokens' })
  @ApiResponse({ status: 200, description: 'Authentication verified, tokens issued' })
  async webauthnAuthenticateVerify(@Body() dto: WebauthnAuthenticateVerifyDto) {
    return { data: await this.activationService.verifyAuthenticate(dto) };
  }

  // ── Group Selection ──────────────────────────────────────────────────────

  @Get('groups')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'List active groups in user\'s organization for activation' })
  @ApiResponse({ status: 200, description: 'Groups list with current membership info' })
  async listGroupsForActivation(@CurrentUser() user: ICurrentUser) {
    return { data: await this.activationService.listGroupsForActivation(user.sub, user.organizationId) };
  }

  @Post('group-select/:groupId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Select or confirm group membership during activation' })
  @ApiResponse({ status: 200, description: 'Group membership confirmed' })
  async selectGroup(@CurrentUser() user: ICurrentUser, @Param('groupId') groupId: string) {
    return { data: await this.activationService.selectGroup(user.sub, user.organizationId, groupId) };
  }

  // ── Activation Complete ──────────────────────────────────────────────────

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark activation flow as completed for the current user' })
  @ApiResponse({ status: 200, description: 'Activation completed' })
  async completeActivation(@CurrentUser() user: ICurrentUser) {
    return { data: await this.activationService.completeActivation(user.sub) };
  }
}
