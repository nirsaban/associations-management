# Add NestJS Module

Scaffold a complete NestJS domain module with controller, service, DTOs, and tests. All routes are automatically multi-tenant scoped by organizationId.

## Input Parameters
- `moduleName` - Domain name in PascalCase (e.g., "Donor", "Donation", "Event")
- `entityName` - Database model name (usually same as moduleName)
- `description` - What this module manages (Hebrew context welcome)
- `includeSwagger` - Include Swagger decorators (default: true)

## Steps

### 1. Create module directory structure
```bash
mkdir -p apps/api/src/{moduleName}/
mkdir -p apps/api/src/{moduleName}/dto
mkdir -p apps/api/src/{moduleName}/__tests__
```

### 2. Create entity model in Prisma
Path: `prisma/schema.prisma`

Add (or verify exists):
```prisma
model {EntityName} {
  id             String    @id @default(cuid())
  organizationId String                          // Multi-tenancy
  
  // Add domain-specific fields
  // Example for Donor:
  // name           String
  // email          String?
  // phone          String?
  // donationAmount Decimal?
  
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?                       // Soft delete

  // Add indexes
  @@index([organizationId])
  @@index([createdAt])
  @@unique([organizationId, email])              // If email is unique per org
}
```

Run migration:
```bash
pnpm prisma migrate dev --name add_{moduleName}
```

### 3. Create DTOs
Path: `apps/api/src/{moduleName}/dto/create-{moduleName}.dto.ts`

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create{EntityName}Dto {
  @ApiProperty({
    description: 'שם {moduleName}',
    example: 'דוגמה',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'דוא"ל',
    example: 'example@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Add other fields with decorators
}
```

Path: `apps/api/src/{moduleName}/dto/update-{moduleName}.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { Create{EntityName}Dto } from './create-{moduleName}.dto';

export class Update{EntityName}Dto extends PartialType(Create{EntityName}Dto) {}
```

Path: `apps/api/src/{moduleName}/dto/index.ts`

```typescript
export { Create{EntityName}Dto } from './create-{moduleName}.dto';
export { Update{EntityName}Dto } from './update-{moduleName}.dto';
```

### 4. Create service
Path: `apps/api/src/{moduleName}/{moduleName}.service.ts`

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Create{EntityName}Dto, Update{EntityName}Dto } from './dto';

@Injectable()
export class {EntityName}Service {
  private readonly logger = new Logger({EntityName}Service.name);

  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, skip = 0, take = 10) {
    this.logger.log(`Fetching all {moduleName} for org ${organizationId}`);

    const records = await this.prisma.{entityName}.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.{entityName}.count({
      where: {
        organizationId,
        deletedAt: null,
      },
    });

    return { data: records, meta: { total, skip, take } };
  }

  async findOne(organizationId: string, id: string) {
    this.logger.log(`Fetching {moduleName} ${id} for org ${organizationId}`);

    const record = await this.prisma.{entityName}.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!record) {
      this.logger.warn(`{EntityName} ${id} not found in org ${organizationId}`);
      throw new NotFoundException('{EntityName} not found');
    }

    return record;
  }

  async create(organizationId: string, dto: Create{EntityName}Dto) {
    this.logger.log(`Creating {moduleName} for org ${organizationId}`);

    const record = await this.prisma.{entityName}.create({
      data: {
        ...dto,
        organizationId,
      },
    });

    this.logger.log(`Created {moduleName} with id ${record.id}`);
    return record;
  }

  async update(
    organizationId: string,
    id: string,
    dto: Update{EntityName}Dto,
  ) {
    this.logger.log(`Updating {moduleName} ${id} for org ${organizationId}`);

    // Verify ownership
    await this.findOne(organizationId, id);

    const record = await this.prisma.{entityName}.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Updated {moduleName} ${id}`);
    return record;
  }

  async remove(organizationId: string, id: string) {
    this.logger.log(`Soft-deleting {moduleName} ${id} for org ${organizationId}`);

    // Verify ownership
    await this.findOne(organizationId, id);

    const record = await this.prisma.{entityName}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Soft-deleted {moduleName} ${id}`);
    return record;
  }
}
```

### 5. Create controller
Path: `apps/api/src/{moduleName}/{moduleName}.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { GetUser } from '@/auth/get-user.decorator';
import { UserPayload } from '@/auth/user-payload.interface';
import { {EntityName}Service } from './{moduleName}.service';
import { Create{EntityName}Dto, Update{EntityName}Dto } from './dto';

@ApiTags('{EntityName}')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/{moduleName}s')
export class {EntityName}Controller {
  constructor(private readonly service: {EntityName}Service) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create {EntityName}',
    description: 'יצירת {moduleName} חדש',
  })
  @ApiCreatedResponse({
    description: '{EntityName} created successfully',
  })
  async create(
    @Body() dto: Create{EntityName}Dto,
    @GetUser() user: UserPayload,
  ) {
    const record = await this.service.create(user.organizationId, dto);
    return { data: record };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all {EntityName}',
    description: 'קבלת רשימת כל {moduleName}',
  })
  @ApiOkResponse({
    description: 'List of {moduleName}',
  })
  async findAll(
    @GetUser() user: UserPayload,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ) {
    return await this.service.findAll(
      user.organizationId,
      skip || 0,
      take || 10,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get {EntityName} by ID',
    description: 'קבלת {moduleName} ספציפי',
  })
  @ApiOkResponse({
    description: '{EntityName} found',
  })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: UserPayload,
  ) {
    const record = await this.service.findOne(user.organizationId, id);
    return { data: record };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update {EntityName}',
    description: 'עדכון {moduleName}',
  })
  @ApiOkResponse({
    description: '{EntityName} updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: Update{EntityName}Dto,
    @GetUser() user: UserPayload,
  ) {
    const record = await this.service.update(user.organizationId, id, dto);
    return { data: record };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete {EntityName}',
    description: 'מחיקה של {moduleName}',
  })
  async remove(
    @Param('id') id: string,
    @GetUser() user: UserPayload,
  ) {
    await this.service.remove(user.organizationId, id);
  }
}
```

### 6. Create module file
Path: `apps/api/src/{moduleName}/{moduleName}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { {EntityName}Service } from './{moduleName}.service';
import { {EntityName}Controller } from './{moduleName}.controller';

@Module({
  controllers: [{EntityName}Controller],
  providers: [{EntityName}Service],
  exports: [{EntityName}Service],
})
export class {EntityName}Module {}
```

### 7. Create service spec tests
Path: `apps/api/src/{moduleName}/__tests__/{moduleName}.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, Logger } from '@nestjs/common';
import { {EntityName}Service } from '../{moduleName}.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('{EntityName}Service', () => {
  let service: {EntityName}Service;
  let prisma: PrismaService;

  const mockOrgId = 'org-test-123';

  const mockRecord = {
    id: 'id-123',
    organizationId: mockOrgId,
    name: 'Test {EntityName}',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {EntityName}Service,
        {
          provide: PrismaService,
          useValue: {
            {entityName}: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<{EntityName}Service>({EntityName}Service);
    prisma = module.get<PrismaService>(PrismaService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated records', async () => {
      jest
        .spyOn(prisma.{entityName}, 'findMany')
        .mockResolvedValue([mockRecord]);
      jest.spyOn(prisma.{entityName}, 'count').mockResolvedValue(1);

      const result = await service.findAll(mockOrgId, 0, 10);

      expect(result.data).toEqual([mockRecord]);
      expect(result.meta.total).toBe(1);
    });

    it('should scope query by organizationId', async () => {
      jest
        .spyOn(prisma.{entityName}, 'findMany')
        .mockResolvedValue([]);
      jest.spyOn(prisma.{entityName}, 'count').mockResolvedValue(0);

      await service.findAll(mockOrgId, 0, 10);

      expect(prisma.{entityName}.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrgId,
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return record when found', async () => {
      jest
        .spyOn(prisma.{entityName}, 'findFirst')
        .mockResolvedValue(mockRecord);

      const result = await service.findOne(mockOrgId, 'id-123');

      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException when not found', async () => {
      jest
        .spyOn(prisma.{entityName}, 'findFirst')
        .mockResolvedValue(null);

      await expect(service.findOne(mockOrgId, 'not-found')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should verify organizationId ownership', async () => {
      jest
        .spyOn(prisma.{entityName}, 'findFirst')
        .mockResolvedValue(mockRecord);

      await service.findOne(mockOrgId, 'id-123');

      expect(prisma.{entityName}.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrgId,
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create record with organizationId', async () => {
      const dto = { name: 'New {EntityName}' };
      jest
        .spyOn(prisma.{entityName}, 'create')
        .mockResolvedValue({ ...mockRecord, ...dto });

      const result = await service.create(mockOrgId, dto as any);

      expect(prisma.{entityName}.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          organizationId: mockOrgId,
        },
      });
      expect(result.organizationId).toBe(mockOrgId);
    });
  });

  describe('remove', () => {
    it('should soft-delete record', async () => {
      jest
        .spyOn(prisma.{entityName}, 'findFirst')
        .mockResolvedValue(mockRecord);
      jest
        .spyOn(prisma.{entityName}, 'update')
        .mockResolvedValue({
          ...mockRecord,
          deletedAt: new Date(),
        });

      await service.remove(mockOrgId, 'id-123');

      expect(prisma.{entityName}.update).toHaveBeenCalledWith({
        where: { id: 'id-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should never hard-delete', async () => {
      jest
        .spyOn(prisma.{entityName}, 'findFirst')
        .mockResolvedValue(mockRecord);
      jest
        .spyOn(prisma.{entityName}, 'update')
        .mockResolvedValue({
          ...mockRecord,
          deletedAt: new Date(),
        });

      await service.remove(mockOrgId, 'id-123');

      expect(prisma.{entityName}.delete).not.toHaveBeenCalled();
    });
  });
});
```

### 8. Create controller spec tests
Path: `apps/api/src/{moduleName}/__tests__/{moduleName}.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { {EntityName}Controller } from '../{moduleName}.controller';
import { {EntityName}Service } from '../{moduleName}.service';

describe('{EntityName}Controller', () => {
  let controller: {EntityName}Controller;
  let service: {EntityName}Service;

  const mockUser = { id: 'user-123', organizationId: 'org-123' };
  const mockRecord = {
    id: 'id-123',
    organizationId: mockUser.organizationId,
    name: 'Test',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [{EntityName}Controller],
      providers: [
        {
          provide: {EntityName}Service,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<{EntityName}Controller>({EntityName}Controller);
    service = module.get<{EntityName}Service>({EntityName}Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create with user organizationId', async () => {
      const dto = { name: 'New' };
      jest.spyOn(service, 'create').mockResolvedValue(mockRecord);

      const result = await controller.create(dto as any, mockUser as any);

      expect(service.create).toHaveBeenCalledWith(mockUser.organizationId, dto);
      expect(result.data).toEqual(mockRecord);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with pagination', async () => {
      jest
        .spyOn(service, 'findAll')
        .mockResolvedValue({ data: [mockRecord], meta: { total: 1, skip: 0, take: 10 } });

      const result = await controller.findAll(mockUser as any, 0, 10);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.organizationId, 0, 10);
      expect(result.data).toEqual([mockRecord]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRecord);

      const result = await controller.findOne('id-123', mockUser as any);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.organizationId, 'id-123');
      expect(result.data).toEqual(mockRecord);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove('id-123', mockUser as any);

      expect(service.remove).toHaveBeenCalledWith(mockUser.organizationId, 'id-123');
    });
  });
});
```

### 9. Register module in AppModule
Path: `apps/api/src/app.module.ts`

Add to imports array:
```typescript
import { {EntityName}Module } from './{moduleName}/{moduleName}.module';

@Module({
  imports: [
    // ... other modules
    {EntityName}Module,
  ],
})
export class AppModule {}
```

### 10. Validation checklist

Run:
```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm prisma generate
```

Verify:
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All tests pass with >= 70% coverage
- [ ] Prisma schema valid and migration created
- [ ] Every method has organizationId parameter
- [ ] All queries include `where: { organizationId, deletedAt: null }`
- [ ] DELETE uses soft delete (update with deletedAt)
- [ ] Never hard-delete (no prisma.*.delete)
- [ ] DTOs have @ApiProperty decorators
- [ ] Controller has @ApiOperation, @ApiTags, @ApiBearerAuth
- [ ] Service has logging on entry/exit
- [ ] All routes protected by JwtAuthGuard + RolesGuard
- [ ] Response envelope `{ data, meta? }` used
- [ ] NotFoundException thrown for missing/unauthorized records

## Success Criteria
- Module compiles without errors
- All tests pass with >= 70% coverage
- All API routes have Swagger documentation
- organizationId scoping verified on all queries
- Soft delete enforced everywhere
- All DTOs validated with class-validator
- Service layer fully tested in isolation
- Multi-tenant safety verified across all endpoints
