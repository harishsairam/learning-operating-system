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
    queryFn: getTopics,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['topics'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: createTopic,
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
    mutationFn: updateTopic,
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
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
