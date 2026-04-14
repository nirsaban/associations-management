# Write Tests

Create comprehensive unit tests for service, component, or utility functions.

## Input Parameters
- `targetFile` - Absolute path to file being tested (e.g., `apps/api/src/donor/donor.service.ts`)
- `testType` - "service", "component", or "utility"
- `minCoverage` - Minimum coverage target (default: 70)

## Steps

### 1. Examine target file
Read the entire file to understand:
- All exported functions/methods
- Parameters and return types
- Edge cases and error conditions
- Dependencies (what it imports)
- Hebrew text handling (if applicable)

### 2. Create test file location
```
For services: {service}.spec.ts in same directory or __tests__/
For components: {component}.spec.tsx in __tests__/
For utilities: {utility}.spec.ts in same directory
```

### 3. For NestJS Services (Vitest)

Template:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { {Service}Service } from '../{service}.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('{Service}Service', () => {
  let service: {Service}Service;
  let prisma: PrismaService;

  // Mock constants
  const mockOrgId = 'org-test-123';
  const mockUserId = 'user-test-123';

  const mockRecord = {
    id: 'record-123',
    organizationId: mockOrgId,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    // ... other fields
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {Service}Service,
        {
          provide: PrismaService,
          useValue: {
            {entity}: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            // Include other entities as needed
          },
        },
      ],
    }).compile();

    service = module.get<{Service}Service>({Service}Service);
    prisma = module.get<PrismaService>(PrismaService);

    // Suppress logs during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should return record when found', async () => {
      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(mockRecord);

      const result = await service.methodName(mockOrgId, 'record-123');

      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException when record not found', async () => {
      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(null);

      await expect(service.methodName(mockOrgId, 'not-found')).rejects.toThrow(
        'Record not found',
      );
    });

    it('should scope query by organizationId', async () => {
      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(mockRecord);

      await service.methodName(mockOrgId, 'record-123');

      expect(prisma.{entity}.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrgId,
          }),
        }),
      );
    });

    it('should exclude soft-deleted records', async () => {
      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(null);

      await expect(
        service.methodName(mockOrgId, 'record-123')
      ).rejects.toThrow();

      expect(prisma.{entity}.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('should never hard-delete records', async () => {
      // Verify prisma.*.delete is never called
      const deleteMethod = jest.spyOn(prisma.{entity}, 'delete');

      // Call delete method
      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(mockRecord);
      await service.deleteRecord(mockOrgId, 'record-123');

      expect(deleteMethod).not.toHaveBeenCalled();

      // Instead, update should be called with deletedAt
      expect(prisma.{entity}.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should handle Hebrew text correctly', async () => {
      const hebrewRecord = {
        ...mockRecord,
        name: 'דוגמה בעברית',
        description: 'תיאור בעברית',
      };

      jest
        .spyOn(prisma.{entity}, 'create')
        .mockResolvedValue(hebrewRecord);

      const result = await service.createRecord(mockOrgId, {
        name: 'דוגמה בעברית',
        description: 'תיאור בעברית',
      });

      expect(result.name).toBe('דוגמה בעברית');
      expect(result.description).toBe('תיאור בעברית');
    });

    it('should log method entry and exit', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(mockRecord);

      await service.methodName(mockOrgId, 'record-123');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('record-123'),
      );
    });

    it('should log errors with stack trace', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const testError = new Error('Database error');

      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockRejectedValue(testError);

      await expect(
        service.methodName(mockOrgId, 'record-123')
      ).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('createRecord', () => {
    it('should create record with all required fields', async () => {
      const createDto = {
        name: 'New Record',
        email: 'test@example.com',
      };

      jest
        .spyOn(prisma.{entity}, 'create')
        .mockResolvedValue({ ...mockRecord, ...createDto });

      const result = await service.createRecord(mockOrgId, createDto);

      expect(prisma.{entity}.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          organizationId: mockOrgId,
        },
      });
      expect(result.organizationId).toBe(mockOrgId);
    });

    it('should not allow cross-organization creation', async () => {
      const createDto = { name: 'Test', organizationId: 'other-org' };

      // The service should not accept organizationId in DTO
      // It should always use the passed parameter
      jest
        .spyOn(prisma.{entity}, 'create')
        .mockResolvedValue({ ...mockRecord, ...createDto });

      const result = await service.createRecord(mockOrgId, createDto);

      expect(result.organizationId).toBe(mockOrgId);
      expect(prisma.{entity}.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: mockOrgId, // Always the parameter, not the DTO
          }),
        }),
      );
    });
  });

  describe('updateRecord', () => {
    it('should update only provided fields', async () => {
      const updateDto = { name: 'Updated Name' };

      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(mockRecord);
      jest
        .spyOn(prisma.{entity}, 'update')
        .mockResolvedValue({ ...mockRecord, ...updateDto });

      const result = await service.updateRecord(
        mockOrgId,
        'record-123',
        updateDto,
      );

      expect(prisma.{entity}.update).toHaveBeenCalledWith({
        where: { id: 'record-123' },
        data: updateDto,
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should prevent cross-organization updates', async () => {
      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(mockRecord);

      await service.updateRecord(mockOrgId, 'record-123', {
        name: 'Updated',
      });

      // Verify the record was fetched with organizationId scope first
      expect(prisma.{entity}.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrgId,
          }),
        }),
      );
    });
  });

  describe('deleteRecord', () => {
    it('should soft-delete record', async () => {
      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(mockRecord);
      jest
        .spyOn(prisma.{entity}, 'update')
        .mockResolvedValue({
          ...mockRecord,
          deletedAt: new Date(),
        });

      await service.deleteRecord(mockOrgId, 'record-123');

      expect(prisma.{entity}.update).toHaveBeenCalledWith({
        where: { id: 'record-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should verify ownership before deleting', async () => {
      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(null); // Not found in org

      await expect(
        service.deleteRecord(mockOrgId, 'record-123')
      ).rejects.toThrow();

      expect(prisma.{entity}.update).not.toHaveBeenCalled();
    });

    it('should never hard-delete', async () => {
      const deleteSpy = jest.spyOn(prisma.{entity}, 'delete');

      jest
        .spyOn(prisma.{entity}, 'findFirst')
        .mockResolvedValue(mockRecord);
      jest
        .spyOn(prisma.{entity}, 'update')
        .mockResolvedValue({
          ...mockRecord,
          deletedAt: new Date(),
        });

      await service.deleteRecord(mockOrgId, 'record-123');

      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});
```

### 4. For React Components (Vitest + Testing Library)

Template:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {Component} } from '../{Component}';

describe('{Component}', () => {
  const mockProps = {
    title: 'דוגמה',
    onSubmit: vi.fn(),
    // ... other required props
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with provided title', () => {
      render(<{Component} {...mockProps} />);
      expect(screen.getByText('דוגמה')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <{Component} {...mockProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should have correct RTL direction', () => {
      const { container } = render(<{Component} {...mockProps} />);
      const element = container.querySelector('[direction="rtl"]');
      expect(element).toBeInTheDocument();
    });

    it('should render in both LTR and RTL', () => {
      const { container: rtlContainer } = render(
        <div dir="rtl">
          <{Component} {...mockProps} />
        </div>
      );
      expect(rtlContainer).toBeInTheDocument();

      const { container: ltrContainer } = render(
        <div dir="ltr">
          <{Component} {...mockProps} />
        </div>
      );
      expect(ltrContainer).toBeInTheDocument();
    });
  });

  describe('states', () => {
    it('should display loading state', () => {
      render(<{Component} {...mockProps} isLoading={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/טוען/i)).toBeInTheDocument();
    });

    it('should display empty state', () => {
      render(<{Component} {...mockProps} items={[]} />);
      expect(screen.getByText(/אין נתונים/i)).toBeInTheDocument();
    });

    it('should display error state with message', () => {
      const errorMsg = 'שגיאה בטעינה';
      render(<{Component} {...mockProps} error={errorMsg} />);
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    it('should render success state', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      render(<{Component} {...mockProps} items={items} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should handle button click', async () => {
      const user = userEvent.setup();
      render(<{Component} {...mockProps} />);

      const button = screen.getByRole('button', { name: /שמור/i });
      await user.click(button);

      expect(mockProps.onSubmit).toHaveBeenCalled();
    });

    it('should handle form submission', async () => {
      const user = userEvent.setup();
      render(<{Component} {...mockProps} />);

      const input = screen.getByLabelText(/שם/i);
      await user.type(input, 'תיאור בעברית');

      const form = screen.getByRole('form');
      await user.submit(form);

      expect(mockProps.onSubmit).toHaveBeenCalled();
    });

    it('should update on prop change', async () => {
      const { rerender } = render(
        <{Component} {...mockProps} count={0} />
      );
      expect(screen.getByText('0')).toBeInTheDocument();

      rerender(<{Component} {...mockProps} count={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Hebrew text handling', () => {
    it('should correctly display Hebrew characters', () => {
      const hebrewText = 'תורם חדש';
      render(
        <{Component}
          {...mockProps}
          title={hebrewText}
        />
      );
      expect(screen.getByText(hebrewText)).toBeInTheDocument();
    });

    it('should handle mixed Hebrew and Latin text', () => {
      const mixedText = 'תורם New Donor';
      render(<{Component} {...mockProps} description={mixedText} />);
      expect(screen.getByText(mixedText)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<{Component} {...mockProps} />);
      expect(screen.getByLabelText(/שם/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<{Component} {...mockProps} />);

      const button = screen.getByRole('button');
      await user.tab();
      expect(button).toHaveFocus();
    });

    it('should announce loading state', () => {
      render(<{Component} {...mockProps} isLoading={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
```

### 5. For Utility Functions (Vitest)

Template:
```typescript
import { describe, it, expect } from 'vitest';
import { formatDate, parseHebrewNumber, sanitizeInput } from '../utilities';

describe('formatDate', () => {
  it('should format date to DD/MM/YYYY', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('15/01/2024');
  });

  it('should handle edge case dates', () => {
    const date = new Date('2024-12-31');
    expect(formatDate(date)).toBe('31/12/2024');
  });

  it('should handle invalid date', () => {
    expect(() => formatDate(new Date('invalid'))).toThrow();
  });
});

describe('parseHebrewNumber', () => {
  it('should parse Hebrew written numbers', () => {
    expect(parseHebrewNumber('עשרים שלוש')).toBe(23);
  });

  it('should handle edge cases', () => {
    expect(parseHebrewNumber('אפס')).toBe(0);
    expect(parseHebrewNumber('מאה')).toBe(100);
  });

  it('should throw on invalid input', () => {
    expect(() => parseHebrewNumber('invalid')).toThrow();
  });
});

describe('sanitizeInput', () => {
  it('should remove HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    expect(sanitizeInput(input)).toBe('Hello');
  });

  it('should preserve Hebrew text', () => {
    const input = '<p>שלום עולם</p>';
    expect(sanitizeInput(input)).toBe('שלום עולם');
  });

  it('should handle null/undefined', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
  });

  it('should not log sensitive data', () => {
    // Verify sanitizeInput doesn't leak input to logs
    const consoleSpy = vi.spyOn(console, 'log');
    sanitizeInput('sensitive-password');
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
```

### 6. Check coverage

Run tests with coverage:
```bash
pnpm test --coverage
```

Check coverage report:
```bash
# Should show >= 70% for new/modified files
# Look for:
# - Line coverage
# - Branch coverage
# - Function coverage
# - Statement coverage
```

### 7. Validation checklist

```bash
pnpm typecheck
pnpm lint
pnpm test --run
```

Verify:
- [ ] All tests pass
- [ ] Coverage >= 70% (for service/component being tested)
- [ ] No `console.log` or `console.error` in test output
- [ ] No skipped tests (no `it.skip()` or `describe.skip()`)
- [ ] All edge cases covered
- [ ] organizationId scoping tested (for services)
- [ ] Soft delete verified (never hard delete)
- [ ] Hebrew text handling tested
- [ ] Loading, empty, error states tested (for components)
- [ ] Accessibility tested (for components)
- [ ] Error conditions tested with `expect().rejects.toThrow()`
- [ ] Mock Prisma methods reset in `afterEach()`

### 8. Run final checks

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run tests with coverage
pnpm test --run --coverage

# Check specific file coverage
pnpm test {targetFile} --run --coverage
```

## Success Criteria
- All tests pass
- Coverage >= 70% (minimum target)
- No console output in test logs
- organizationId scoping verified for data operations
- Soft delete enforced in delete tests
- Hebrew text handling validated
- Error conditions properly tested
- No skipped or pending tests
- All mock methods properly reset between tests
