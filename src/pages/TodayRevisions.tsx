import React, { useState } from 'react';
import { useTodayRevisions, useCompleteRevision, useSkipRevision, useRescheduleRevision } from '../hooks/useRevisions';
import { CheckCircle2, History, Calendar, XCircle, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function TodayRevisions() {
  const { data: revisions, isLoading } = useTodayRevisions();
  const completeRevision = useCompleteRevision();
  const skipRevision = useSkipRevision();
  const rescheduleRevision = useRescheduleRevision();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'complete'|'reschedule'|null>(null);
  
  const [timeSpent, setTimeSpent] = useState('10');
  const [completionStatus, setCompletionStatus] = useState('Good');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  if (isLoading) {
    return <div className="animate-pulse">Loading revisions...</div>;
  }

  const totalCount = revisions?.length || 0;

  const handleComplete = (id: string) => {
    completeRevision.mutate({ id, status: completionStatus, timeSpent: parseInt(timeSpent, 10) }, {
      onSuccess: () => setActiveId(null)
    });
  };

  const handleSkip = (id: string) => {
    skipRevision.mutate(id, {
      onSuccess: () => setActiveId(null)
    });
  };

  const handleReschedule = (id: string) => {
    rescheduleRevision.mutate({ id, newDate }, {
      onSuccess: () => setActiveId(null)
    });
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface mb-2 tracking-tight">Today's Revisions</h2>
          <p className="text-lg text-secondary max-w-xl">
            Mastery requires consistency. You have {totalCount} items remaining in your daily queue.
          </p>
        </div>
      </header>

      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {revisions?.length === 0 ? (
            <div className="col-span-full rounded-xl border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-12 w-12 text-secondary/50" />
              <h3 className="mt-4 text-sm font-semibold text-on-surface">All caught up!</h3>
              <p className="mt-1 text-sm text-secondary">You have completed all your revisions for today.</p>
            </div>
          ) : (
            revisions?.map((revision: any) => {
              const isActioning = activeId === revision.id;
              
              return (
              <article key={revision.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col h-full anti-gravity-hover group relative overflow-hidden transition-all">
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                    <span className="text-xs font-semibold text-secondary">Rev #{revision.revision_number}</span>
                  </div>
                  <span className="text-xs font-semibold text-secondary">{revision.knowledge_units?.topics?.categories?.name}</span>
                </div>
                
                <h4 className="font-display text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors relative z-10">
                  {revision.knowledge_units?.topics?.name}
                </h4>
                
                <p className="text-sm text-secondary mb-8 line-clamp-2 relative z-10">
                  {revision.knowledge_units?.topics?.categories?.projects?.name}
                </p>
                
                {isActioning ? (
                  <div className="mt-auto border-t border-outline-variant/50 pt-4 relative z-10 space-y-4">
                    {actionType === 'complete' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-secondary mb-1 block">Time Spent (min)</label>
                          <input type="number" value={timeSpent} onChange={e => setTimeSpent(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-secondary mb-1 block">Status</label>
                          <select value={completionStatus} onChange={e => setCompletionStatus(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-sm">
                            <option value="Easy">Easy</option>
                            <option value="Good">Good</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setActiveId(null)} className="flex-1 text-xs border border-outline-variant py-1.5 rounded">Cancel</button>
                          <button onClick={() => handleComplete(revision.id)} className="flex-1 text-xs bg-primary-container text-on-primary py-1.5 rounded">Save</button>
                        </div>
                      </div>
                    )}
                    {actionType === 'reschedule' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-secondary mb-1 block">New Date</label>
                          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded px-2 py-1 text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setActiveId(null)} className="flex-1 text-xs border border-outline-variant py-1.5 rounded">Cancel</button>
                          <button onClick={() => handleReschedule(revision.id)} className="flex-1 text-xs bg-primary-container text-on-primary py-1.5 rounded">Save</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-auto flex flex-col gap-3 border-t border-outline-variant/50 pt-4 relative z-10">
                    <div className="flex items-center gap-2 text-secondary mb-1">
                      <History className="h-4 w-4" />
                      <span className="text-xs">Due: {format(new Date(revision.revision_date), 'MMM d')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setActiveId(revision.id); setActionType('complete'); }}
                        className="flex-1 text-primary-container text-xs font-semibold hover:bg-surface-container-lowest py-2 rounded-lg transition-colors border border-outline-variant flex items-center justify-center gap-1"
                      >
                        <Check className="h-3 w-3" /> Done
                      </button>
                      <button
                        onClick={() => { setActiveId(revision.id); setActionType('reschedule'); }}
                        className="flex-1 text-secondary text-xs font-semibold hover:bg-surface-container-lowest py-2 rounded-lg transition-colors border border-outline-variant flex items-center justify-center gap-1"
                      >
                        <Calendar className="h-3 w-3" /> Delay
                      </button>
                      <button
                        onClick={() => handleSkip(revision.id)}
                        className="flex-1 text-secondary text-xs font-semibold hover:bg-surface-container-lowest py-2 rounded-lg transition-colors border border-outline-variant flex items-center justify-center gap-1"
                      >
                        <XCircle className="h-3 w-3" /> Skip
                      </button>
                    </div>
                  </div>
                )}
              </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
