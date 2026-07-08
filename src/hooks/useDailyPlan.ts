import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDailyPlan, createDailyPlan, deleteDailyPlan } from '../api/dailyPlans';
import type { DailyPlanInsert, DailyPlanWithRelations } from '../types';

const queryKey = (date: string) => ['dailyPlan', date] as const;

export function useDailyPlan(date: string) {
  return useQuery<DailyPlanWithRelations[]>({
    queryKey: queryKey(date),
    queryFn: () => getDailyPlan(date),
    staleTime: 30 * 1000,
  });
}

export function useCreateDailyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: DailyPlanInsert) => createDailyPlan(item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey(variables.date) });
    },
  });
}

export function useDeleteDailyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDailyPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyPlan'] });
    },
  });
}
