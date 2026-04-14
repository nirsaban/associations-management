'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type Association = {
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

type CreateAssociationDto = {
  name: string;
  slug: string;
  contactEmail?: string;
  contactPhone?: string;
};

type CreateFirstAdminDto = {
  associationId: string;
  phone: string;
  fullName: string;
  email?: string;
};

type ToggleStatusDto = {
  id: string;
  isActive: boolean;
};

type GetAssociationsParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
};

export function usePlatform() {
  // Create association
  const createAssociation = useMutation({
    mutationFn: async (data: CreateAssociationDto) => {
      const response = await api.post('/platform/associations', data);
      return response.data;
    },
  });

  // Create first admin
  const createFirstAdmin = useMutation({
    mutationFn: async ({ associationId, ...data }: CreateFirstAdminDto) => {
      const response = await api.post(
        `/platform/associations/${associationId}/first-admin`,
        data
      );
      return response.data;
    },
  });

  // Get all associations
  const getAssociations = (params: GetAssociationsParams = {}) => {
    return useQuery({
      queryKey: ['platform', 'associations', params],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page.toString());
        if (params.limit) searchParams.set('limit', params.limit.toString());
        if (params.search) searchParams.set('search', params.search);
        if (params.status) searchParams.set('status', params.status);

        const response = await api.get<{ data: Association[] }>(
          `/platform/associations?${searchParams.toString()}`
        );
        return response.data;
      },
    });
  };

  // Get single association
  const getAssociation = (id: string) => {
    return useQuery({
      queryKey: ['platform', 'associations', id],
      queryFn: async () => {
        const response = await api.get(`/platform/associations/${id}`);
        return response.data;
      },
      enabled: !!id,
    });
  };

  // Toggle association status
  const toggleAssociationStatus = useMutation({
    mutationFn: async ({ id, isActive }: ToggleStatusDto) => {
      const response = await api.patch(`/platform/associations/${id}/status`, {
        isActive,
      });
      return response.data;
    },
  });

  return {
    createAssociation,
    createFirstAdmin,
    getAssociations,
    getAssociation,
    toggleAssociationStatus,
  };
}
