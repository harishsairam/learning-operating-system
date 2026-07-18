import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivities, createActivity, updateActivity, deleteActivity } from '../api/activities';

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: getActivities,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Parameters<typeof updateActivity>[1] }) => 
      updateActivity(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, mode }: { id: string, mode: number }) => deleteActivity(id, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
    },
  });
}
