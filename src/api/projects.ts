import { supabase } from '../lib/supabase';
import type { Project } from '../types';

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export async function createProject(name: string) {
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name }])
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, name: string) {
  const { data, error } = await supabase
    .from('projects')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
