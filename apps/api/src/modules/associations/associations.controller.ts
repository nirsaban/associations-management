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
import { AssociationsService } from './associations.service';
import { SetupAssociationDto } from './dto/setup-association.dto';
import { AssociationResponseDto } from '@modules/platform/dto/association-response.dto';

@ApiTags('Associations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('associations')
export class AssociationsController {
  constructor(private readonly associationsService: AssociationsService) {}

  @Get('me')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get my organization',
    description: 'Get current user\'s organization details (ADMIN only)',
  })
  @ApiResponse({ status: 200, type: AssociationResponseDto })
  async getMyAssociation(
    @CurrentUser() user: ICurrentUser,
  ): Promise<{ data: AssociationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const association = await this.associationsService.getMyAssociation(
      user.id,
      user.organizationId,
    );
    return { data: association };
  }

  @Patch('me/setup')
  @Roles('admin')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Complete organization setup',
    description: 'Complete the setup wizard for current organization (ADMIN only). Sets setupCompleted=true.',
  })
  @ApiResponse({ status: 200, type: AssociationResponseDto })
  async completeSetup(
    @CurrentUser() user: ICurrentUser,
    @Body() setupDto: SetupAssociationDto,
  ): Promise<{ data: AssociationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    const association = await this.associationsService.completeSetup(
      user.id,
      user.organizationId,
      setupDto,
    );
    return { data: association };
  }

  @Post('me/logo')
  @Roles('admin')
  @ApiOperation({
    summary: 'Upload organization logo',
    description: 'Upload logo for current organization (ADMIN only). Expects logoUrl in body.',
  })
  @ApiResponse({ status: 200, type: AssociationResponseDto })
  async uploadLogo(
    @CurrentUser() user: ICurrentUser,
    @Body('logoUrl') logoUrl: string,
  ): Promise<{ data: AssociationResponseDto }> {
    if (!user.organizationId) {
      throw new BadRequestException('User is not associated with an organization');
    }

    if (!logoUrl) {
      throw new BadRequestException('logoUrl is required');
    }

    const association = await this.associationsService.uploadLogo(
      user.id,
      user.organizationId,
      logoUrl,
    );
    return { data: association };
  }
}
