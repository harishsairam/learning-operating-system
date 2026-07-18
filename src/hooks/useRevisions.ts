import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDueRevisions, submitRevisionSession, getUpcomingRevisions, getRevisionStats } from '../api/revisions';

export function useRevisionStats() {
  return useQuery({
    queryKey: ['revision_stats'],
    queryFn: getRevisionStats,
  });
}

export function useDueRevisions() {
  return useQuery({
    queryKey: ['revisions', 'due'],
    queryFn: getDueRevisions,
  });
}

export function useUpcomingRevisions() {
  return useQuery({
    queryKey: ['revisions', 'upcoming'],
    queryFn: getUpcomingRevisions,
  });
}

export function useSubmitRevisionSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submitRevisionSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
