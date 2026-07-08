import { supabase } from '../lib/supabase';
import type { Topic } from '../types';

export async function getTopics() {
  const { data, error } = await supabase
    .from('topics')
    .select(`
      *,
      categories (
        name,
        projects (
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTopic({ name, category_id }: { name: string; category_id: string }) {
  const { data, error } = await supabase
    .from('topics')
    .insert([{ name, category_id }])
    .select()
    .single();

  if (error) throw error;
  return data as Topic;
}

export async function updateTopic({ id, name, category_id }: { id: string; name: string; category_id: string }) {
  const { data, error } = await supabase
    .from('topics')
    .update({ name, category_id })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Topic;
}

export async function deleteTopic(id: string) {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
