import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

function createMockService() {
  return {
    createOrganizationWithAdmin: vi.fn(),
    findAllWithCounts: vi.fn(),
    findOneWithDetails: vi.fn(),
    toggleStatus: vi.fn(),
    getOverview: vi.fn(),
    createFirstAdmin: vi.fn(),
    updateOrganization: vi.fn(),
  };
}

describe('PlatformController', () => {
  let controller: PlatformController;
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = createMockService();
    controller = new PlatformController(mockService as unknown as PlatformService);
  });

  describe('POST /platform/organizations', () => {
    it('should create organization with admin and wrap in { data }', async () => {
      const dto = {
        organization: { name: 'עמותת צדקה', slug: 'tzedaka' },
        firstAdmin: { fullName: 'דוד כהן', phone: '0501234567' },
      };
      const mockResult = {
        organization: { id: 'org-1', name: 'עמותת צדקה', slug: 'tzedaka', status: 'ACTIVE' },
        admin: { id: 'user-1', fullName: 'דוד כהן', phone: '0501234567' },
      };

      mockService.createOrganizationWithAdmin.mockResolvedValue(mockResult);

      const result = await controller.createOrganizationWithAdmin(dto, { sub: 'super-admin-id' });

      expect(result.data.organization.id).toBe('org-1');
      expect(result.data.admin.id).toBe('user-1');
      expect(mockService.createOrganizationWithAdmin).toHaveBeenCalledWith(dto, 'super-admin-id');
    });
  });

  describe('GET /platform/overview', () => {
    it('should return platform overview wrapped in { data }', async () => {
      const mockOverview = {
        totalOrganizations: 5,
        activeOrganizations: 4,
        inactiveOrganizations: 1,
        totalUsers: 100,
        totalAdmins: 5,
        totalSuperAdmins: 1,
        totalGroups: 15,
        totalFamilies: 50,
        unpaidThisMonthAcrossPlatform: 30,
        organizationsMissingWeeklyOrdersThisWeek: 2,
        organizationsMissingWeeklyDistributorThisWeek: 1,
      };

      mockService.getOverview.mockResolvedValue(mockOverview);

      const result = await controller.getOverview();

      expect(result.data).toEqual(mockOverview);
    });
  });

  describe('GET /platform/organizations', () => {
    it('should return list with counts', async () => {
      const mockResponse = {
        data: [{ id: 'org-1', name: 'עמותה', counts: { usersCount: 5 } }],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockService.findAllWithCounts.mockResolvedValue(mockResponse);

      const result = await controller.findAll(1, 10, undefined, 'all');

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('GET /platform/organizations/:id', () => {
    it('should return detailed organization with admins', async () => {
      const mockDetail = {
        id: 'org-1',
        name: 'עמותה',
        admins: [{ id: 'admin-1', fullName: 'מנהל' }],
        counts: { usersCount: 10, groupsCount: 2, familiesCount: 5, unpaidThisMonthCount: 3 },
      };

      mockService.findOneWithDetails.mockResolvedValue(mockDetail);

      const result = await controller.findOne('org-1');

      expect(result.data.id).toBe('org-1');
      expect(result.data.admins).toHaveLength(1);
    });
  });

  describe('PATCH /platform/organizations/:id/status', () => {
    it('should toggle status and return updated org', async () => {
      const mockUpdated = { id: 'org-1', status: 'INACTIVE' };

      mockService.toggleStatus.mockResolvedValue(mockUpdated);

      const result = await controller.toggleStatus('org-1', { status: 'INACTIVE' as any });

      expect(result.data.status).toBe('INACTIVE');
      expect(mockService.toggleStatus).toHaveBeenCalledWith('org-1', 'INACTIVE');
    });
  });
});
