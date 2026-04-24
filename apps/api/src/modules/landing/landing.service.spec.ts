import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { LandingService } from './landing.service';

function createMockPrisma() {
  return {
    landingPage: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    landingPageSection: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    landingLead: {
      create: vi.fn(),
    },
    asset: {
      create: vi.fn(),
    },
  };
}

describe('LandingService', () => {
  let service: LandingService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
    service = new LandingService(mockPrisma as any);
  });

  // ─── getOrCreate ──────────────────────────────────────────

  describe('getOrCreate', () => {
    it('should return existing landing page', async () => {
      const existing = { id: 'lp-1', organizationId: 'org-1', sections: [] };
      mockPrisma.landingPage.findUnique.mockResolvedValue(existing);

      const result = await service.getOrCreate('org-1');
      expect(result).toEqual(existing);
    });

    it('should create a new landing page if none exists', async () => {
      mockPrisma.landingPage.findUnique
        .mockResolvedValueOnce(null) // first call: no existing
        .mockResolvedValueOnce(null); // slug check
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-1', slug: 'my-org', name: 'My Org' });
      const created = { id: 'lp-new', organizationId: 'org-1', slug: 'my-org', sections: [] };
      mockPrisma.landingPage.create.mockResolvedValue(created);

      const result = await service.getOrCreate('org-1');
      expect(result).toEqual(created);
      expect(mockPrisma.landingPage.create).toHaveBeenCalled();
    });

    it('should throw if organization not found', async () => {
      mockPrisma.landingPage.findUnique.mockResolvedValue(null);
      mockPrisma.organization.findFirst.mockResolvedValue(null);

      await expect(service.getOrCreate('org-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────

  describe('update', () => {
    it('should reject reserved slugs', async () => {
      mockPrisma.landingPage.findUnique.mockResolvedValue({ id: 'lp-1', organizationId: 'org-1' });

      await expect(service.update('org-1', { slug: 'admin' })).rejects.toThrow(BadRequestException);
      await expect(service.update('org-1', { slug: 'api' })).rejects.toThrow(BadRequestException);
      await expect(service.update('org-1', { slug: 'login' })).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate slugs', async () => {
      mockPrisma.landingPage.findUnique
        .mockResolvedValueOnce({ id: 'lp-1', organizationId: 'org-1' }) // own page
        .mockResolvedValueOnce({ id: 'lp-other', organizationId: 'org-2' }); // slug conflict

      await expect(service.update('org-1', { slug: 'taken-slug' })).rejects.toThrow(ConflictException);
    });

    it('should allow same slug if it belongs to current page', async () => {
      const landing = { id: 'lp-1', organizationId: 'org-1' };
      mockPrisma.landingPage.findUnique
        .mockResolvedValueOnce(landing) // own page
        .mockResolvedValueOnce(landing); // slug check returns self

      mockPrisma.landingPage.update.mockResolvedValue({ ...landing, slug: 'same-slug' });

      await expect(service.update('org-1', { slug: 'same-slug' })).resolves.toBeDefined();
    });
  });

  // ─── sections reorder ─────────────────────────────────────

  describe('reorderSections', () => {
    it('should reject sections not belonging to this page', async () => {
      mockPrisma.landingPage.findUnique.mockResolvedValue({ id: 'lp-1' });
      mockPrisma.landingPageSection.findMany.mockResolvedValue([
        { id: 's-1', position: 0 },
        { id: 's-2', position: 1 },
      ]);

      await expect(
        service.reorderSections('org-1', { items: [{ id: 's-unknown', position: 0 }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate positions', async () => {
      mockPrisma.landingPage.findUnique.mockResolvedValue({ id: 'lp-1' });
      mockPrisma.landingPageSection.findMany.mockResolvedValue([
        { id: 's-1', position: 0 },
        { id: 's-2', position: 1 },
      ]);

      await expect(
        service.reorderSections('org-1', {
          items: [
            { id: 's-1', position: 0 },
            { id: 's-2', position: 0 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully reorder sections', async () => {
      mockPrisma.landingPage.findUnique.mockResolvedValue({ id: 'lp-1' });
      mockPrisma.landingPageSection.findMany.mockResolvedValue([
        { id: 's-1', position: 0 },
        { id: 's-2', position: 1 },
      ]);
      mockPrisma.landingPageSection.update.mockResolvedValue({});

      await service.reorderSections('org-1', {
        items: [
          { id: 's-2', position: 0 },
          { id: 's-1', position: 1 },
        ],
      });

      expect(mockPrisma.landingPageSection.update).toHaveBeenCalledTimes(2);
    });
  });

  // ─── reviews ──────────────────────────────────────────────

  describe('submitReview', () => {
    it('should silently reject honeypot submissions', async () => {
      const result = await service.submitReview('my-slug', {
        authorName: 'Bot',
        rating: 5,
        body: 'Spam',
        website: 'http://spam.com', // honeypot filled
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    it('should create pending review for legitimate submissions', async () => {
      mockPrisma.landingPage.findUnique.mockResolvedValue({
        organization: { id: 'org-1' },
      });
      mockPrisma.review.create.mockResolvedValue({ id: 'rev-1' });

      await service.submitReview('my-slug', {
        authorName: 'Sarah',
        rating: 5,
        body: 'Great organization!',
      });

      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            authorName: 'Sarah',
            rating: 5,
          }),
        }),
      );
    });
  });

  // ─── review moderation ────────────────────────────────────

  describe('moderateReview', () => {
    it('should approve a review', async () => {
      mockPrisma.review.findFirst.mockResolvedValue({ id: 'rev-1', organizationId: 'org-1' });
      mockPrisma.review.update.mockResolvedValue({ id: 'rev-1', status: 'APPROVED' });

      const result = await service.moderateReview('org-1', 'rev-1', { status: 'APPROVED' }, 'admin-1');

      expect(mockPrisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'APPROVED',
            approvedById: 'admin-1',
          }),
        }),
      );
    });

    it('should reject a review without setting approvedAt', async () => {
      mockPrisma.review.findFirst.mockResolvedValue({ id: 'rev-1', organizationId: 'org-1' });
      mockPrisma.review.update.mockResolvedValue({ id: 'rev-1', status: 'REJECTED' });

      await service.moderateReview('org-1', 'rev-1', { status: 'REJECTED' }, 'admin-1');

      expect(mockPrisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'REJECTED' },
        }),
      );
    });

    it('should throw if review not found or belongs to different org', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);

      await expect(
        service.moderateReview('org-1', 'rev-unknown', { status: 'APPROVED' }, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── public page ──────────────────────────────────────────

  describe('getPublicPage', () => {
    it('should throw if page not published', async () => {
      mockPrisma.landingPage.findUnique.mockResolvedValue({ published: false });

      await expect(service.getPublicPage('my-slug')).rejects.toThrow(NotFoundException);
    });

    it('should return published page', async () => {
      const page = { id: 'lp-1', published: true, sections: [], organization: {} };
      mockPrisma.landingPage.findUnique.mockResolvedValue(page);

      const result = await service.getPublicPage('my-slug');
      expect(result).toEqual(page);
    });
  });

  // ─── sanitization ─────────────────────────────────────────

  describe('sanitization', () => {
    it('should strip script tags from section data', async () => {
      mockPrisma.landingPage.findUnique.mockResolvedValue({ id: 'lp-1' });
      mockPrisma.landingPageSection.findFirst.mockResolvedValue(null);
      mockPrisma.landingPageSection.create.mockImplementation(({ data }) => Promise.resolve(data));

      await service.addSection('org-1', {
        type: 'about',
        data: {
          body_rich_text: '<p>Hello</p><script>alert("xss")</script><p>World</p>',
        },
      });

      const createCall = mockPrisma.landingPageSection.create.mock.calls[0][0];
      const savedData = createCall.data.data as Record<string, string>;
      expect(savedData.body_rich_text).not.toContain('<script>');
      expect(savedData.body_rich_text).toContain('<p>Hello</p>');
    });

    it('should reject non-allowed video URLs', async () => {
      mockPrisma.landingPage.findUnique.mockResolvedValue({ id: 'lp-1' });
      mockPrisma.landingPageSection.findFirst.mockResolvedValue(null);

      await expect(
        service.addSection('org-1', {
          type: 'video',
          data: {
            source: 'youtube',
            url_or_asset_id: 'https://evil.com/malware.js',
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
