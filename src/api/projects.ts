import { supabase } from '../lib/supabase';
import { ensureAuthenticated, withUserScope } from '../lib/auth';
import type { Project } from '../types';

export async function getProjects() {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export async function createProject(name: string) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('projects')
    .insert([withUserScope({ name }, user.id)])
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, name: string) {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('projects')
    .update(withUserScope({ name }, user.id))
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string) {
  const user = await ensureAuthenticated();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}
