import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';

export interface Family {
  id: string;
  name: string;
  groupId: string;
  contactName: string;
  contactPhone: string;
  address?: string;
  city?: string;
  zipCode?: string;
  childrenCount?: number;
  adultCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function useFamilies() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const response = await api.get<{ data: Family[] }>(
        API_ROUTES.FAMILIES.LIST
      );
      return response.data.data;
    },
  });

  const get = (id: string) =>
    useQuery({
      queryKey: ['family', id],
      queryFn: async () => {
        const response = await api.get<{ data: Family }>(
          API_ROUTES.FAMILIES.GET(id)
        );
        return response.data.data;
      },
      enabled: !!id,
    });

  const create = useMutation({
    mutationFn: async (family: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post<{ data: Family }>(
        API_ROUTES.FAMILIES.CREATE,
        family
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Family>;
    }) => {
      const response = await api.patch<{ data: Family }>(
        API_ROUTES.FAMILIES.UPDATE(id),
        data
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['family', data.id] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(API_ROUTES.FAMILIES.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
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
