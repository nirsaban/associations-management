import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'יצירת משתמש',
    description: 'יצירת משתמש חדש בעמותה',
  })
  async create(
    @CurrentUser() user: ICurrentUser,
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ data: UserResponseDto }> {
    const createdUser = await this.usersService.create(user.organizationId, createUserDto);
    return { data: createdUser };
  }

  @Get()
  @ApiOperation({
    summary: 'רשימת משתמשים',
    description: 'קבלת רשימה ממוספרת של משתמשים בעמותה עם אפשרות חיפוש',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'חיפוש לפי שם או טלפון' })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<{ data: UserResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    return this.usersService.findAll(user.organizationId, page, limit, search);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'פרטי משתמש',
    description: 'קבלת פרטי משתמש לפי מזהה, מוגבל לעמותה',
  })
  @ApiParam({ name: 'id', description: 'מזהה המשתמש' })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: UserResponseDto }> {
    const foundUser = await this.usersService.findOne(user.organizationId, id);
    return { data: foundUser };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'עדכון משתמש',
    description: 'עדכון פרטי משתמש בעמותה',
  })
  @ApiParam({ name: 'id', description: 'מזהה המשתמש' })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ data: UserResponseDto }> {
    const updatedUser = await this.usersService.update(
      user.organizationId,
      id,
      updateUserDto,
      user.sub,
    );
    return { data: updatedUser };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'מחיקת משתמש',
    description: 'מחיקה רכה של משתמש (deletedAt) — הנתונים נשמרים',
  })
  @ApiParam({ name: 'id', description: 'מזהה המשתמש' })
  async remove(@CurrentUser() user: ICurrentUser, @Param('id') id: string): Promise<void> {
    await this.usersService.remove(user.organizationId, id);
  }
}
