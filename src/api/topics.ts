import { supabase } from '../lib/supabase';
import { ensureAuthenticated, withUserScope } from '../lib/auth';
import type { Topic } from '../types';

export async function getTopics() {
  const user = await ensureAuthenticated();
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
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTopic({ name, category_id }: { name: string; category_id: string }) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('topics')
    .insert([withUserScope({ name, category_id }, user.id)])
    .select()
    .single();

  if (error) throw error;
  return data as Topic;
}

export async function updateTopic({ id, name, category_id }: { id: string; name: string; category_id: string }) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('topics')
    .update(withUserScope({ name, category_id }, user.id))
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Topic;
}

export async function deleteTopic(id: string) {
  const user = await ensureAuthenticated();
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}
