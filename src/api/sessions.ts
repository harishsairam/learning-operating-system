import { supabase } from '../lib/supabase';
import { withUserScope } from '../lib/auth';
import type { LearningSession, LearningSessionWithRelations, SessionStatus, MemoryMode } from '../types';
import { format } from 'date-fns';

/**
 * Fetch all sessions for a project (for history/analytics)
 */
export async function getSessions(userId: string): Promise<LearningSessionWithRelations[]> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select(`
      *,
      topics (name),
      categories (name),
      projects (name)
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return (data || []) as LearningSessionWithRelations[];
}

/**
 * Fetch the active or paused session (if any)
 */
export async function getActiveSession(userId: string): Promise<LearningSessionWithRelations | null> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select(`
      *,
      topics (name),
      categories (name),
      projects (name)
    `)
    .eq('user_id', userId)
    .in('status', ['ACTIVE', 'PAUSED'])
    .order('started_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data && data.length > 0 ? data[0] : null) as LearningSessionWithRelations | null;
}

/**
 * Fetch a specific session by ID
 */
export async function getSession(userId: string, sessionId: string): Promise<LearningSessionWithRelations> {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select(`
      *,
      topics (name),
      categories (name),
      projects (name)
    `)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as LearningSessionWithRelations;
}

/**
 * Create a new learning session
 */
export async function createSession(userId: string, {
  project_id,
  category_id,
  topic_id,
  memory_mode,
  activity_type,
  planned_duration_minutes,
}: {
  project_id: string;
  category_id: string;
  topic_id: string;
  memory_mode: MemoryMode;
  activity_type: string;
  planned_duration_minutes: number;
}) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('learning_sessions')
    .insert([withUserScope({
      project_id,
      category_id,
      topic_id,
      memory_mode,
      activity_type,
      planned_duration_minutes,
      focused_duration_minutes: 0,
      paused_duration_minutes: 0,
      started_at: now,
      status: 'ACTIVE',
    }, userId)])
    .select()
    .single();

  if (error) throw error;
  return data as LearningSession;
}

/**
 * Pause an active session
 */
export async function pauseSession(userId: string, sessionId: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('learning_sessions')
    .update({
      status: 'PAUSED',
      paused_at: now,
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as LearningSession;
}

/**
 * Resume a paused session
 * Calculates and updates paused_duration_minutes
 */
export async function resumeSession(userId: string, sessionId: string) {
  const now = new Date().toISOString();

  const { data: session, error: fetchError } = await supabase
    .from('learning_sessions')
    .select()
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;
  if (!session.paused_at) throw new Error('Session was not paused');

  // Calculate additional paused time
  const pausedAt = new Date(session.paused_at);
  const nowDate = new Date();
  const pausedMinutes = Math.floor((nowDate.getTime() - pausedAt.getTime()) / 60000);

  const { data, error } = await supabase
    .from('learning_sessions')
    .update({
      status: 'ACTIVE',
      paused_duration_minutes: session.paused_duration_minutes + pausedMinutes,
      resumed_at: now,
      paused_at: null,
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as LearningSession;
}

/**
 * Extend a session's planned duration
 */
export async function extendSession(
  userId: string,
  sessionId: string,
  additionalMinutes: number
) {
  const now = new Date().toISOString();

  const { data: session, error: fetchError } = await supabase
    .from('learning_sessions')
    .select()
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('learning_sessions')
    .update({
      planned_duration_minutes: session.planned_duration_minutes + additionalMinutes,
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as LearningSession;
}

/**
 * Calculate focused duration for a session
 * focused = (now - started_at) - paused_duration
 */
export function calculateFocusedDuration(
  startedAt: string,
  pausedDuration: number
): number {
  const started = new Date(startedAt);
  const now = new Date();
  const elapsedMs = now.getTime() - started.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const focusedMinutes = Math.max(0, elapsedMinutes - pausedDuration);
  return focusedMinutes;
}

/**
 * Complete a session (prepare for activity creation)
 * Calculate final focused duration and save reflection
 */
export async function completeSession(
  userId: string,
  sessionId: string,
  reflection?: string,
  notes?: string
) {
  const now = new Date().toISOString();

  const { data: session, error: fetchError } = await supabase
    .from('learning_sessions')
    .select()
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  // Calculate final focused duration
  const focusedDuration = calculateFocusedDuration(
    session.started_at,
    session.paused_duration_minutes
  );

  // If paused, add remaining pause time
  let finalPausedDuration = session.paused_duration_minutes;
  if (session.status === 'PAUSED' && session.paused_at) {
    const pausedAt = new Date(session.paused_at);
    const nowDate = new Date();
    const pausedMinutes = Math.floor((nowDate.getTime() - pausedAt.getTime()) / 60000);
    finalPausedDuration += pausedMinutes;
  }

  const { data, error } = await supabase
    .from('learning_sessions')
    .update({
      status: 'COMPLETED',
      ended_at: now,
      focused_duration_minutes: focusedDuration,
      paused_duration_minutes: finalPausedDuration,
      reflection: reflection || null,
      notes: notes || null,
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as LearningSession;
}

/**
 * Cancel a session (discard without creating activity)
 */
export async function cancelSession(userId: string, sessionId: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('learning_sessions')
    .update({
      status: 'CANCELLED',
      ended_at: now,
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as LearningSession;
}
