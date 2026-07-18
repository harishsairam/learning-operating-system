import { supabase } from '../lib/supabase';
import { withUserScope } from '../lib/auth';
import type { Topic } from '../types';

export async function getTopics(userId: string) {
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
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTopic(userId: string, { name, category_id }: { name: string; category_id: string }) {
  const { data, error } = await supabase
    .from('topics')
    .insert([withUserScope({ name, category_id }, userId)])
    .select()
    .single();

  if (error) throw error;
  return data as Topic;
}

export async function updateTopic({
  userId,
  id,
  name,
  category_id,
}: {
  userId: string;
  id: string;
  name: string;
  category_id: string;
}) {
  const { data, error } = await supabase
    .from('topics')
    .update(withUserScope({ name, category_id }, userId))
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Topic;
}

export async function deleteTopic(userId: string, id: string) {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
