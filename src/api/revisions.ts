import { supabase } from '../lib/supabase';
import { ensureAuthenticated } from '../lib/auth';
import { format } from 'date-fns';
import { calculateNextReviewDate } from '../lib/revisions';

export async function getDueRevisions() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const user = await ensureAuthenticated();

  const { data, error } = await supabase
    .from('knowledge_units')
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
    .eq('user_id', user.id)
    .not('next_review_date', 'is', null)
    .lte('next_review_date', today)
    .order('next_review_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getRevisionStats() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const user = await ensureAuthenticated();

  const { count: dueTodayCount, error: dueError } = await supabase
    .from('knowledge_units')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('next_review_date', 'is', null)
    .eq('next_review_date', today);
  if (dueError) throw dueError;

  const { count: overdueCount, error: overdueError } = await supabase
    .from('knowledge_units')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('next_review_date', 'is', null)
    .lt('next_review_date', today);
  if (overdueError) throw overdueError;

  const { count: upcomingCount, error: upcomingError } = await supabase
    .from('knowledge_units')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('next_review_date', 'is', null)
    .gt('next_review_date', today);
  if (upcomingError) throw upcomingError;

  return {
    dueToday: dueTodayCount || 0,
    overdue: overdueCount || 0,
    upcoming: upcomingCount || 0,
    completedToday: 0,
    streak: 0,
  };
}

export async function getUpcomingRevisions() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const user = await ensureAuthenticated();

  const { data, error } = await supabase
    .from('knowledge_units')
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
    .eq('user_id', user.id)
    .not('next_review_date', 'is', null)
    .gt('next_review_date', today)
    .order('next_review_date', { ascending: true })
    .limit(5);

  if (error) throw error;
  return data;
}

export async function submitRevisionSession({ knowledgeUnitId }: { knowledgeUnitId: string }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const user = await ensureAuthenticated();

  const { data: currentUnit, error: fetchError } = await supabase
    .from('knowledge_units')
    .select('revision_stage, next_review_date, last_reviewed_at')
    .eq('id', knowledgeUnitId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) throw fetchError;

  const nextStage = (currentUnit?.revision_stage ?? 0) + 1;
  const nextReviewDate = calculateNextReviewDate(nextStage, new Date(today));

  const { error: updateError } = await supabase
    .from('knowledge_units')
    .update({
      last_reviewed_at: today,
      revision_stage: nextStage,
      next_review_date: format(nextReviewDate, 'yyyy-MM-dd'),
    })
    .eq('id', knowledgeUnitId)
    .eq('user_id', user.id);

  if (updateError) throw updateError;
}
