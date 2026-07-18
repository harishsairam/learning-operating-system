import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getDailyPlan, createDailyPlan, deleteDailyPlan, updateDailyPlan } from '../api/dailyPlans';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';
import type { DailyPlanInsert, DailyPlanWithRelations } from '../types';

const queryKey = (date: string, userId?: string | null) => buildUserScopedQueryKey(['dailyPlan', date], userId);

export function useDailyPlan(date: string) {
  const user = useAuthUser();
  const key = useMemo(() => queryKey(date, user?.id), [date, user?.id]);

  return useQuery<DailyPlanWithRelations[]>({
    queryKey: key,
    queryFn: () => getDailyPlan(user!.id, date),
    staleTime: 30 * 1000,
    enabled: !!user?.id,
  });
}

export function useCreateDailyPlan() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: (item: DailyPlanInsert) => createDailyPlan(user!.id, item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey(variables.date, user?.id) });
    },
  });
}

export function useUpdateDailyPlan() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DailyPlanInsert> }) =>
      updateDailyPlan(user!.id, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildUserScopedQueryKey(['dailyPlan'], user?.id) });
    },
  });
}

export function useDeleteDailyPlan() {
  const queryClient = useQueryClient();
  const user = useAuthUser();

  return useMutation({
    mutationFn: (id: string) => deleteDailyPlan(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildUserScopedQueryKey(['dailyPlan'], user?.id) });
    },
  });
}
