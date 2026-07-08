import { useActivities } from '../hooks/useActivities';
import { useTodayRevisions, useCompleteRevision } from '../hooks/useRevisions';
import { useDailyAnalytics } from '../hooks/useDailyAnalytics';
import { useProjectsAnalytics } from '../hooks/useProjectsAnalytics';
import { useActiveSession } from '../hooks/useSessions';
import { BookOpen, CalendarCheck, CheckCircle2, Flame, Timer, ArrowRight, Target, Activity, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: activities, isLoading: loadingActivities } = useActivities();
  const { data: todayRevisions, isLoading: loadingTodayRevisions } = useTodayRevisions();
  const { data: dailyAnalytics, isLoading: loadingDailyAnalytics } = useDailyAnalytics();
  const { data: projectsAnalytics, isLoading: loadingProjectsAnalytics } = useProjectsAnalytics();
  const { data: activeSession, isLoading: loadingActiveSession } = useActiveSession();
  const completeRevision = useCompleteRevision();

  const isLoading = loadingActivities || loadingTodayRevisions || loadingDailyAnalytics || loadingProjectsAnalytics || loadingActiveSession;

  if (isLoading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayActivities = activities?.filter(s => s.study_date === todayStr) || [];

  // Daily metrics
  const studyTimeToday = dailyAnalytics?.studyTimeToday || 0;
  const revisionTimeToday = dailyAnalytics?.revisionTimeToday || 0;
  const totalTimeToday = dailyAnalytics?.totalTimeToday || 0;
  const topicsStudiedToday = dailyAnalytics?.topicsStudiedToday || 0;
  const revisionsCompletedToday = dailyAnalytics?.revisionsCompletedToday || 0;
  const pendingRevisionsToday = dailyAnalytics?.pendingRevisionsToday || 0;
  const mostActiveProject = dailyAnalytics?.mostActiveProjectToday;

  // Revision metrics
  const totalRevisionsToday = revisionsCompletedToday + pendingRevisionsToday;
  const completionRate = totalRevisionsToday > 0 ? Math.round((revisionsCompletedToday / totalRevisionsToday) * 100) : 100;
  const highestPriorityTopic = todayRevisions && todayRevisions.length > 0 
    ? todayRevisions[0].learning_activities?.topics?.name 
    : 'None';

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface mb-2 tracking-tight">Good morning.</h2>
          <p className="text-lg text-secondary">Here is your cognitive load for today.</p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-secondary text-sm font-medium bg-surface-container-lowest border border-outline-variant px-4 py-2 rounded-full">
          <CalendarCheck className="w-4 h-4" />
          <span>{format(new Date(), 'MMMM d, yyyy')}</span>
        </div>
      </header>

      {/* Today's Learning Flow */}
      <section>
        <h3 className="font-display text-xl font-bold text-on-surface mb-4">Today's Learning Flow</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm font-medium">
          <div className="flex-1 w-full bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
            <span className="text-secondary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-xs">1</span>
              Study Time Today
            </span>
            <span className="text-on-surface">{studyTimeToday} min</span>
          </div>
          <ArrowRight className="hidden sm:block text-outline-variant w-5 h-5 shrink-0" />
          <div className="flex-1 w-full bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
            <span className="text-secondary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-xs">2</span>
              Revision Time Today
            </span>
            <span className="text-on-surface">{revisionTimeToday} min</span>
          </div>
          <ArrowRight className="hidden sm:block text-outline-variant w-5 h-5 shrink-0" />
          <div className="flex-1 w-full bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
            <span className="text-secondary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-xs">3</span>
              Total Time
            </span>
            <span className="text-on-surface">{totalTimeToday} min</span>
          </div>
        </div>
      </section>

      {/* Active Session Card */}
      {activeSession && (
        <section className="bg-gradient-to-br from-primary-container/20 to-primary-container/10 border-2 border-primary-container/50 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-container animate-pulse" />
                </div>
                <span className="text-sm font-bold text-primary-container uppercase tracking-widest">
                  🟢 Session Active
                </span>
              </div>
              <h4 className="font-display text-2xl font-bold text-on-surface mb-2">{activeSession.topics?.name || 'Session'}</h4>
              <div className="text-sm text-secondary mb-4">
                <div>{activeSession.projects?.name} • {activeSession.categories?.name}</div>
                <div className="mt-2">
                  {(() => {
                    const started = new Date(activeSession.started_at);
                    const now = new Date();
                    const elapsedMs = now.getTime() - started.getTime();
                    const elapsedMin = Math.floor(elapsedMs / 60000);
                    const remaining = Math.max(0, activeSession.planned_duration_minutes - elapsedMin);
                    return `Elapsed: ${elapsedMin}m | Remaining: ${remaining}m`;
                  })()}
                </div>
              </div>
              <button
                onClick={() => navigate(`/sessions/${activeSession.id}`)}
                className="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-semibold hover:bg-primary transition-colors text-sm"
              >
                Continue Session
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Metric 1: Study Time Today */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Study Time</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-on-surface">{studyTimeToday}</div>
            <div className="text-sm text-secondary mt-1">minutes today</div>
          </div>
        </div>

        {/* Metric 2: Revision Time Today */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Revision Time</span>
            <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-on-surface">
              {revisionTimeToday}
            </div>
            <div className="text-sm text-secondary mt-1">minutes completed</div>
          </div>
        </div>

        {/* Metric 3: Topics Studied Today */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Topics</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-on-surface">{topicsStudiedToday}</div>
            <div className="text-sm text-secondary mt-1">studied today</div>
          </div>
        </div>

        {/* Metric 4: Revisions Completed */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Completed</span>
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-on-surface">{revisionsCompletedToday}</div>
            <div className="text-sm text-secondary mt-1">revisions done</div>
          </div>
        </div>

        {/* Metric 5: Progress */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Progress</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-on-surface">{completionRate}%</div>
            <div className="text-sm text-secondary mt-1">{revisionsCompletedToday} of {totalRevisionsToday} revisions</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Most Active Project */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-2xl font-bold text-on-surface">Most Active Project</h3>
          </div>
          {mostActiveProject ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 anti-gravity-hover">
              <h4 className="font-display text-xl font-bold text-on-surface mb-6">{mostActiveProject.name}</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
                  <span className="text-secondary text-sm">Activities Today</span>
                  <span className="font-semibold text-on-surface">{mostActiveProject.activitiesCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center">
              <p className="text-secondary text-sm">No activity today</p>
            </div>
          )}
        </div>

        {/* Right Column: Today's Revisions */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-2xl font-bold text-on-surface">Today's Revisions</h3>
            <Link to="/revisions" className="px-3 py-1 bg-surface-container-high text-secondary rounded-full text-xs font-semibold hover:bg-outline-variant/30 transition-colors">
              {pendingRevisionsToday} Pending
            </Link>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            {todayRevisions?.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto h-8 w-8 text-secondary/50 mb-3" />
                <p className="text-secondary text-sm">All caught up for today!</p>
              </div>
            ) : (
              todayRevisions?.slice(0, 5).map((revision: any) => (
                <div key={revision.id} className="flex items-start gap-4 p-5 border-b border-outline-variant last:border-0 hover:bg-surface-container-lowest/50 transition-colors">
                  <div className="flex-1">
                    <div className="text-[11px] font-bold tracking-wider uppercase text-secondary mb-1">
                      {revision.learning_activities?.topics?.categories?.name || 'Category'}
                    </div>
                    <h4 className="text-sm font-bold text-on-surface mb-1">{revision.learning_activities?.topics?.name || 'Topic'}</h4>
                    <p className="text-sm text-secondary">Revision #{revision.revision_number} • Due {format(new Date(revision.revision_date), 'MMM d')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Project Summary */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-2xl font-bold text-on-surface">Project Summary</h3>
          <Link to="/projects" className="text-primary-container text-sm font-medium hover:underline">View All</Link>
        </div>
        {projectsAnalytics && projectsAnalytics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projectsAnalytics.map((project) => (
              <div key={project.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 anti-gravity-hover flex flex-col">
                <h4 className="font-display text-lg font-bold text-on-surface mb-4">{project.name}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
                    <span className="text-secondary">Study Time</span>
                    <span className="font-semibold text-on-surface">{project.totalStudyTime} min</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
                    <span className="text-secondary">Revision Time</span>
                    <span className="font-semibold text-on-surface">{project.totalRevisionTime} min</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
                    <span className="text-secondary">Total Time</span>
                    <span className="font-semibold text-on-surface">{project.totalLearningTime} min</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
                    <span className="text-secondary">Topics</span>
                    <span className="font-semibold text-on-surface">{project.topicsCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
                    <span className="text-secondary">Activities</span>
                    <span className="font-semibold text-on-surface">{project.activitiesCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-secondary">Pending Revisions</span>
                    <span className={`font-semibold ${project.upcomingPendingRevisions > 0 ? 'text-orange-500' : 'text-on-surface'}`}>
                      {project.upcomingPendingRevisions}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
            <p className="text-secondary text-sm">No projects yet. Create one to get started.</p>
          </div>
        )}
      </section>
    </div>
  );
}
