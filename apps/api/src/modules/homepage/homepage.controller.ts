import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { HomepageService } from './homepage.service';
import { HomepageContextDto } from './dto';

@ApiTags('Homepage')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get('context')
  @ApiOperation({
    summary: 'Get homepage context',
    description: 'מחזיר הקשר מותאם אישית לעמוד הבית בהתאם לתפקיד המשתמש',
  })
  async getContext(@CurrentUser() user: ICurrentUser): Promise<{ data: HomepageContextDto }> {
    const context = await this.homepageService.getContext(user.id, user.organizationId ?? null);
    return { data: context };
  }
}
