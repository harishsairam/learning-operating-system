import { useActivities } from '../hooks/useActivities';
import { useTopics } from '../hooks/useTopics';
import { useTodayRevisions, useUpcomingRevisions, useCompleteRevision, useTodayCompletedRevisions } from '../hooks/useRevisions';
import { BookOpen, CalendarCheck, CheckCircle2, Flame, Timer, ArrowRight, Target, Activity } from 'lucide-react';
import { format, startOfDay, subDays } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: activities, isLoading: loadingActivities } = useActivities();
  const { data: topics, isLoading: loadingTopics } = useTopics();
  const { data: todayRevisions, isLoading: loadingTodayRevisions } = useTodayRevisions();
  const { data: upcomingRevisions, isLoading: loadingUpcomingRevisions } = useUpcomingRevisions();
  const { data: todayCompletedRevisions, isLoading: loadingTodayCompleted } = useTodayCompletedRevisions();
  const completeRevision = useCompleteRevision();

  if (loadingActivities || loadingTopics || loadingTodayRevisions || loadingUpcomingRevisions || loadingTodayCompleted) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayActivities = activities?.filter(s => s.study_date === todayStr) || [];
  
  // Topics to Study
  const uniqueActivityTopicIds = new Set(activities?.map((a: any) => a.topic_id));
  const topicsToStudyCount = topics?.filter((t: any) => !uniqueActivityTopicIds.has(t.id)).length || 0;

  // Topics to Revise
  const topicsToReviseCount = todayRevisions?.length || 0;

  // Estimated Revision Time
  const estimatedRevisionTime = topicsToReviseCount * 10;

  // Highest Priority Topic
  const highestPriorityTopic = todayRevisions && todayRevisions.length > 0 
    ? todayRevisions[0].learning_activities?.topics?.name 
    : 'None';

  // Revision Completion
  const completedTodayCount = todayCompletedRevisions?.length || 0;
  const totalRevisionsToday = completedTodayCount + topicsToReviseCount;
  const completionRate = totalRevisionsToday > 0 ? Math.round((completedTodayCount / totalRevisionsToday) * 100) : 100;

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
              Topics to Study
            </span>
            <span className="text-on-surface">{topicsToStudyCount}</span>
          </div>
          <ArrowRight className="hidden sm:block text-outline-variant w-5 h-5 shrink-0" />
          <div className="flex-1 w-full bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
            <span className="text-secondary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-xs">2</span>
              Revisions Due
            </span>
            <span className="text-on-surface">{topicsToReviseCount}</span>
          </div>
          <ArrowRight className="hidden sm:block text-outline-variant w-5 h-5 shrink-0" />
          <div className="flex-1 w-full bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex items-center justify-between">
            <span className="text-secondary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-xs">3</span>
              Revision Progress
            </span>
            <span className="text-on-surface">{completionRate}% Done</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Metric 1: Topics to Study */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">To Study</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-on-surface">{topicsToStudyCount}</div>
            <div className="text-sm text-secondary mt-1">Unexplored topics</div>
          </div>
        </div>

        {/* Metric 2: Topics to Revise */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">To Revise</span>
            <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-on-surface">
              {topicsToReviseCount}
            </div>
            <div className="text-sm text-secondary mt-1">Revisions due today</div>
          </div>
        </div>

        {/* Metric 3: Estimated Time */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Est. Time</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-on-surface">{estimatedRevisionTime} <span className="text-lg text-secondary font-normal">min</span></div>
            <div className="text-sm text-secondary mt-1">Total revision load</div>
          </div>
        </div>

        {/* Metric 4: Highest Priority */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Priority</span>
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-bold text-on-surface leading-tight line-clamp-2" title={highestPriorityTopic}>
              {highestPriorityTopic}
            </div>
            <div className="text-sm text-secondary mt-1">Needs attention first</div>
          </div>
        </div>

        {/* Metric 5: Completion */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Completion</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold text-on-surface">{completionRate}%</div>
            <div className="text-sm text-secondary mt-1">{completedTodayCount} of {totalRevisionsToday} done</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Study Timeline */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-2xl font-bold text-on-surface">Study Timeline</h3>
            <Link to="/activities" className="text-primary-container text-sm font-medium hover:underline">View All</Link>
          </div>
          
          <div className="relative border-l border-outline-variant ml-3 pl-6 space-y-6">
            {activities?.slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="relative">
                <div className="absolute -left-[31px] bg-surface w-3 h-3 rounded-full border-2 border-primary-container top-1.5" />
                <div className="text-xs font-medium text-secondary mb-1">
                  {format(new Date(activity.created_at), 'hh:mm a')}
                  {activity.study_date !== todayStr && ` • ${format(new Date(activity.study_date), 'MMM d')}`}
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl anti-gravity-hover group">
                  <div className="text-[11px] font-bold tracking-wider uppercase text-secondary mb-1 flex flex-wrap gap-1 items-center">
                    <BookOpen className="w-3 h-3 text-primary-container mr-1" />
                    <span>{activity.topics?.categories?.projects?.name || 'Project'}</span>
                    <span className="text-outline-variant">•</span>
                    <span>{activity.topics?.categories?.name || 'Category'}</span>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface">{activity.topics?.name || 'Unknown Topic'}</h4>
                  <div className="text-xs text-secondary mt-2 flex items-center gap-1.5">
                    <Timer className="w-3 h-3" />
                    {activity.duration_minutes} min
                  </div>
                </div>
              </div>
            ))}
            {(!activities || activities.length === 0) && (
              <div className="text-center py-8 bg-surface-container-lowest border border-outline-variant rounded-xl -ml-6">
                <p className="text-secondary text-sm">No study activities recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Revisions */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-2xl font-bold text-on-surface">Today's Revisions</h3>
            <Link to="/revisions/today" className="px-3 py-1 bg-surface-container-high text-secondary rounded-full text-xs font-semibold hover:bg-outline-variant/30 transition-colors">
              {topicsToReviseCount} Remaining
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
    </div>
  );
}
