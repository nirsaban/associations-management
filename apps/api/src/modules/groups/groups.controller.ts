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
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { GroupResponseDto } from './dto/group-response.dto';

@ApiTags('Groups')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Create group',
    description: 'Create a new group in the organization',
  })
  async create(
    @CurrentUser() user: ICurrentUser,
    @Body() createGroupDto: CreateGroupDto,
  ): Promise<{ data: GroupResponseDto }> {
    const group = await this.groupsService.create(user.organizationId, createGroupDto);
    return { data: group };
  }

  @Get()
  @ApiOperation({
    summary: 'List groups',
    description: 'List all groups in the organization',
  })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<object> {
    return this.groupsService.findAll(user.organizationId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get group',
    description: 'Get a specific group',
  })
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: GroupResponseDto }> {
    const group = await this.groupsService.findOne(user.organizationId, id);
    return { data: group };
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Update group',
    description: 'Update group information',
  })
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<{ data: GroupResponseDto }> {
    const group = await this.groupsService.update(user.organizationId, id, updateGroupDto);
    return { data: group };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete group',
    description: 'Soft delete a group',
  })
  async remove(@CurrentUser() user: ICurrentUser, @Param('id') id: string): Promise<void> {
    await this.groupsService.remove(user.organizationId, id);
  }

  @Post(':id/assign-manager')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Assign manager to group',
    description: 'Assign a user as manager for the group',
  })
  async assignManager(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() assignManagerDto: AssignManagerDto,
  ): Promise<{ data: GroupResponseDto }> {
    const group = await this.groupsService.assignManager(
      user.organizationId,
      id,
      assignManagerDto,
    );
    return { data: group };
  }

  @Post(':id/members/:userId')
  @Roles('admin', 'manager')
  @ApiOperation({
    summary: 'Add member to group',
    description: 'Add a user as a member of the group',
  })
  async addMember(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    return this.groupsService.addMember(user.organizationId, id, userId);
  }

  @Delete(':id/members/:userId')
  @Roles('admin', 'manager')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove member from group',
    description: 'Remove a user from the group',
  })
  async removeMember(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.groupsService.removeMember(user.organizationId, id, userId);
  }

  @Get(':id/members')
  @ApiOperation({
    summary: 'Get group members',
    description: 'List all members of the group',
  })
  async getMembers(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<{ data: Record<string, unknown>[] }> {
    return this.groupsService.getMembers(user.organizationId, id);
  }
}
