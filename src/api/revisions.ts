import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export async function getTodayRevisions() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data, error } = await supabase
    .from('revision_schedule')
    .select(`
      *,
      knowledge_units (
        topic_id,
        memory_mode,
        topics (
          name,
          categories (
            name,
            projects (
              name
            )
          )
        )
      )
    `)
    .lte('revision_date', today)
    .eq('completed', false)
    .order('revision_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function completeRevision({ id, status, timeSpent }: { id: string, status: string, timeSpent: number }) {
  const { error } = await supabase
    .from('revision_schedule')
    .update({ 
      completed: true, 
      completed_at: new Date().toISOString(),
      completion_status: status,
      time_spent_minutes: timeSpent
    })
    .eq('id', id);

  if (error) throw error;
}

export async function skipRevision(id: string) {
  const { error } = await supabase
    .from('revision_schedule')
    .update({ 
      completed: true, 
      completed_at: new Date().toISOString(),
      completion_status: 'skipped'
    })
    .eq('id', id);

  if (error) throw error;
}

export async function rescheduleRevision({ id, newDate }: { id: string, newDate: string }) {
  const { error } = await supabase
    .from('revision_schedule')
    .update({ 
      revision_date: newDate 
    })
    .eq('id', id);

  if (error) throw error;
}

export async function getTodayCompletedRevisions() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('revision_schedule')
    .select('*')
    .eq('completed', true)
    .gte('completed_at', todayStart.toISOString());

  if (error) throw error;
  return data;
}

export async function getUpcomingRevisions() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { data, error } = await supabase
    .from('revision_schedule')
    .select(`
      *,
      knowledge_units (
        topic_id,
        memory_mode,
        topics (
          name,
          categories (
            name,
            projects (
              name
            )
          )
        )
      )
    `)
    .gt('revision_date', today)
    .eq('completed', false)
    .order('revision_date', { ascending: true })
    .limit(5);

  if (error) throw error;
  return data;
}
