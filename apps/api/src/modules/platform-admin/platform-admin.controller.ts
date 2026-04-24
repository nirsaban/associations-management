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
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '@common/guards/super-admin.guard';
import { SuperAdminOnly } from '@common/decorators/super-admin-only.decorator';
import { PlatformAdminSchemaService } from './platform-admin-schema.service';
import { PlatformAdminCrudService } from './platform-admin-crud.service';

@ApiTags('Platform Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@SuperAdminOnly()
@Controller('platform/admin')
export class PlatformAdminController {
  constructor(
    private readonly schemaService: PlatformAdminSchemaService,
    private readonly crudService: PlatformAdminCrudService,
  ) {}

  // ── Schema endpoints (MUST be before :model to avoid capture) ────────

  @Get('schema')
  async getModels(): Promise<{ data: unknown[] }> {
    const models = this.schemaService.getModels();

    // Fetch counts in parallel
    const withCounts = await Promise.all(
      models.map(async (m) => {
        const count = await this.crudService.count(m.name);
        return { ...m, recordCount: count };
      }),
    );

    return { data: withCounts };
  }

  @Get('schema/:model')
  getModelSchema(@Param('model') model: string): { data: unknown } {
    const schema = this.schemaService.getModelSchema(model);
    if (!schema) {
      throw new BadRequestException(`מודל לא חוקי: ${model}`);
    }
    return { data: schema };
  }

  // ── Generic CRUD endpoints ───────────────────────────────────────────

  @Get(':model')
  async findAll(
    @Param('model') model: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('organizationId') organizationId?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDir') orderDir?: 'asc' | 'desc',
  ) {
    return this.crudService.findMany(model, {
      page,
      limit,
      search,
      organizationId,
      orderBy,
      orderDir,
    });
  }

  @Get(':model/:id')
  async findOne(
    @Param('model') model: string,
    @Param('id') id: string,
  ) {
    const record = await this.crudService.findOne(model, id);
    return { data: record };
  }

  @Post(':model')
  async create(
    @Param('model') model: string,
    @Body() body: Record<string, unknown>,
  ) {
    const record = await this.crudService.create(model, body);
    return { data: record };
  }

  @Patch(':model/:id')
  @HttpCode(200)
  async update(
    @Param('model') model: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const record = await this.crudService.update(model, id, body);
    return { data: record };
  }

  @Delete(':model/:id')
  @HttpCode(204)
  async remove(
    @Param('model') model: string,
    @Param('id') id: string,
  ) {
    await this.crudService.remove(model, id);
  }
}
