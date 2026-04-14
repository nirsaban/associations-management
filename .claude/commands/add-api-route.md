# Add NestJS API Route

Create a new REST API endpoint with controller, service, DTOs, and tests.

## Input Parameters
- `module` - Domain name (e.g., "donor", "donation", "organization")
- `action` - HTTP method and operation (e.g., "GET getOne", "POST create", "PATCH update")
- `description` - What the endpoint does (Hebrew context welcome)
- `includeMultiOrgFunctionality` - Whether to scope by organizationId (default: true)
- `softDelete` - Whether to support soft delete (default: true for DELETE)

## Steps

### 1. Check existing module structure
```bash
ls -la apps/api/src/{module}/
```

Expected structure:
- `{module}.module.ts`
- `{module}.controller.ts`
- `{module}.service.ts`
- `dto/` directory with DTOs
- `__tests__/` or `*.spec.ts` files

### 2. Create/Update DTO file
Path: `apps/api/src/{module}/dto/{action}.dto.ts`

For GET, use query/param DTO:
```typescript
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class Get{Action}Dto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  include?: string; // Comma-separated relations
}

export class Get{Action}ResponseDto {
  id: string;
  organizationId: string;
  // ... other fields
  createdAt: Date;
  updatedAt: Date;
}
```

For POST/PATCH, use request body DTO:
```typescript
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class Create{Action}Dto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  // Add class-validator decorators to all fields
  // Use Hebrew descriptions: @ApiProperty({ description: 'שם התורם' })
}

export class Update{Action}Dto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // All fields optional for PATCH
}
```

### 3. Add service method
Path: `apps/api/src/{module}/{module}.service.ts`

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Create{Action}Dto, Update{Action}Dto } from './dto';

@Injectable()
export class {Action}Service {
  private readonly logger = new Logger({Action}Service.name);

  constructor(private prisma: PrismaService) {}

  async getOne(organizationId: string, id: string) {
    this.logger.log(`Fetching {action} for org ${organizationId}, id ${id}`);

    const record = await this.prisma.{model}.findFirst({
      where: {
        id,
        organizationId, // CRITICAL: Always scope by organizationId
        deletedAt: null, // CRITICAL: Always exclude soft-deleted
      },
    });

    if (!record) {
      throw new NotFoundException('{Action} not found');
    }

    return record;
  }

  async create(organizationId: string, dto: Create{Action}Dto) {
    this.logger.log(`Creating {action} for org ${organizationId}`);

    const record = await this.prisma.{model}.create({
      data: {
        ...dto,
        organizationId, // CRITICAL: Set organizationId from request context
      },
    });

    this.logger.log(`Created {action} with id ${record.id}`);
    return record;
  }

  async update(organizationId: string, id: string, dto: Update{Action}Dto) {
    this.logger.log(`Updating {action} ${id} for org ${organizationId}`);

    // Verify ownership before update
    const existing = await this.getOne(organizationId, id);
    if (!existing) {
      throw new NotFoundException('{Action} not found');
    }

    const record = await this.prisma.{model}.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Updated {action} ${id}`);
    return record;
  }

  async softDelete(organizationId: string, id: string) {
    this.logger.log(`Soft-deleting {action} ${id} for org ${organizationId}`);

    // Verify ownership before delete
    await this.getOne(organizationId, id);

    const record = await this.prisma.{model}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Soft-deleted {action} ${id}`);
    return record;
  }
}
```

### 4. Add controller method
Path: `apps/api/src/{module}/{module}.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Param,
  Body,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { GetUser } from '@/auth/get-user.decorator';
import { UserPayload } from '@/auth/user-payload.interface';
import { {Action}Service } from './{module}.service';
import {
  Create{Action}Dto,
  Update{Action}Dto,
  Get{Action}ResponseDto,
} from './dto';

@ApiTags('{Action}')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/{module}s')
export class {Action}Controller {
  constructor(private readonly service: {Action}Service) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get {action} by ID',
    description: 'Retrieve a single {action} record',
  })
  @ApiResponse({
    status: 200,
    description: '{Action} retrieved',
    type: Get{Action}ResponseDto,
  })
  @ApiResponse({ status: 404, description: '{Action} not found' })
  async getOne(
    @Param('id') id: string,
    @GetUser() user: UserPayload,
  ) {
    const record = await this.service.getOne(user.organizationId, id);
    return { data: record };
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create {action}',
    description: 'Create a new {action} record',
  })
  @ApiResponse({
    status: 201,
    description: '{Action} created',
    type: Get{Action}ResponseDto,
  })
  async create(
    @Body() dto: Create{Action}Dto,
    @GetUser() user: UserPayload,
  ) {
    const record = await this.service.create(user.organizationId, dto);
    return { data: record };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update {action}',
    description: 'Update a {action} record',
  })
  @ApiResponse({
    status: 200,
    description: '{Action} updated',
    type: Get{Action}ResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: Update{Action}Dto,
    @GetUser() user: UserPayload,
  ) {
    const record = await this.service.update(user.organizationId, id, dto);
    return { data: record };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete {action}',
    description: 'Soft-delete a {action} record',
  })
  @ApiResponse({ status: 204, description: '{Action} deleted' })
  async delete(
    @Param('id') id: string,
    @GetUser() user: UserPayload,
  ) {
    await this.service.softDelete(user.organizationId, id);
  }
}
```

### 5. Create service spec test
Path: `apps/api/src/{module}/__tests__/{module}.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { {Action}Service } from '../{module}.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('{Action}Service', () => {
  let service: {Action}Service;
  let prisma: PrismaService;

  const mockOrgId = 'org-123';
  const mockRecord = {
    id: 'id-123',
    organizationId: mockOrgId,
    name: 'Test {Action}',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {Action}Service,
        {
          provide: PrismaService,
          useValue: {
            {model}: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<{Action}Service>({Action}Service);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getOne', () => {
    it('returns {action} when found', async () => {
      jest.spyOn(prisma.{model}, 'findFirst').mockResolvedValue(mockRecord);

      const result = await service.getOne(mockOrgId, 'id-123');

      expect(result).toEqual(mockRecord);
      expect(prisma.{model}.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'id-123',
          organizationId: mockOrgId,
          deletedAt: null,
        },
      });
    });

    it('throws NotFoundException when not found', async () => {
      jest.spyOn(prisma.{model}, 'findFirst').mockResolvedValue(null);

      await expect(service.getOne(mockOrgId, 'id-999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('scopes query by organizationId', async () => {
      jest.spyOn(prisma.{model}, 'findFirst').mockResolvedValue(mockRecord);

      await service.getOne(mockOrgId, 'id-123');

      expect(prisma.{model}.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrgId,
          }),
        }),
      );
    });

    it('excludes soft-deleted records', async () => {
      jest.spyOn(prisma.{model}, 'findFirst').mockResolvedValue(null);

      await expect(service.getOne(mockOrgId, 'id-123')).rejects.toThrow();

      expect(prisma.{model}.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('creates {action} with organizationId', async () => {
      const dto = { name: 'New {Action}' };
      jest.spyOn(prisma.{model}, 'create').mockResolvedValue(mockRecord);

      const result = await service.create(mockOrgId, dto);

      expect(result).toEqual(mockRecord);
      expect(prisma.{model}.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          organizationId: mockOrgId,
        },
      });
    });

    it('sets organizationId from parameter', async () => {
      const dto = { name: 'New {Action}' };
      jest.spyOn(prisma.{model}, 'create').mockResolvedValue(mockRecord);

      await service.create(mockOrgId, dto);

      expect(prisma.{model}.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: mockOrgId,
          }),
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('soft-deletes {action}', async () => {
      jest
        .spyOn(prisma.{model}, 'findFirst')
        .mockResolvedValue(mockRecord);
      jest
        .spyOn(prisma.{model}, 'update')
        .mockResolvedValue({
          ...mockRecord,
          deletedAt: new Date(),
        });

      await service.softDelete(mockOrgId, 'id-123');

      expect(prisma.{model}.update).toHaveBeenCalledWith({
        where: { id: 'id-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('never hard-deletes', async () => {
      jest
        .spyOn(prisma.{model}, 'findFirst')
        .mockResolvedValue(mockRecord);

      // prisma.{model}.delete should NOT be called
      expect(prisma.{model}.delete).toBeUndefined();
    });
  });
});
```

### 6. Create controller spec test
Path: `apps/api/src/{module}/__tests__/{module}.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { {Action}Controller } from '../{module}.controller';
import { {Action}Service } from '../{module}.service';

describe('{Action}Controller', () => {
  let controller: {Action}Controller;
  let service: {Action}Service;

  const mockUser = {
    id: 'user-123',
    organizationId: 'org-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [{Action}Controller],
      providers: [
        {
          provide: {Action}Service,
          useValue: {
            getOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<{Action}Controller>({Action}Controller);
    service = module.get<{Action}Service>({Action}Service);
  });

  describe('getOne', () => {
    it('calls service with organizationId from user', async () => {
      const mockRecord = { id: 'id-123', organizationId: mockUser.organizationId };
      jest.spyOn(service, 'getOne').mockResolvedValue(mockRecord);

      const result = await controller.getOne('id-123', mockUser as any);

      expect(service.getOne).toHaveBeenCalledWith(mockUser.organizationId, 'id-123');
      expect(result).toEqual({ data: mockRecord });
    });
  });

  describe('create', () => {
    it('calls service with organizationId from user', async () => {
      const dto = { name: 'New {Action}' };
      const mockRecord = { id: 'id-123', organizationId: mockUser.organizationId };
      jest.spyOn(service, 'create').mockResolvedValue(mockRecord);

      const result = await controller.create(dto as any, mockUser as any);

      expect(service.create).toHaveBeenCalledWith(mockUser.organizationId, dto);
      expect(result).toEqual({ data: mockRecord });
    });
  });

  describe('delete', () => {
    it('calls service softDelete', async () => {
      jest.spyOn(service, 'softDelete').mockResolvedValue(undefined);

      await controller.delete('id-123', mockUser as any);

      expect(service.softDelete).toHaveBeenCalledWith(
        mockUser.organizationId,
        'id-123',
      );
    });
  });
});
```

### 7. Update module registration
Path: `apps/api/src/{module}/{module}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { {Action}Controller } from './{module}.controller';
import { {Action}Service } from './{module}.service';

@Module({
  controllers: [{Action}Controller],
  providers: [{Action}Service],
  exports: [{Action}Service],
})
export class {Action}Module {}
```

### 8. Register module in AppModule
Path: `apps/api/src/app.module.ts`

Add to imports:
```typescript
import { {Action}Module } from './{module}/{module}.module';

@Module({
  imports: [
    // ... other modules
    {Action}Module,
  ],
  // ...
})
export class AppModule {}
```

### 9. Validation checklist

Run:
```bash
pnpm typecheck
pnpm lint
pnpm test --run
```

Verify:
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All tests pass with >= 70% coverage
- [ ] Every service method has organizationId parameter
- [ ] Every prisma query includes `where: { organizationId, deletedAt: null }`
- [ ] DELETE operation uses soft delete (update with deletedAt)
- [ ] No hard delete (prisma.*.delete) used anywhere
- [ ] DTO has @ApiProperty decorators with Hebrew descriptions
- [ ] Controller has @UseGuards(JwtAuthGuard, RolesGuard)
- [ ] Controller has @ApiOperation and @ApiResponse decorators
- [ ] Service has logging on entry and exit
- [ ] No sensitive data logged (IDs, emails, passwords)
- [ ] Response envelope wraps data in `{ data, meta? }`
- [ ] NotFoundException thrown when record not found or belongs to different org

## Success Criteria
- Endpoint compiles without errors
- All tests pass with >= 70% coverage
- Swagger documentation generated for endpoint
- organizationId scoping verified in all queries
- Soft delete enforced (no hard deletes)
- All DTOs validated with class-validator
- Service layer tested in isolation from controller
- JWT auth guard active on endpoint
