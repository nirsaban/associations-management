import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizationService } from './organization.service';

function createMockPrisma() {
  return {
    organization: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
  };
}

describe('OrganizationService - Profile', () => {
  let service: OrganizationService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const mockOrg = {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    contactEmail: 'test@test.com',
    contactPhone: '050123',
    address: 'Address',
    logoUrl: null,
    logoAssetId: null,
    legalName: null,
    taxId: null,
    addressLine2: null,
    city: null,
    postalCode: null,
    country: 'IL',
    primaryColor: '#2563eb',
    accentColor: '#f59e0b',
    aboutShort: null,
    aboutLong: null,
    description: null,
    paymentLink: null,
    defaultPaymentLink: null,
    paymentDescription: null,
    facebookUrl: null,
    instagramUrl: null,
    whatsappUrl: null,
    websiteUrl: null,
    status: 'ACTIVE',
    setupCompleted: true,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
    service = new OrganizationService(mockPrisma as any);
  });

  describe('getMyOrganization', () => {
    it('should return organization', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(mockOrg);

      const result = await service.getMyOrganization('user-1', 'org-1');
      expect(result.id).toBe('org-1');
      expect(result.name).toBe('Test Org');
      expect(result.primaryColor).toBe('#2563eb');
      expect(result.country).toBe('IL');
    });

    it('should throw if org not found', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null);

      await expect(service.getMyOrganization('user-1', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should reject non-admin users', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-1', 'org-1', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update profile for admin', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', systemRole: 'ADMIN' });
      mockPrisma.organization.update.mockResolvedValue({ ...mockOrg, name: 'Updated Name' });

      const result = await service.updateProfile('user-1', 'org-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('should sanitize rich text in aboutLong', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', systemRole: 'ADMIN' });
      mockPrisma.organization.update.mockImplementation(({ data }) => {
        return Promise.resolve({ ...mockOrg, ...data });
      });

      await service.updateProfile('user-1', 'org-1', {
        aboutLong: '<p>Hello</p><script>evil()</script>',
      });

      const updateCall = mockPrisma.organization.update.mock.calls[0][0];
      expect(updateCall.data.aboutLong).not.toContain('<script>');
      expect(updateCall.data.aboutLong).toContain('<p>Hello</p>');
    });
  });

  describe('uploadLogo', () => {
    it('should reject non-admin users', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadLogo('user-1', 'org-1', 'http://logo.png'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update logo URL', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', systemRole: 'ADMIN' });
      mockPrisma.organization.update.mockResolvedValue({ ...mockOrg, logoUrl: 'http://new-logo.png' });

      const result = await service.uploadLogo('user-1', 'org-1', 'http://new-logo.png');
      expect(result.logoUrl).toBe('http://new-logo.png');
    });
  });

  describe('removeLogo', () => {
    it('should clear logo URL and asset ID', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', systemRole: 'ADMIN' });
      mockPrisma.organization.update.mockResolvedValue({ ...mockOrg, logoUrl: null, logoAssetId: null });

      const result = await service.removeLogo('user-1', 'org-1');
      expect(result.logoUrl).toBeUndefined();
    });
  });

  describe('cross-tenant isolation', () => {
    it('admin of org A cannot access org B profile', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null); // Not admin of org-B

      await expect(
        service.updateProfile('user-from-org-a', 'org-b', { name: 'Hijacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin of org A cannot upload logo to org B', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadLogo('user-from-org-a', 'org-b', 'http://evil-logo.png'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin of org A cannot remove logo from org B', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.removeLogo('user-from-org-a', 'org-b'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
