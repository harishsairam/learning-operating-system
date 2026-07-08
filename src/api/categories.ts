import { supabase } from '../lib/supabase';
import type { Category } from '../types';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      projects (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createCategory({ name, project_id }: { name: string; project_id: string }) {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, project_id }])
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory({ id, name, project_id }: { id: string; name: string; project_id: string }) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name, project_id })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
