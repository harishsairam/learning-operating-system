import { supabase } from '../lib/supabase';
import { ensureAuthenticated } from '../lib/auth';
import { format } from 'date-fns';

export interface DailyAnalytics {
  studyTimeToday: number; // in minutes
  revisionTimeToday: number; // in minutes
  totalTimeToday: number; // in minutes
  topicsStudiedToday: number;
  revisionsCompletedToday: number;
  pendingRevisionsToday: number;
  mostActiveProjectToday: {
    id: string;
    name: string;
    activitiesCount: number;
  } | null;
}

export interface ProjectMetrics {
  id: string;
  name: string;
  totalStudyTime: number; // in minutes
  totalRevisionTime: number; // in minutes
  totalLearningTime: number; // in minutes
  categoriesCount: number;
  topicsCount: number;
  activitiesCount: number;
  upcomingPendingRevisions: number;
  lastActivityDate: string | null;
  createdAt: string;
}

/**
 * Fetches analytics for the current day
 */
export async function getDailyAnalytics(): Promise<DailyAnalytics> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const user = await ensureAuthenticated();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Fetch today's learning activities
  const { data: todayActivities, error: activitiesError } = await supabase
    .from('learning_activities')
    .select('id, project_id, topic_id, duration_minutes')
    .eq('study_date', today)
    .eq('user_id', user.id);

  if (activitiesError) throw activitiesError;

  // Calculate study time and unique topics
  const studyTimeToday = (todayActivities || []).reduce((sum, a) => sum + a.duration_minutes, 0);
  const topicsStudiedToday = new Set((todayActivities || []).map(a => a.topic_id)).size;

  // Find most active project today
  const projectCounts = new Map<string, number>();
  (todayActivities || []).forEach(activity => {
    projectCounts.set(activity.project_id, (projectCounts.get(activity.project_id) || 0) + 1);
  });

  let mostActiveProjectToday: DailyAnalytics['mostActiveProjectToday'] = null;
  if (projectCounts.size > 0) {
    const topProjectId = Array.from(projectCounts.entries()).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', topProjectId)
      .eq('user_id', user.id)
      .single();

    if (!projectError && projectData) {
      mostActiveProjectToday = {
        id: projectData.id,
        name: projectData.name,
        activitiesCount: projectCounts.get(topProjectId) || 0,
      };
    }
  }

  // Fetch pending revisions due today
  const { data: pendingKUs, error: kuError } = await supabase
    .from('knowledge_units')
    .select('id')
    .eq('user_id', user.id)
    .not('next_review_date', 'is', null)
    .lte('next_review_date', today);

  if (kuError) throw kuError;

  const revisionTimeToday = 0;
  const revisionsCompletedToday = 0;
  const pendingRevisionsToday = (pendingKUs || []).length;

  return {
    studyTimeToday,
    revisionTimeToday,
    totalTimeToday: studyTimeToday + revisionTimeToday,
    topicsStudiedToday,
    revisionsCompletedToday,
    pendingRevisionsToday,
    mostActiveProjectToday,
  };
}

/**
 * Fetches analytics for all projects
 */
export async function getProjectsAnalytics(): Promise<ProjectMetrics[]> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const user = await ensureAuthenticated();

  // Fetch all projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (projectsError) throw projectsError;

  if (!projects || projects.length === 0) {
    return [];
  }

  // Fetch all learning activities with project info
  const { data: activities, error: activitiesError } = await supabase
    .from('learning_activities')
    .select('id, project_id, duration_minutes, created_at')
    .eq('user_id', user.id);

  if (activitiesError) throw activitiesError;

  // Fetch all categories to count by project
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, project_id')
    .eq('user_id', user.id);

  if (categoriesError) throw categoriesError;

  // Fetch all topics to count by project
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, category_id')
    .eq('user_id', user.id);

  if (topicsError) throw topicsError;

  const { data: knowledgeUnits, error: knowledgeUnitsError } = await supabase
    .from('knowledge_units')
    .select('id, project_id, next_review_date')
    .eq('user_id', user.id);

  if (knowledgeUnitsError) throw knowledgeUnitsError;

  const knowledgeUnitProjectMap = new Map<string, string>();
  (knowledgeUnits || []).forEach((ku) => {
    knowledgeUnitProjectMap.set(ku.id, ku.project_id);
  });

  // Build category map: category_id -> count
  const categoryMap = new Map<string, number>();
  const categoryToProjectMap = new Map<string, string>();
  
  (categories || []).forEach(cat => {
    categoryToProjectMap.set(cat.id, cat.project_id);
    categoryMap.set(cat.id, (categoryMap.get(cat.id) || 0) + 1);
  });

  // Build project to categories map
  const projectCategoriesMap = new Map<string, Set<string>>();
  (categories || []).forEach(cat => {
    if (!projectCategoriesMap.has(cat.project_id)) {
      projectCategoriesMap.set(cat.project_id, new Set());
    }
    projectCategoriesMap.get(cat.project_id)!.add(cat.id);
  });

  // Build project to topics map
  const projectTopicsMap = new Map<string, Set<string>>();
  (topics || []).forEach(topic => {
    const projectId = categoryToProjectMap.get(topic.category_id);
    if (projectId) {
      if (!projectTopicsMap.has(projectId)) {
        projectTopicsMap.set(projectId, new Set());
      }
      projectTopicsMap.get(projectId)!.add(topic.id);
    }
  });

  // Build metrics for each project
  const projectMetrics: ProjectMetrics[] = (projects || []).map(project => {
    // Activities for this project
    const projectActivities = (activities || []).filter(a => a.project_id === project.id);
    const totalStudyTime = projectActivities.reduce((sum, a) => sum + a.duration_minutes, 0);
    const lastActivityDate = projectActivities.length > 0 
      ? projectActivities.reduce((latest, a) => new Date(a.created_at) > new Date(latest.created_at) ? a : latest).created_at
      : null;

    // Revisions for this project
    const totalRevisionTime = 0;

    // Pending revisions due today or earlier
    const upcomingPendingRevisions = (knowledgeUnits || []).filter(ku => 
      ku.project_id === project.id && ku.next_review_date && ku.next_review_date <= today
    ).length;

    return {
      id: project.id,
      name: project.name,
      totalStudyTime,
      totalRevisionTime,
      totalLearningTime: totalStudyTime + totalRevisionTime,
      categoriesCount: projectCategoriesMap.get(project.id)?.size || 0,
      topicsCount: projectTopicsMap.get(project.id)?.size || 0,
      activitiesCount: projectActivities.length,
      upcomingPendingRevisions,
      lastActivityDate,
      createdAt: project.created_at,
    };
  });

  return projectMetrics;
}

/**
 * Fetches analytics for a single project (for future use)
 */
export async function getProjectAnalytics(projectId: string): Promise<ProjectMetrics | null> {
  const metrics = await getProjectsAnalytics();
  return metrics.find(m => m.id === projectId) || null;
}
