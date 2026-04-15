'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type Organization = {
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

type CreateOrganizationDto = {
  name: string;
  slug: string;
  contactEmail?: string;
  contactPhone?: string;
};

type CreateFirstAdminDto = {
  organizationId: string;
  phone: string;
  fullName: string;
  email?: string;
};

type ToggleStatusDto = {
  id: string;
  isActive: boolean;
};

type GetOrganizationsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
};

export function usePlatform() {
  // Create organization
  const createOrganization = useMutation({
    mutationFn: async (data: CreateOrganizationDto) => {
      const response = await api.post('/platform/organizations', data);
      return response.data;
    },
  });

  // Create first admin
  const createFirstAdmin = useMutation({
    mutationFn: async ({ organizationId, ...data }: CreateFirstAdminDto) => {
      const response = await api.post(
        `/platform/organizations/${organizationId}/first-admin`,
        data
      );
      return response.data;
    },
  });

  // Get all organizations
  const getOrganizations = (params: GetOrganizationsParams = {}) => {
    return useQuery({
      queryKey: ['platform', 'organizations', params],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page.toString());
        if (params.limit) searchParams.set('limit', params.limit.toString());
        if (params.search) searchParams.set('search', params.search);
        if (params.status) searchParams.set('status', params.status);

        const response = await api.get<{ data: Organization[] }>(
          `/platform/organizations?${searchParams.toString()}`
        );
        return response.data;
      },
    });
  };

  // Get single organization
  const getOrganization = (id: string) => {
    return useQuery({
      queryKey: ['platform', 'organizations', id],
      queryFn: async () => {
        const response = await api.get(`/platform/organizations/${id}`);
        return response.data;
      },
      enabled: !!id,
    });
  };

  // Toggle organization status
  const toggleOrganizationStatus = useMutation({
    mutationFn: async ({ id, isActive }: ToggleStatusDto) => {
      const response = await api.patch(`/platform/organizations/${id}/status`, {
        isActive,
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
