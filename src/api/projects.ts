import { supabase } from '../lib/supabase';
import { withUserScope } from '../lib/auth';
import type { Project } from '../types';

export async function getProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export async function createProject(userId: string, name: string) {
  const { data, error } = await supabase
    .from('projects')
    .insert([withUserScope({ name }, userId)])
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(userId: string, id: string, name: string) {
  const { data, error } = await supabase
    .from('projects')
    .update(withUserScope({ name }, userId))
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(userId: string, id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
