import { supabase } from '../lib/supabase';
import type { LearningActivity, MemoryMode } from '../types';
import { addDays, format } from 'date-fns';

export async function getActivities() {
  const { data, error } = await supabase
    .from('learning_activities')
    .select(`
      *,
      topics (
        name,
        categories (
          name,
          projects (
            name
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}


export async function createActivity({
  project_id,
  category_id,
  topic_id,
  activity_type,
  memory_mode = 'MEMORIZE',
  study_date,
  start_time,
  duration_minutes,
  source,
  notes,
}: {
  project_id: string;
  category_id: string;
  topic_id: string;
  activity_type: string;
  memory_mode?: MemoryMode;
  study_date: string;
  start_time: string;
  duration_minutes: number;
  source?: string;
  notes?: string;
}) {
  const { data: newActivity, error: activityError } = await supabase
    .from('learning_activities')
    .insert([{
      project_id,
      category_id,
      topic_id,
      activity_type,
      study_date,
      start_time,
      duration_minutes,
      source: source || null,
      notes: notes || null,
    }])
    .select()
    .single();

  if (activityError) throw activityError;

  const { data: newKnowledgeUnit, error: knowledgeUnitError } = await supabase
    .from('knowledge_units')
    .insert([{
      activity_id: newActivity.id,
      project_id,
      category_id,
      topic_id,
      memory_mode,
      title: null,
      what_i_learned: null,
      active_recall_questions: null,
      importance: null,
      confidence: null,
      tags: null,
      srs_ease_factor: 2.5,
      srs_interval: memory_mode === 'REFERENCE' ? 0 : 1,
      srs_repetitions: 0,
      next_review_date: memory_mode === 'REFERENCE' ? null : format(addDays(new Date(study_date), 1), 'yyyy-MM-dd')
    }])
    .select()
    .single();

  if (knowledgeUnitError) throw knowledgeUnitError;
  if (!newKnowledgeUnit) throw new Error('Failed to create knowledge unit for activity');

  return newActivity as LearningActivity;
}

export async function updateActivity(
  id: string,
  updates: {
    project_id?: string;
    category_id?: string;
    topic_id?: string;
    activity_type?: string;
    study_date?: string;
    start_time?: string;
    duration_minutes?: number;
    source?: string | null;
    notes?: string | null;
  }
) {
  // Update learning activity
  const { data, error } = await supabase
    .from('learning_activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Also update foreign keys in linked knowledge units to maintain referential integrity
  if (updates.project_id || updates.category_id || updates.topic_id) {
    const kuUpdates: any = {};
    if (updates.project_id) kuUpdates.project_id = updates.project_id;
    if (updates.category_id) kuUpdates.category_id = updates.category_id;
    if (updates.topic_id) kuUpdates.topic_id = updates.topic_id;
    
    const { error: kuError } = await supabase
      .from('knowledge_units')
      .update(kuUpdates)
      .eq('activity_id', id);
      
    if (kuError) throw kuError;
  }

  return data as LearningActivity;
}

export async function deleteActivity(id: string, mode: number) {
  const { error } = await supabase.rpc('delete_learning_log_safe', {
    p_activity_id: id,
    p_mode: mode
  });

  if (error) throw error;
  return true;
}
