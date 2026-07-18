import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { calculateNextReview, statusToQuality } from '../lib/srs';

export async function getDueRevisions() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
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
    .not('next_review_date', 'is', null)
    .lte('next_review_date', today)
    .order('next_review_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getRevisionStats() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const nowStr = new Date().toISOString();

  // 1. Due today
  const { count: dueTodayCount, error: e1 } = await supabase
    .from('knowledge_units')
    .select('*', { count: 'exact', head: true })
    .not('next_review_date', 'is', null)
    .eq('next_review_date', today);
  if (e1) throw e1;

  // 2. Overdue
  const { count: overdueCount, error: e2 } = await supabase
    .from('knowledge_units')
    .select('*', { count: 'exact', head: true })
    .not('next_review_date', 'is', null)
    .lt('next_review_date', today);
  if (e2) throw e2;

  // 3. Upcoming
  const { count: upcomingCount, error: e3 } = await supabase
    .from('knowledge_units')
    .select('*', { count: 'exact', head: true })
    .not('next_review_date', 'is', null)
    .gt('next_review_date', today);
  if (e3) throw e3;

  // 4. Completed Today
  // Based on revision_logs created today
  const { count: completedCount, error: e4 } = await supabase
    .from('revision_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00.000Z`);
  if (e4) throw e4;

  // 5. Streak (mock for MVP, proper implementation requires distinct days from logs)
  const streak = completedCount && completedCount > 0 ? 1 : 0;

  return {
    dueToday: dueTodayCount || 0,
    overdue: overdueCount || 0,
    upcoming: upcomingCount || 0,
    completedToday: completedCount || 0,
    streak
  };
}

export async function getUpcomingRevisions() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
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
    .not('next_review_date', 'is', null)
    .gt('next_review_date', today)
    .order('next_review_date', { ascending: true })
    .limit(5);

  if (error) throw error;
  return data;
}

export async function submitRevisionSession({
  session_id,
  reviews
}: {
  session_id: string | null;
  reviews: Array<{
    knowledge_unit_id: string;
    project_id: string;
    category_id: string;
    topic_id: string;
    status: 'Easy' | 'Good' | 'Hard' | 'Again';
    timeSpentSeconds: number;
    previousEase: number;
    previousInterval: number;
    previousRepetitions: number;
  }>;
}) {
  if (session_id) {
    // 1. End session
    await supabase
      .from('learning_sessions')
      .update({ 
        status: 'COMPLETED',
        ended_at: new Date().toISOString()
      })
      .eq('id', session_id);
  }

  if (reviews.length === 0) return;

  // Group reviews by topic_id so we can create one Learning Activity per topic
  const reviewsByTopic = reviews.reduce((acc, review) => {
    if (!acc[review.topic_id]) {
      acc[review.topic_id] = [];
    }
    acc[review.topic_id].push(review);
    return acc;
  }, {} as Record<string, typeof reviews>);

  const logsToInsert = [];

  for (const topicId of Object.keys(reviewsByTopic)) {
    const topicReviews = reviewsByTopic[topicId];
    const firstReview = topicReviews[0];
    
    // 2. Create Learning Activity for this topic
    const { data: activity, error: activityError } = await supabase
      .from('learning_activities')
      .insert([{
        project_id: firstReview.project_id,
        category_id: firstReview.category_id,
        topic_id: topicId,
        activity_type: 'Revision',
        study_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: format(new Date(), 'HH:mm'),
        duration_minutes: Math.ceil(topicReviews.reduce((acc, r) => acc + r.timeSpentSeconds, 0) / 60) || 1,
        learning_session_id: session_id || null
      }])
      .select()
      .single();

    if (activityError) throw activityError;
    if (!activity) throw new Error('Failed to create learning activity');

    // 3. Process SRS and prepare Revision Logs
    for (const review of topicReviews) {
      const quality = statusToQuality(review.status);
      const srsData = calculateNextReview(
        quality, 
        review.previousEase, 
        review.previousInterval, 
        review.previousRepetitions
      );

      logsToInsert.push({
        activity_id: activity.id,
        knowledge_unit_id: review.knowledge_unit_id,
        quality,
        time_spent_seconds: review.timeSpentSeconds
      });

      // Update KU
      await supabase
        .from('knowledge_units')
        .update({
          srs_ease_factor: srsData.easeFactor,
          srs_interval: srsData.interval,
          srs_repetitions: srsData.repetitions,
          next_review_date: srsData.nextReviewDate
        })
        .eq('id', review.knowledge_unit_id);
    }
  }

  // Insert all logs
  const { error: logsError } = await supabase
    .from('revision_logs')
    .insert(logsToInsert);

  if (logsError) throw logsError;
}
