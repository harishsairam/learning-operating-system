import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getTopics, createTopic, updateTopic, deleteTopic } from '../api/topics';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';
import type { Topic } from '../types';

export function useTopics() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['topics'], user?.id), [user?.id]);

  return useQuery<Topic[]>({
    queryKey,
    queryFn: () => getTopics(user!.id),
    enabled: !!user?.id,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['topics'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (topicData: Parameters<typeof createTopic>[1]) => createTopic(user!.id, topicData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['topics'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({ id, name, category_id }: { id: string; name: string; category_id: string }) =>
      updateTopic({ userId: user!.id, id, name, category_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['topics'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (id: string) => deleteTopic(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
