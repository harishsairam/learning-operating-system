import { supabase } from '../lib/supabase';
import type { KnowledgeUnit } from '../types';

export async function getKnowledgeUnitsByActivity(activityId: string) {
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
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateKnowledgeUnit(
  id: string,
  updates: Partial<Omit<KnowledgeUnit, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('knowledge_units')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
