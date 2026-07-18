import { supabase } from '../lib/supabase';
import { withUserScope } from '../lib/auth';
import type { DailyPlanInsert, DailyPlanWithRelations } from '../types';

export async function getDailyPlan(userId: string, date: string) {
  const { data, error } = await supabase
    .from('daily_plans')
    .select(`
      *,
      projects (name),
      categories (name),
      topics (name)
    `)
    .eq('date', date)
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) throw error;
  return (data || []) as DailyPlanWithRelations[];
}

export async function createDailyPlan(userId: string, item: DailyPlanInsert) {
  const { data, error } = await supabase
    .from('daily_plans')
    .insert([withUserScope(item as Record<string, unknown>, userId)])
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

export async function updateDailyPlan(userId: string, id: string, updates: Partial<DailyPlanInsert>) {
  const { data, error } = await supabase
    .from('daily_plans')
    .update(withUserScope(updates as Record<string, unknown>, userId))
    .eq('id', id)
    .eq('user_id', userId)
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

export async function deleteDailyPlan(userId: string, id: string) {
  const { data, error } = await supabase
    .from('daily_plans')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
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
