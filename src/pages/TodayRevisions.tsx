import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDueRevisions, useRevisionStats } from '../hooks/useRevisions';
import { CheckCircle2, History, PlayCircle, Flame, Calendar, Clock, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function TodayRevisions() {
  const navigate = useNavigate();
  const { data: revisions, isLoading: isLoadingRevisions } = useDueRevisions();
  const { data: stats, isLoading: isLoadingStats } = useRevisionStats();

  if (isLoadingRevisions || isLoadingStats) {
    return <div className="animate-pulse">Loading revisions...</div>;
  }

  const totalCount = revisions?.length || 0;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface mb-2 tracking-tight">Today's Revisions</h2>
          <p className="text-lg text-secondary max-w-xl">
            Mastery requires consistency. You have {totalCount} items due for review.
          </p>
        </div>
        {totalCount > 0 && (
          <button 
            onClick={() => navigate('/revisions/session')}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold text-lg hover:bg-primary-fixed-dim transition-colors shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlayCircle className="w-6 h-6" /> Start Today's Revision
          </button>
        )}
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex flex-col justify-center shadow-sm">
          <div className="text-secondary flex items-center gap-2 mb-2"><Calendar className="w-4 h-4"/> <span className="text-xs font-bold uppercase tracking-wider">Today's Due</span></div>
          <div className="text-3xl font-display font-bold text-on-surface">{stats?.dueToday || 0}</div>
        </div>
        <div className="bg-surface-container-lowest border border-error/30 p-4 rounded-xl flex flex-col justify-center shadow-sm">
          <div className="text-error flex items-center gap-2 mb-2"><Clock className="w-4 h-4"/> <span className="text-xs font-bold uppercase tracking-wider">Overdue</span></div>
          <div className="text-3xl font-display font-bold text-error">{stats?.overdue || 0}</div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex flex-col justify-center shadow-sm">
          <div className="text-secondary flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 opacity-50"/> <span className="text-xs font-bold uppercase tracking-wider">Upcoming</span></div>
          <div className="text-3xl font-display font-bold text-on-surface">{stats?.upcoming || 0}</div>
        </div>
        <div className="bg-surface-container-lowest border border-primary/30 p-4 rounded-xl flex flex-col justify-center shadow-sm">
          <div className="text-primary flex items-center gap-2 mb-2"><CheckSquare className="w-4 h-4"/> <span className="text-xs font-bold uppercase tracking-wider">Completed Today</span></div>
          <div className="text-3xl font-display font-bold text-primary">{stats?.completedToday || 0}</div>
        </div>
        <div className="bg-surface-container-lowest border border-orange-200 dark:border-orange-900/30 p-4 rounded-xl flex flex-col justify-center shadow-sm col-span-2 md:col-span-1">
          <div className="text-orange-600 dark:text-orange-400 flex items-center gap-2 mb-2"><Flame className="w-4 h-4"/> <span className="text-xs font-bold uppercase tracking-wider">Streak</span></div>
          <div className="text-3xl font-display font-bold text-orange-600 dark:text-orange-400">{stats?.streak || 0} <span className="text-sm font-normal">days</span></div>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-bold font-display text-on-surface border-b border-outline-variant/50 pb-4">Due & Overdue Queue</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {totalCount === 0 ? (
            <div className="col-span-full rounded-xl border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-12 w-12 text-secondary/50" />
              <h3 className="mt-4 text-sm font-semibold text-on-surface">All caught up!</h3>
              <p className="mt-1 text-sm text-secondary">You have completed all your revisions for today.</p>
            </div>
          ) : (
            revisions?.map((unit: any) => {
              const isOverdue = new Date(unit.next_review_date) < new Date(new Date().setHours(0,0,0,0));
              return (
              <article key={unit.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col h-full anti-gravity-hover group relative overflow-hidden transition-all">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                    <span className="text-xs font-semibold text-secondary">Rev #{unit.srs_repetitions}</span>
                  </div>
                  <span className="text-xs font-semibold text-secondary">{unit.topics?.categories?.name}</span>
                </div>
                
                <h4 className="font-display text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors relative z-10">
                  {unit.title || unit.topics?.name}
                </h4>
                
                <p className="text-sm text-secondary mb-8 line-clamp-2 relative z-10">
                  {unit.topics?.categories?.projects?.name}
                </p>
                
                <div className="mt-auto flex flex-col gap-3 border-t border-outline-variant/50 pt-4 relative z-10">
                  <div className={`flex items-center gap-2 ${isOverdue ? 'text-error font-bold' : 'text-secondary'} mb-1`}>
                    <History className="h-4 w-4" />
                    <span className="text-xs">Due: {format(new Date(unit.next_review_date), 'MMM d')} {isOverdue && '(Overdue)'}</span>
                  </div>
                </div>
              </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
