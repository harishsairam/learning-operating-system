import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getKnowledgeUnitsByActivity, updateKnowledgeUnit } from '../api/knowledgeUnits';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';
import type { KnowledgeUnit } from '../types';

export function useActivityKnowledgeUnits(activityId: string) {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['knowledge_units', 'activity', activityId], user?.id), [activityId, user?.id]);

  return useQuery({
    queryKey,
    queryFn: () => getKnowledgeUnitsByActivity(user!.id, activityId),
    enabled: !!activityId && !!user?.id,
  });
}

export function useUpdateKnowledgeUnit() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const revisionsKey = useMemo(() => buildUserScopedQueryKey(['revisions'], user?.id), [user?.id]);
  const knowledgeUnitsKey = useMemo(() => buildUserScopedQueryKey(['knowledge_units'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Omit<KnowledgeUnit, 'id' | 'created_at' | 'updated_at'>> }) =>
      updateKnowledgeUnit(user!.id, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeUnitsKey });
      queryClient.invalidateQueries({ queryKey: revisionsKey });
    },
  });
}
