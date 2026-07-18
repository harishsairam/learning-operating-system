import { useState } from 'react';
import { useActivities } from '../hooks/useActivities';
import { useDueRevisions, useUpcomingRevisions } from '../hooks/useRevisions';
import { useDailyAnalytics } from '../hooks/useDailyAnalytics';
import { useProjectsAnalytics } from '../hooks/useProjectsAnalytics';
import { useActiveSession } from '../hooks/useSessions';
import { useAuthUser } from '../hooks/useAuthUser';
import { 
  BookOpen, CalendarCheck, CheckCircle2, Timer, ArrowRight, Target, Activity, Zap, Clock3,
  Clock, Plus, RefreshCw, Calendar, Brain, Play, ChevronRight, Flag, Book
} from 'lucide-react';
import { format, isTomorrow, isValid, parseISO } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { TodayPlan } from '../components/daily/TodayPlan';
import { LearningLogRow } from '../components/dashboard/LearningLogRow';

const safeFormat = (dateVal: any, formatStr: string, fallback = '—') => {
  if (!dateVal) return fallback;
  const d = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
  return isValid(d) ? format(d, formatStr) : fallback;
};

const safeIsTomorrow = (dateVal: any) => {
  if (!dateVal) return false;
  const d = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
  return isValid(d) ? isTomorrow(d) : false;
};

const safeIsValidAndNotTomorrow = (dateVal: any) => {
  if (!dateVal) return false;
  const d = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
  return isValid(d) && !isTomorrow(d);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthUser();
  const { data: activities, isLoading: loadingActivities } = useActivities();
  const { data: todayRevisions, isLoading: loadingTodayRevisions } = useDueRevisions();
  const { data: upcomingRevisions, isLoading: loadingUpcomingRevisions } = useUpcomingRevisions();
  const { data: dailyAnalytics, isLoading: loadingDailyAnalytics } = useDailyAnalytics();
  const { data: projectsAnalytics, isLoading: loadingProjectsAnalytics } = useProjectsAnalytics();
  const { data: activeSession, isLoading: loadingActiveSession } = useActiveSession();

  const isLoading = loadingActivities || loadingTodayRevisions || loadingUpcomingRevisions || loadingDailyAnalytics || loadingProjectsAnalytics || loadingActiveSession;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-pulse text-secondary text-lg font-medium">Loading dashboard...</div>
      </div>
    );
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayActivities = activities?.filter((s: any) => s.study_date === todayStr) || [];
  
  // Separate revisions
  const dueTodayRevisions = todayRevisions || [];
  const dueTomorrowRevisions = upcomingRevisions?.filter((r: any) => safeIsTomorrow(r.next_review_date)) || [];
  const restUpcomingRevisions = upcomingRevisions?.filter((r: any) => safeIsValidAndNotTomorrow(r.next_review_date)) || [];

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Learner';

  // Daily metrics
  const studyTimeToday = dailyAnalytics?.studyTimeToday || 0;
  const revisionTimeToday = dailyAnalytics?.revisionTimeToday || 0;
  const topicsStudiedToday = dailyAnalytics?.topicsStudiedToday || 0;
  const revisionsCompletedToday = dailyAnalytics?.revisionsCompletedToday || 0;
  const pendingRevisionsToday = dailyAnalytics?.pendingRevisionsToday || 0;
  const totalRevisionsToday = revisionsCompletedToday + pendingRevisionsToday;
  
  const studyHours = Math.floor(studyTimeToday / 60);
  const studyMins = studyTimeToday % 60;
  const formattedStudyTime = studyHours > 0 ? `${studyHours}h ${studyMins}m` : `${studyMins}m`;
  const mostActiveProject = dailyAnalytics?.mostActiveProjectToday;
  const completionRate = totalRevisionsToday > 0 ? Math.round((revisionsCompletedToday / totalRevisionsToday) * 100) : 100;

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-12">
      {/* Header section */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pt-4">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface mb-3 flex items-center gap-3 tracking-tight">
            Good Morning, {firstName}! <span className="text-3xl animate-bounce" style={{animationDuration: '3s'}}>👋</span>
          </h2>
          <p className="text-secondary text-lg font-medium">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest hidden sm:block mr-2">Quick Actions</span>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/activities')} className="flex flex-col items-center justify-center p-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 hover:bg-primary-container/5 hover:-translate-y-1 transition-all text-sm font-semibold text-on-surface w-[100px] h-[100px] shadow-sm">
              <Clock className="w-6 h-6 mb-2.5 text-primary" />
              <span className="text-center leading-tight">Start<br/>Session</span>
            </button>
            <button onClick={() => navigate('/activities')} className="flex flex-col items-center justify-center p-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:border-green-500/40 hover:bg-green-50/50 hover:-translate-y-1 transition-all text-sm font-semibold text-on-surface w-[100px] h-[100px] shadow-sm">
              <Plus className="w-6 h-6 mb-2.5 text-green-600" />
              <span className="text-center leading-tight">Add<br/>Log</span>
            </button>
            <button onClick={() => navigate('/revisions/session')} className="flex flex-col items-center justify-center p-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:border-orange-500/40 hover:bg-orange-50/50 hover:-translate-y-1 transition-all text-sm font-semibold text-on-surface w-[100px] h-[100px] shadow-sm">
              <RefreshCw className="w-6 h-6 mb-2.5 text-orange-500" />
              <span className="text-center leading-tight">Start<br/>Revision</span>
            </button>
          </div>
        </div>
      </header>

      {/* Row 1: Plan and Session */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section>
          <TodayPlan />
        </section>

        <section>
          <div className="h-full rounded-2xl border border-outline-variant/50 bg-blue-50/20 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/30 bg-surface-container-lowest/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-on-surface font-display">Current Study Session</h3>
              </div>
              {activeSession && (
                <span className="bg-primary-container/20 text-primary-container px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                  In Progress
                </span>
              )}
            </div>
            
            <div className="p-8 flex-1 flex flex-col justify-center">
              {activeSession ? (
                <div>
                  <p className="text-sm font-medium text-secondary mb-2">{activeSession.projects?.name} • {activeSession.categories?.name}</p>
                  <h4 className="font-display text-3xl font-bold text-on-surface mb-6">{activeSession.topics?.name || 'Session'}</h4>
                  
                  <div className="flex items-center justify-between text-sm text-secondary mb-8 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <Clock3 className="w-4 h-4" />
                      Started at {safeFormat(activeSession.started_at, 'hh:mm a')}
                    </div>
                    <div className="font-semibold text-on-surface">
                      {(() => {
                        if (!activeSession.started_at) return 'Duration: —';
                        const started = typeof activeSession.started_at === 'string' ? parseISO(activeSession.started_at) : new Date(activeSession.started_at);
                        if (!isValid(started)) return 'Duration: —';
                        const now = new Date();
                        const elapsedMs = now.getTime() - started.getTime();
                        const elapsedMin = Math.floor(elapsedMs / 60000);
                        const h = Math.floor(elapsedMin / 60);
                        const m = elapsedMin % 60;
                        return `Duration: ${h > 0 ? `${h}h ` : ''}${m}m`;
                      })()}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate(`/sessions/${activeSession.id}`)}
                      className="w-full py-4 bg-primary-container text-on-primary rounded-xl font-bold hover:bg-primary transition-colors text-base flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                    >
                      <Play className="w-5 h-5 fill-current" /> Continue Session
                    </button>
                    <button
                      onClick={() => navigate(`/sessions/${activeSession.id}`)}
                      className="w-full py-4 bg-surface-container-lowest border border-outline-variant text-secondary rounded-xl font-bold hover:bg-surface-container transition-colors text-base"
                    >
                      End Session
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                    <Timer className="w-8 h-8 text-outline" />
                  </div>
                  <h4 className="text-lg font-bold text-on-surface mb-2">No Active Session</h4>
                  <p className="text-secondary text-sm mb-6 max-w-xs mx-auto">You're not currently studying anything. Start a session to track your time and progress.</p>
                  <button
                    onClick={() => navigate('/activities')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-container text-on-primary rounded-xl font-bold hover:bg-primary transition-colors shadow-sm shadow-primary/20"
                  >
                    Start a New Session
                  </button>
                </div>
              )}
            </div>
            
            {activeSession && (
              <div className="border-t border-outline-variant/30 bg-surface-container-lowest/50 p-4 text-center">
                <Link to="/activities" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  View All Sessions <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Row 2: Today's Progress */}
      <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-on-surface mb-6">Today's Progress</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x divide-y sm:divide-y-0 divide-outline-variant/30">
          
          <div className="flex items-center gap-5 pt-4 sm:pt-0 sm:px-4 first:px-0 first:pt-0">
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-on-surface">{formattedStudyTime}</div>
              <div className="text-xs font-semibold text-secondary mt-1 uppercase tracking-wider">Total Study Time</div>
            </div>
          </div>
          
          <div className="flex items-center gap-5 pt-4 sm:pt-0 sm:px-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-on-surface">{todayActivities.length}</div>
              <div className="text-xs font-semibold text-secondary mt-1 uppercase tracking-wider">Learning Logs</div>
            </div>
          </div>
          
          <div className="flex items-center gap-5 pt-4 sm:pt-0 sm:px-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-on-surface">{topicsStudiedToday}</div>
              <div className="text-xs font-semibold text-secondary mt-1 uppercase tracking-wider">Knowledge Units</div>
            </div>
          </div>
          
          <div className="flex items-center gap-5 pt-4 sm:pt-0 sm:px-4">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-on-surface">{revisionsCompletedToday} <span className="text-xl text-secondary/50">/ {totalRevisionsToday}</span></div>
              <div className="text-xs font-semibold text-secondary mt-1 uppercase tracking-wider">Revisions Completed</div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Row 3: Logs and Revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Logs */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-outline-variant/30 bg-surface-container-lowest">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Book className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-on-surface font-display">Today's Learning Logs</h3>
            </div>
            <Link to="/activities" className="text-xs font-semibold bg-surface-container hover:bg-outline-variant/30 text-on-surface px-4 py-2 rounded-lg transition-colors border border-outline-variant/50">
              View All
            </Link>
          </div>
          
          <div className="flex-1 p-6">
            {todayActivities.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="text-4xl mb-3">📘</div>
                <h4 className="text-base font-bold text-on-surface mb-1">No learning logged today.</h4>
                <p className="text-secondary text-sm mb-5">Start your first study session.</p>
                <Link to="/activities" className="text-sm font-bold bg-primary-container text-on-primary px-5 py-2.5 rounded-xl hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
                  <Plus className="w-4 h-4" /> Add Learning Log
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {todayActivities.slice(0, 5).map((activity: any) => (
                  <LearningLogRow key={activity.id} activity={activity} />
                ))}
                
                <div className="pt-4 mt-2 border-t border-dashed border-outline-variant/50">
                  <Link to="/activities" className="text-sm font-bold text-primary hover:underline flex items-center gap-2 justify-center">
                    <Plus className="w-4 h-4" /> Add Learning Log
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Revisions */}
        <section className="rounded-2xl border border-outline-variant bg-orange-50/20 shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-orange-200/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-on-surface font-display">Today's Revisions</h3>
            </div>
            <button onClick={() => navigate('/revisions/session')} className="bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary transition-colors shadow-sm shadow-primary/20">
              Start Revision
            </button>
          </div>
          
          <div className="flex-1 p-6 space-y-4">
            
            <div className="flex items-center justify-between bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer" onClick={() => navigate('/revisions')}>
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-red-50 text-red-500 rounded-lg"><Calendar className="w-5 h-5" /></div>
                <span className="font-semibold text-on-surface text-base">Due Today</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display font-bold text-2xl text-on-surface">{dueTodayRevisions.length}</span>
                <ChevronRight className="w-5 h-5 text-outline" />
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer" onClick={() => navigate('/revisions')}>
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-50 text-amber-500 rounded-lg"><Calendar className="w-5 h-5" /></div>
                <span className="font-semibold text-on-surface text-base">Due Tomorrow</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display font-bold text-2xl text-on-surface">{dueTomorrowRevisions.length}</span>
                <ChevronRight className="w-5 h-5 text-outline" />
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer" onClick={() => navigate('/revisions')}>
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-green-50 text-green-500 rounded-lg"><Calendar className="w-5 h-5" /></div>
                <span className="font-semibold text-on-surface text-base">Upcoming</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display font-bold text-2xl text-on-surface">{restUpcomingRevisions.length}</span>
                <ChevronRight className="w-5 h-5 text-outline" />
              </div>
            </div>

          </div>
          
          <div className="border-t border-orange-200/50 p-4 text-center bg-surface-container-lowest/50">
            <Link to="/revisions" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1">
              View All Revisions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>

      {/* Motivation Card */}
      <section className="rounded-2xl border border-outline-variant bg-[#FFFDF0] p-8 sm:p-10 shadow-sm flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <div className="flex gap-4">
            <span className="text-5xl text-amber-500 font-serif leading-none mt-2">"</span>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-on-surface/90 leading-tight">
                Discipline is the bridge between goals and accomplishment.
              </p>
              <p className="text-sm font-semibold text-secondary mt-4 flex items-center gap-3 uppercase tracking-widest">
                <span className="w-6 h-[2px] bg-secondary/50"></span> Jim Rohn
              </p>
            </div>
          </div>
        </div>
        
        {/* Simple CSS illustration */}
        <div className="hidden md:block absolute right-10 bottom-0 opacity-80 pointer-events-none">
          <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 120L90 60L120 90L190 20L240 120H40Z" fill="#E6DCC3"/>
            <path d="M120 120L150 70L180 100L220 50L240 120H120Z" fill="#D4C4A8"/>
            <circle cx="190" cy="20" r="4" fill="#E86C45"/>
            <path d="M190 20L190 40" stroke="#E86C45" strokeWidth="2"/>
            <path d="M190 20L205 25L190 30" fill="#E86C45"/>
            <circle cx="60" cy="90" r="15" fill="#F4E9CD"/>
            <circle cx="210" cy="70" r="10" fill="#F4E9CD"/>
          </svg>
        </div>
      </section>
    </div>
  );
}
