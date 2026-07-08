import React from 'react';
import type { LearningSessionWithRelations } from '../../types';

interface SessionRecoveryModalProps {
  session: LearningSessionWithRelations | null;
  onResume: (sessionId: string) => void;
  onFinish: (sessionId: string) => void;
  onDiscard: (sessionId: string) => void;
  isLoading?: boolean;
}

export function SessionRecoveryModal({
  session,
  onResume,
  onFinish,
  onDiscard,
  isLoading = false,
}: SessionRecoveryModalProps) {
  if (!session) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsedSeconds = Math.floor(
    (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
  ) - (session.paused_duration_minutes * 60);

  const remainingSeconds = Math.max(0, session.planned_duration_minutes * 60 - elapsedSeconds);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg">
        <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Resume Previous Session?</h2>
        <p className="text-secondary mb-6">You have an active learning session in progress.</p>

        {/* Session Details */}
        <div className="bg-surface-container border border-outline-variant/50 rounded-lg p-4 mb-6 space-y-3">
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-secondary mb-1">
              Topic
            </div>
            <h3 className="text-lg font-bold text-on-surface">{session.topics?.name || 'Unknown'}</h3>
          </div>

          <div className="flex items-center gap-4 py-3 border-t border-outline-variant/50">
            <div className="flex-1">
              <div className="text-xs text-secondary mb-1">Elapsed Time</div>
              <div className="text-lg font-semibold text-on-surface">{formatTime(elapsedSeconds)}</div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-secondary mb-1">Remaining</div>
              <div className="text-lg font-semibold text-on-surface">{formatTime(remainingSeconds)}</div>
            </div>
          </div>

          {session.status === 'PAUSED' && (
            <div className="text-xs font-semibold text-orange-600 bg-orange-500/10 px-3 py-2 rounded">
              ⏸ Session is currently paused
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => onResume(session.id)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold hover:bg-primary disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Resume Session'}
          </button>

          <button
            onClick={() => onFinish(session.id)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-semibold hover:bg-outline-variant/30 disabled:opacity-50 transition-colors"
          >
            Finish & Save
          </button>

          <button
            onClick={() => onDiscard(session.id)}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-surface-container border border-outline-variant/50 text-secondary rounded-lg font-semibold hover:bg-outline-variant/10 disabled:opacity-50 transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
