import { supabase } from '../lib/supabase';
import { withUserScope } from '../lib/auth';
import type { KnowledgeUnit } from '../types';

export async function getKnowledgeUnitsByActivity(userId: string, activityId: string) {
  const { data, error } = await supabase
    .from('knowledge_units')
    .select(`
      *,
      topics (
        name,
        categories (
          name,
          projects (
            name
          )
        )
      )
    `)
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateKnowledgeUnit(
  userId: string,
  id: string,
  updates: Partial<Omit<KnowledgeUnit, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('knowledge_units')
    .update(withUserScope(updates as Record<string, unknown>, userId))
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
