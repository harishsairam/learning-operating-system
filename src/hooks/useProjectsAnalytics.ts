import { useQuery } from '@tanstack/react-query';
import { getProjectsAnalytics, type ProjectMetrics } from '../api/analytics';

export function useProjectsAnalytics() {
  return useQuery<ProjectMetrics[], Error>({
    queryKey: ['analytics', 'projects'],
    queryFn: getProjectsAnalytics,
  });
}
