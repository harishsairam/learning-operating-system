import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivities, createActivity } from '../api/activities';

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
