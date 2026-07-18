import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getProjectsAnalytics, type ProjectMetrics } from '../api/analytics';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';

export function useProjectsAnalytics() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['analytics', 'projects'], user?.id), [user?.id]);

  return useQuery<ProjectMetrics[], Error>({
    queryKey,
    queryFn: () => getProjectsAnalytics(user!.id),
    enabled: !!user?.id,
  });
}
