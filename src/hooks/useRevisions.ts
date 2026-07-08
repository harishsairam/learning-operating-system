import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodayRevisions, completeRevision, getUpcomingRevisions, skipRevision, rescheduleRevision, getTodayCompletedRevisions } from '../api/revisions';

export function useTodayRevisions() {
  return useQuery({
    queryKey: ['revisions', 'today'],
    queryFn: getTodayRevisions,
  });
}

export function useUpcomingRevisions() {
  return useQuery({
    queryKey: ['revisions', 'upcoming'],
    queryFn: getUpcomingRevisions,
  });
}

export function useTodayCompletedRevisions() {
  return useQuery({
    queryKey: ['revisions', 'completed', 'today'],
    queryFn: getTodayCompletedRevisions,
  });
}

export function useCompleteRevision() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: completeRevision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSkipRevision() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: skipRevision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRescheduleRevision() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rescheduleRevision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
