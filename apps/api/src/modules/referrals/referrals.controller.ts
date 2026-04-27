import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { ReferralsService } from './referrals.service';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'הקישור שלי',
    description: 'קבלת קוד הפניה אישי וסטטיסטיקות',
  })
  async getMyReferral(@CurrentUser() user: ICurrentUser) {
    const stats = await this.referralsService.getUserStats(
      user.organizationId,
      user.id,
    );
    return { data: stats };
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'סטטיסטיקות הפניות',
    description: 'סטטיסטיקות הפניות של כל המשתמשים בעמותה — מנהל בלבד',
  })
  async getAdminStats(@CurrentUser() user: ICurrentUser) {
    const stats = await this.referralsService.getAdminStats(
      user.organizationId,
    );
    return { data: stats };
  }
}
