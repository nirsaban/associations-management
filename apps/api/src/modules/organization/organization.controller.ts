import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { OrganizationService } from './organization.service';
import { SetupOrganizationDto } from './dto/setup-organization.dto';
import { OrganizationResponseDto } from '@modules/platform/dto/organization-response.dto';

@ApiTags('Organization')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('me')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get my organization',
    description: 'Get current user\'s organization details (ADMIN only)',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async getMyOrganization(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const organization = await this.organizationService.getMyOrganization(
      user.id,
      user.organizationId,
    );
    return { data: organization };
  }

  @Patch('me/setup')
  @Roles('admin')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Complete organization setup',
    description: 'Complete the setup wizard for current organization (ADMIN only). Sets setupCompleted=true.',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async completeSetup(
    @CurrentUser() user: ICurrentUser,
    @Body() setupDto: SetupOrganizationDto,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const organization = await this.organizationService.completeSetup(
      user.id,
      user.organizationId,
      setupDto,
    );
    return { data: organization };
  }

  @Post('me/logo')
  @Roles('admin')
  @ApiOperation({
    summary: 'Upload organization logo',
    description: 'Upload logo for current organization (ADMIN only). Expects logoUrl in body.',
  })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async uploadLogo(
    @CurrentUser() user: ICurrentUser,
    @Body('logoUrl') logoUrl: string,
  ): Promise<{ data: OrganizationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    if (!logoUrl) {
      throw new BadRequestException('logoUrl is required');
    }

    const organization = await this.organizationService.uploadLogo(
      user.id,
      user.organizationId,
      logoUrl,
    );
    return { data: organization };
  }
}
