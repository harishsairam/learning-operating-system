import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTopics, createTopic, updateTopic, deleteTopic } from '../api/topics';
import type { Topic } from '../types';

export function useTopics() {
  return useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: getTopics,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}
