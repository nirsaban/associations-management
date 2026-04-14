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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, type CurrentUser as ICurrentUser } from '@common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user in the organization',
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
    summary: 'List users',
    description: 'List all users in the organization',
  })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<object> {
    return this.usersService.findAll(user.organizationId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user',
    description: 'Get a specific user',
  })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: UserResponseDto }> {
    const foundUser = await this.usersService.findOne(user.organizationId, id);
    return { data: foundUser };
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user information',
  })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ data: UserResponseDto }> {
    const updatedUser = await this.usersService.update(
      user.organizationId,
      id,
      updateUserDto,
    );
    return { data: updatedUser };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft delete a user',
  })
  async remove(@CurrentUser() user: ICurrentUser, @Param('id') id: string): Promise<void> {
    await this.usersService.remove(user.organizationId, id);
  }
}
