import { supabase } from '../lib/supabase';
import type { DailyPlanInsert, DailyPlanWithRelations } from '../types';

export async function getDailyPlan(date: string) {
  const { data, error } = await supabase
    .from('daily_plans')
    .select(`
      *,
      projects (name),
      categories (name),
      topics (name)
    `)
    .eq('date', date)
    .order('position', { ascending: true });

  if (error) throw error;
  return (data || []) as DailyPlanWithRelations[];
}

export async function createDailyPlan(item: DailyPlanInsert) {
  const { data, error } = await supabase
    .from('daily_plans')
    .insert([item])
    .select(`
      *,
      projects (name),
      categories (name),
      topics (name)
    `)
    .single();

  if (error) throw error;
  return data as DailyPlanWithRelations;
}

export async function deleteDailyPlan(id: string) {
  const { data, error } = await supabase
    .from('daily_plans')
    .delete()
    .eq('id', id)
    .select(`
      *,
      projects (name),
      categories (name),
      topics (name)
    `)
    .single();

  if (error) throw error;
  return data as DailyPlanWithRelations;
}
