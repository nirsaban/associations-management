import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';

export interface GroupMember {
  id: string;
  name: string;
  phone: string;
  role: 'manager' | 'member' | 'distributor';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  managerIds: string[];
  memberCount: number;
  familiesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}

export function useGroups() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get<{ data: Group[]; meta: { total: number; page: number; limit: number } }>(API_ROUTES.GROUPS.LIST);
      return response.data.data;
    },
  });

  const get = (id: string) =>
    useQuery({
      queryKey: ['group', id],
      queryFn: async () => {
        const response = await api.get<{ data: GroupDetail }>(API_ROUTES.GROUPS.GET(id));
        return response.data.data;
      },
      enabled: !!id,
    });

  const create = useMutation({
    mutationFn: async (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post<{ data: Group }>(API_ROUTES.GROUPS.CREATE, group);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Group> }) => {
      const response = await api.patch<{ data: Group }>(API_ROUTES.GROUPS.UPDATE(id), data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', data.id] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(API_ROUTES.GROUPS.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  return {
    list,
    get,
    create,
    update,
    delete: remove,
  };
}
