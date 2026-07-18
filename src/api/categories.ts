import { supabase } from '../lib/supabase';
import { withUserScope } from '../lib/auth';
import type { Category } from '../types';

export async function getCategories(userId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      projects (
        name
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createCategory(userId: string, { name, project_id }: { name: string; project_id: string }) {
  const { data, error } = await supabase
    .from('categories')
    .insert([withUserScope({ name, project_id }, userId)])
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory({
  userId,
  id,
  name,
  project_id,
}: {
  userId: string;
  id: string;
  name: string;
  project_id: string;
}) {
  const { data, error } = await supabase
    .from('categories')
    .update(withUserScope({ name, project_id }, userId))
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(userId: string, id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
