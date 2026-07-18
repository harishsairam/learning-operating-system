import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getDueRevisions, submitRevisionSession, getUpcomingRevisions, getRevisionStats } from '../api/revisions';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';

export function useRevisionStats() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['revision_stats'], user?.id), [user?.id]);

  return useQuery({
    queryKey,
    queryFn: () => getRevisionStats(user!.id),
    enabled: !!user?.id,
  });
}

export function useDueRevisions() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['revisions', 'due'], user?.id), [user?.id]);

  return useQuery({
    queryKey,
    queryFn: () => getDueRevisions(user!.id),
    enabled: !!user?.id,
  });
}

export function useUpcomingRevisions() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['revisions', 'upcoming'], user?.id), [user?.id]);

  return useQuery({
    queryKey,
    queryFn: () => getUpcomingRevisions(user!.id),
    enabled: !!user?.id,
  });
}

export function useSubmitRevisionSession() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const revisionsKey = useMemo(() => buildUserScopedQueryKey(['revisions'], user?.id), [user?.id]);
  const activitiesKey = useMemo(() => buildUserScopedQueryKey(['activities'], user?.id), [user?.id]);
  const dashboardKey = useMemo(() => buildUserScopedQueryKey(['dashboard'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({ knowledgeUnitId }: { knowledgeUnitId: string }) =>
      submitRevisionSession(user!.id, { knowledgeUnitId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revisionsKey });
      queryClient.invalidateQueries({ queryKey: activitiesKey });
      queryClient.invalidateQueries({ queryKey: dashboardKey });
    },
  });
}
