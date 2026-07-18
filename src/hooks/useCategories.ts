import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';
import type { Category } from '../types';

export function useCategories() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['categories'], user?.id), [user?.id]);

  return useQuery<Category[]>({
    queryKey,
    queryFn: () => getCategories(user!.id),
    enabled: !!user?.id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['categories'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (categoryData: Parameters<typeof createCategory>[1]) => createCategory(user!.id, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['categories'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({ id, name, project_id }: { id: string; name: string; project_id: string }) =>
      updateCategory({ userId: user!.id, id, name, project_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['categories'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (id: string) => deleteCategory(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
