import { supabase } from '../lib/supabase';
import type { LearningActivity } from '../types';
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

  const revisionIntervals = [1, 3, 7, 15, 30];
  const sessionDate = new Date(study_date);

  const revisions = revisionIntervals.map((days, index) => {
    const revisionDate = addDays(sessionDate, days);
    return {
      activity_id: newActivity.id,
      revision_number: index + 1,
      revision_date: format(revisionDate, 'yyyy-MM-dd'),
      completed: false,
      completed_at: null,
    };
  });

  const { error: revisionsError } = await supabase
    .from('revision_schedule')
    .insert(revisions);

  if (revisionsError) throw revisionsError;

  return newActivity as LearningActivity;
}
