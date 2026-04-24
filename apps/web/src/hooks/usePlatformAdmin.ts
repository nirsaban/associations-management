'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const BASE = '/platform/admin';

// ── Types ────────────────────────────────────────────────────────────────────

export type FieldMeta = {
  name: string;
  type: string;
  kind: 'scalar' | 'enum' | 'object';
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  isReadOnly: boolean;
  hasDefaultValue: boolean;
  isTextarea: boolean;
  enumValues?: string[];
  relationModel?: string;
  relationFromField?: string;
  displayField?: string;
};

export type ModelMeta = {
  name: string;
  label: string;
  isTenantScoped: boolean;
  hasSoftDelete: boolean;
  fields: FieldMeta[];
};

export type ModelSummary = {
  name: string;
  label: string;
  isTenantScoped: boolean;
  hasSoftDelete: boolean;
  fieldCount: number;
  recordCount: number;
};

type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
};

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useAdminModels() {
  return useQuery({
    queryKey: ['platform-admin', 'schema'],
    queryFn: async () => {
      const res = await api.get<{ data: ModelSummary[] }>(`${BASE}/schema`);
      return res.data.data;
    },
  });
}

export function useAdminSchema(model: string) {
  return useQuery({
    queryKey: ['platform-admin', 'schema', model],
    queryFn: async () => {
      const res = await api.get<{ data: ModelMeta }>(`${BASE}/schema/${model}`);
      return res.data.data;
    },
    enabled: !!model,
  });
}

export function useAdminRecords(model: string, params: ListParams = {}) {
  return useQuery({
    queryKey: ['platform-admin', model, params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', params.page.toString());
      if (params.limit) sp.set('limit', params.limit.toString());
      if (params.search) sp.set('search', params.search);
      if (params.organizationId) sp.set('organizationId', params.organizationId);
      if (params.orderBy) sp.set('orderBy', params.orderBy);
      if (params.orderDir) sp.set('orderDir', params.orderDir);
      const res = await api.get<{
        data: Record<string, unknown>[];
        meta: { total: number; page: number; limit: number };
      }>(`${BASE}/${model}?${sp.toString()}`);
      return res.data;
    },
    enabled: !!model,
  });
}

export function useAdminRecord(model: string, id: string) {
  return useQuery({
    queryKey: ['platform-admin', model, id],
    queryFn: async () => {
      const res = await api.get<{ data: Record<string, unknown> }>(
        `${BASE}/${model}/${id}`,
      );
      return res.data.data;
    },
    enabled: !!model && !!id,
  });
}

export function useAdminCreate(model: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post<{ data: unknown }>(`${BASE}/${model}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', model] });
      qc.invalidateQueries({ queryKey: ['platform-admin', 'schema'] });
    },
  });
}

export function useAdminUpdate(model: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await api.patch<{ data: unknown }>(`${BASE}/${model}/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', model] });
    },
  });
}

export function useAdminDelete(model: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${BASE}/${model}/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-admin', model] });
      qc.invalidateQueries({ queryKey: ['platform-admin', 'schema'] });
    },
  });
}
