'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types matching backend response shapes exactly ──────────────────────────

export type OrganizationStatus = 'ACTIVE' | 'INACTIVE';

/** Counts nested object returned per-org by GET /platform/organizations */
export type OrganizationCounts = {
  usersCount: number;
  groupsCount: number;
  familiesCount: number;
  unpaidThisMonthCount: number;
};

/** Single item in GET /platform/organizations list */
export type OrganizationListItem = {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  setupCompleted: boolean;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: string;
  counts: OrganizationCounts;
};

/** Admin entry inside GET /platform/organizations/:id */
export type AdminEntry = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  registrationCompleted: boolean;
};

/** Full detail from GET /platform/organizations/:id */
export type OrganizationDetail = OrganizationListItem & {
  address?: string;
  logoUrl?: string;
  settings?: Record<string, unknown>;
  updatedAt: string;
  admins: AdminEntry[];
};

/** GET /platform/overview response.data */
export type PlatformOverview = {
  totalOrganizations: number;
  activeOrganizations: number;
  inactiveOrganizations: number;
  totalUsers: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  totalGroups: number;
  totalFamilies: number;
  unpaidThisMonthAcrossPlatform: number;
  organizationsMissingWeeklyOrdersThisWeek: number;
  organizationsMissingWeeklyDistributorThisWeek: number;
};

// ── Request DTOs ────────────────────────────────────────────────────────────

type CreateOrganizationWithAdminRequest = {
  organization: {
    name: string;
    slug: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
  };
  firstAdmin: {
    fullName: string;
    phone: string;
  };
};

type GetOrganizationsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
};

// ── Hooks ───────────────────────────────────────────────────────────────────

/** GET /platform/overview — platform-wide aggregate stats */
export function useOverview() {
  return useQuery({
    queryKey: ['platform', 'overview'],
    queryFn: async () => {
      const response = await api.get<{ data: PlatformOverview }>('/platform/overview');
      return response.data.data;
    },
  });
}

/** GET /platform/organizations — list with counts */
export function useOrganizations(params: GetOrganizationsParams = {}) {
  return useQuery({
    queryKey: ['platform', 'organizations', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.status) searchParams.set('status', params.status);

      const response = await api.get<{
        data: OrganizationListItem[];
        meta: { total: number; page: number; limit: number };
      }>(`/platform/organizations?${searchParams.toString()}`);
      return response.data;
    },
  });
}

/** GET /platform/organizations/:id — full detail with admins + counts */
export function useOrganization(id: string) {
  return useQuery({
    queryKey: ['platform', 'organizations', id],
    queryFn: async () => {
      const response = await api.get<{ data: OrganizationDetail }>(
        `/platform/organizations/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

/** POST /platform/organizations — atomic org + first admin creation */
export function useCreateOrganizationWithAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizationWithAdminRequest) => {
      const response = await api.post<{
        data: {
          organization: OrganizationListItem;
          admin: { id: string; fullName: string; phone: string };
        };
      }>('/platform/organizations', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform'] });
    },
  });
}

/** PATCH /platform/organizations/:id/status — toggle ACTIVE/INACTIVE */
export function useToggleOrganizationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrganizationStatus }) => {
      const response = await api.patch<{ data: OrganizationListItem }>(
        `/platform/organizations/${id}/status`,
        { status },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform'] });
    },
  });
}

// ── Legacy backward-compat for /platform-secret pages ───────────────────────

type LegacyOrganization = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  setupCompleted: boolean;
  createdAt: string;
  firstAdmin?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
};

type LegacyCreateFirstAdminDto = {
  phone: string;
  fullName: string;
  email?: string;
};

export function usePlatform() {
  const createOrganization = useMutation({
    mutationFn: async (data: { name: string; slug: string; contactEmail?: string; contactPhone?: string }) => {
      const response = await api.post('/platform/organizations', data);
      return response.data;
    },
  });

  const createFirstAdmin = useMutation({
    mutationFn: async ({
      organizationId,
      ...data
    }: LegacyCreateFirstAdminDto & { organizationId: string }) => {
      const response = await api.post(
        `/platform/organizations/${organizationId}/first-admin`,
        data,
      );
      return response.data;
    },
  });

  const getOrganizations = (params: GetOrganizationsParams = {}) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery({
      queryKey: ['platform', 'organizations', 'legacy', params],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page.toString());
        if (params.limit) searchParams.set('limit', params.limit.toString());
        if (params.search) searchParams.set('search', params.search);
        if (params.status) searchParams.set('status', params.status);

        const response = await api.get<{ data: OrganizationListItem[] }>(
          `/platform/organizations?${searchParams.toString()}`,
        );
        const mapped: LegacyOrganization[] = response.data.data.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          isActive: org.status === 'ACTIVE',
          setupCompleted: org.setupCompleted,
          createdAt: org.createdAt,
        }));
        return { data: mapped };
      },
    });
  };

  const getOrganization = (id: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useOrganization(id);
  };

  const toggleOrganizationStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/platform/organizations/${id}/status`, {
        status: isActive ? 'ACTIVE' : 'INACTIVE',
      });
      return response.data;
    },
  });

  return {
    createOrganization,
    createFirstAdmin,
    getOrganizations,
    getOrganization,
    toggleOrganizationStatus,
  };
}
