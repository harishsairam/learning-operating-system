import { supabase } from '../lib/supabase';
import { ensureAuthenticated, withUserScope } from '../lib/auth';
import type { DailyPlanInsert, DailyPlanWithRelations } from '../types';

export async function getDailyPlan(date: string) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('daily_plans')
    .select(`
      *,
      projects (name),
      categories (name),
      topics (name)
    `)
    .eq('date', date)
    .eq('user_id', user.id)
    .order('position', { ascending: true });

  if (error) throw error;
  return (data || []) as DailyPlanWithRelations[];
}

export async function createDailyPlan(item: DailyPlanInsert) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('daily_plans')
    .insert([withUserScope(item as Record<string, unknown>, user.id)])
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

export async function updateDailyPlan(id: string, updates: Partial<DailyPlanInsert>) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('daily_plans')
    .update(withUserScope(updates as Record<string, unknown>, user.id))
    .eq('id', id)
    .eq('user_id', user.id)
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
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('daily_plans')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
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
