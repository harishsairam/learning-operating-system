import { supabase } from '../lib/supabase';
import { ensureAuthenticated, withUserScope } from '../lib/auth';
import type { LearningActivity, MemoryMode } from '../types';
import { createInitialRevisionState } from '../lib/revisions';

export async function getActivities() {
  const user = await ensureAuthenticated();
  const { data, error } = await supabase
    .from('learning_activities')
    .select(`
      *,
      projects (
        name
      ),
      categories (
        name
      ),
      topics (
        name
      )
    `)
    .eq('user_id', user.id)
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
  const user = await ensureAuthenticated();
  const { data: newActivity, error: activityError } = await supabase
    .from('learning_activities')
    .insert([withUserScope({
      project_id,
      category_id,
      topic_id,
      activity_type,
      study_date,
      start_time,
      duration_minutes,
      source: source || null,
      notes: notes || null,
    }, user.id)])
    .select()
    .single();

  if (activityError) throw activityError;

  const revisionState = createInitialRevisionState(study_date);
  const { data: newKnowledgeUnit, error: knowledgeUnitError } = await supabase
    .from('knowledge_units')
    .insert([withUserScope({
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
      revision_stage: revisionState.revision_stage,
      next_review_date: memory_mode === 'REFERENCE' ? null : revisionState.next_review_date,
      last_reviewed_at: revisionState.last_reviewed_at,
    }, user.id)])
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
  const user = await ensureAuthenticated();

  const { data, error } = await supabase
    .from('learning_activities')
    .update(withUserScope(updates, user.id))
    .eq('id', id)
    .eq('user_id', user.id)
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
      .update(withUserScope(kuUpdates, user.id))
      .eq('activity_id', id)
      .eq('user_id', user.id);
      
    if (kuError) throw kuError;
  }

  return data as LearningActivity;
}

export async function deleteActivity(id: string) {
  const user = await ensureAuthenticated();
  const { error } = await supabase
    .from('learning_activities')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
  return true;
}
