import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PlatformService } from './platform.service';

function createMockPrisma() {
  return {
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    group: {
      count: vi.fn(),
    },
    family: {
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

describe('PlatformService', () => {
  let service: PlatformService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
    // Direct instantiation to bypass NestJS module resolution issues in vitest
    service = new PlatformService(mockPrisma as any);
  });

  describe('createOrganizationWithAdmin', () => {
    const dto = {
      organization: {
        name: 'עמותת צדקה',
        slug: 'tzedaka-org',
        contactPhone: '025812345',
      },
      firstAdmin: {
        fullName: 'דוד כהן',
        phone: '0501234567',
      },
    };

    it('should create organization and admin in a transaction', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const mockOrg = {
        id: 'org-1',
        name: 'עמותת צדקה',
        slug: 'tzedaka-org',
        contactPhone: '025812345',
        contactEmail: null,
        address: null,
        logoUrl: null,
        status: 'ACTIVE',
        setupCompleted: false,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockAdmin = {
        id: 'user-1',
        fullName: 'דוד כהן',
        phone: '0501234567',
      };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const txMock = {
          organization: { create: vi.fn().mockResolvedValue(mockOrg) },
          user: { create: vi.fn().mockResolvedValue(mockAdmin) },
        };
        return cb(txMock);
      });

      const result = await service.createOrganizationWithAdmin(dto, 'super-admin-id');

      expect(result.organization.id).toBe('org-1');
      expect(result.organization.name).toBe('עמותת צדקה');
      expect(result.admin.id).toBe('user-1');
      expect(result.admin.fullName).toBe('דוד כהן');
      expect(result.admin.phone).toBe('0501234567');
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createOrganizationWithAdmin(dto, 'super-admin-id'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if phone already exists', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.createOrganizationWithAdmin(dto, 'super-admin-id'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllWithCounts', () => {
    it('should return organizations with counts', async () => {
      const mockOrgs = [
        {
          id: 'org-1',
          name: 'עמותה 1',
          slug: 'org-1',
          status: 'ACTIVE',
          setupCompleted: true,
          contactPhone: '025812345',
          contactEmail: null,
          createdAt: new Date(),
          _count: { users: 10, groups: 2, families: 5 },
        },
      ];

      mockPrisma.organization.findMany.mockResolvedValue(mockOrgs);
      mockPrisma.organization.count.mockResolvedValue(1);
      mockPrisma.user.groupBy.mockResolvedValue([
        { organizationId: 'org-1', _count: 3 },
      ]);

      const result = await service.findAllWithCounts(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].counts.usersCount).toBe(10);
      expect(result.data[0].counts.groupsCount).toBe(2);
      expect(result.data[0].counts.familiesCount).toBe(5);
      expect(result.data[0].counts.unpaidThisMonthCount).toBe(3);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([]);
      mockPrisma.organization.count.mockResolvedValue(0);
      mockPrisma.user.groupBy.mockResolvedValue([]);

      await service.findAllWithCounts(1, 10, undefined, 'active');

      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should filter by search term', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([]);
      mockPrisma.organization.count.mockResolvedValue(0);
      mockPrisma.user.groupBy.mockResolvedValue([]);

      await service.findAllWithCounts(1, 10, 'צדקה');

      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'צדקה', mode: 'insensitive' } },
              { slug: { contains: 'צדקה', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('findOneWithDetails', () => {
    it('should return organization with admins and counts', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'עמותה 1',
        slug: 'org-1',
        status: 'ACTIVE',
        setupCompleted: true,
        contactPhone: '025812345',
        contactEmail: 'test@test.com',
        address: 'כתובת',
        logoUrl: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        users: [
          {
            id: 'admin-1',
            fullName: 'מנהל 1',
            phone: '0501234567',
            email: 'admin@test.com',
            registrationCompleted: true,
          },
        ],
        _count: { users: 10, groups: 2, families: 5 },
      };

      mockPrisma.organization.findFirst.mockResolvedValue(mockOrg);
      mockPrisma.user.groupBy.mockResolvedValue([
        { organizationId: 'org-1', _count: 4 },
      ]);

      const result = await service.findOneWithDetails('org-1');

      expect(result.id).toBe('org-1');
      expect(result.admins).toHaveLength(1);
      expect(result.admins![0].fullName).toBe('מנהל 1');
      expect(result.counts.usersCount).toBe(10);
      expect(result.counts.unpaidThisMonthCount).toBe(4);
    });

    it('should throw NotFoundException for missing org', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null);

      await expect(service.findOneWithDetails('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleStatus', () => {
    it('should toggle organization status', async () => {
      const mockOrg = { id: 'org-1', status: 'ACTIVE' };
      const updatedOrg = {
        id: 'org-1',
        name: 'עמותה',
        slug: 'org-1',
        status: 'INACTIVE',
        setupCompleted: true,
        contactEmail: null,
        contactPhone: null,
        address: null,
        logoUrl: null,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization.findFirst.mockResolvedValue(mockOrg);
      mockPrisma.organization.update.mockResolvedValue(updatedOrg);

      const result = await service.toggleStatus('org-1', 'INACTIVE');

      expect(result.status).toBe('INACTIVE');
      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { status: 'INACTIVE' },
      });
    });

    it('should throw NotFoundException for missing org', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null);

      await expect(service.toggleStatus('nonexistent', 'ACTIVE')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOverview', () => {
    it('should return platform-wide overview numbers', async () => {
      mockPrisma.organization.count
        .mockResolvedValueOnce(5)  // total
        .mockResolvedValueOnce(4)  // active
        .mockResolvedValueOnce(1); // inactive

      mockPrisma.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(5)   // totalAdmins
        .mockResolvedValueOnce(1)   // totalSuperAdmins
        .mockResolvedValueOnce(30); // unpaidThisMonth

      mockPrisma.group.count.mockResolvedValue(15);
      mockPrisma.family.count.mockResolvedValue(50);

      mockPrisma.organization.findMany
        .mockResolvedValueOnce([{ id: 'org-1' }, { id: 'org-2' }])  // missing orders
        .mockResolvedValueOnce([{ id: 'org-3' }]);                   // missing distributor

      const result = await service.getOverview();

      expect(result.totalOrganizations).toBe(5);
      expect(result.activeOrganizations).toBe(4);
      expect(result.inactiveOrganizations).toBe(1);
      expect(result.totalUsers).toBe(100);
      expect(result.totalAdmins).toBe(5);
      expect(result.totalSuperAdmins).toBe(1);
      expect(result.totalGroups).toBe(15);
      expect(result.totalFamilies).toBe(50);
      expect(result.unpaidThisMonthAcrossPlatform).toBe(30);
      expect(result.organizationsMissingWeeklyOrdersThisWeek).toBe(2);
      expect(result.organizationsMissingWeeklyDistributorThisWeek).toBe(1);
    });
  });
});
