import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKnowledgeUnitsByActivity, updateKnowledgeUnit } from '../api/knowledgeUnits';
import type { KnowledgeUnit } from '../types';

export function useActivityKnowledgeUnits(activityId: string) {
  return useQuery({
    queryKey: ['knowledge_units', 'activity', activityId],
    queryFn: () => getKnowledgeUnitsByActivity(activityId),
    enabled: !!activityId,
  });
}

export function useUpdateKnowledgeUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Omit<KnowledgeUnit, 'id' | 'created_at' | 'updated_at'>> }) => 
      updateKnowledgeUnit(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_units'] });
      queryClient.invalidateQueries({ queryKey: ['revisions'] });
    },
  });
}
