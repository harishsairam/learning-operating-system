import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivities, createActivity, updateActivity, deleteActivity } from '../api/activities';
import { useMemo } from 'react';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';

export function useActivities() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['activities'], user?.id), [user?.id]);

  return useQuery({
    queryKey,
    queryFn: () => getActivities(user!.id),
    enabled: !!user?.id,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['activities'], user?.id), [user?.id]);
  const dashboardKey = useMemo(() => buildUserScopedQueryKey(['dashboard'], user?.id), [user?.id]);
  const revisionsKey = useMemo(() => buildUserScopedQueryKey(['revisions'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (activityData: Parameters<typeof createActivity>[1]) => createActivity(user!.id, activityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: dashboardKey });
      queryClient.invalidateQueries({ queryKey: revisionsKey });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['activities'], user?.id), [user?.id]);
  const dashboardKey = useMemo(() => buildUserScopedQueryKey(['dashboard'], user?.id), [user?.id]);
  const revisionsKey = useMemo(() => buildUserScopedQueryKey(['revisions'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateActivity>[2] }) =>
      updateActivity(user!.id, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: dashboardKey });
      queryClient.invalidateQueries({ queryKey: revisionsKey });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['activities'], user?.id), [user?.id]);
  const dashboardKey = useMemo(() => buildUserScopedQueryKey(['dashboard'], user?.id), [user?.id]);
  const revisionsKey = useMemo(() => buildUserScopedQueryKey(['revisions'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteActivity(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: dashboardKey });
      queryClient.invalidateQueries({ queryKey: revisionsKey });
    },
  });
}
