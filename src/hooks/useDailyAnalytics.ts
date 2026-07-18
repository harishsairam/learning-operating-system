import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getDailyAnalytics, type DailyAnalytics } from '../api/analytics';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';

export function useDailyAnalytics() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['analytics', 'daily'], user?.id), [user?.id]);

  return useQuery<DailyAnalytics, Error>({
    queryKey,
    queryFn: () => getDailyAnalytics(user!.id),
    enabled: !!user?.id,
  });
}
