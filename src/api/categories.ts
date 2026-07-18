import { supabase } from '../lib/supabase';
import { ensureAuthenticated, withUserScope } from '../lib/auth';
import type { Category } from '../types';

export async function getCategories() {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      projects (
        name
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createCategory({ name, project_id }: { name: string; project_id: string }) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('categories')
    .insert([withUserScope({ name, project_id }, user.id)])
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory({ id, name, project_id }: { id: string; name: string; project_id: string }) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('categories')
    .update(withUserScope({ name, project_id }, user.id))
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const user = await ensureAuthenticated();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}
