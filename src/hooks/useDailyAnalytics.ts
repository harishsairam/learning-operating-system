import { useQuery } from '@tanstack/react-query';
import { getDailyAnalytics, type DailyAnalytics } from '../api/analytics';

export function useDailyAnalytics() {
  return useQuery<DailyAnalytics, Error>({
    queryKey: ['analytics', 'daily'],
    queryFn: getDailyAnalytics,
  });
}
