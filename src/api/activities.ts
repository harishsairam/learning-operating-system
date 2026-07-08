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

/**
 * Maps a memory mode to the revision intervals (in days) after the initial study session.
 * Returns an empty array for REFERENCE mode (no revisions).
 */
function getRevisionIntervals(memoryMode: MemoryMode): number[] {
  switch (memoryMode) {
    case 'REFERENCE':
      return [];
    case 'LEARN_ONCE':
      return [1];
    case 'MEMORIZE':
      return [1, 3, 7, 15, 30];
    case 'MASTER':
      return [1, 3, 7, 15, 30, 60, 90, 180, 365];
    default:
      return [1, 3, 7, 15, 30]; // fallback to MEMORIZE
  }
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
      memory_mode,
      study_date,
      start_time,
      duration_minutes,
      source: source || null,
      notes: notes || null,
    }])
    .select()
    .single();

  if (activityError) throw activityError;

  // Generate revision schedule based on memory mode
  const revisionIntervals = getRevisionIntervals(memory_mode as MemoryMode);
  
  if (revisionIntervals.length === 0) {
    // REFERENCE mode: no revisions needed
    return newActivity as LearningActivity;
  }

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
