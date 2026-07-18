import { supabase } from '../lib/supabase';
import { ensureAuthenticated, withUserScope } from '../lib/auth';
import type { KnowledgeUnit } from '../types';

export async function getKnowledgeUnitsByActivity(activityId: string) {
  const user = await ensureAuthenticated();
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
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateKnowledgeUnit(
  id: string,
  updates: Partial<Omit<KnowledgeUnit, 'id' | 'created_at' | 'updated_at'>>
) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('knowledge_units')
    .update(withUserScope(updates as Record<string, unknown>, user.id))
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
