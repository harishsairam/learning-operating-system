import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, usePauseSession, useResumeSession, useCompleteSession, useExtendSession } from '../hooks/useSessions';
import { Pause, Play, Check, X } from 'lucide-react';
import type { LearningSession } from '../types';

export default function Sessions() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  if (!sessionId) {
    navigate('/activities');
    return null;
  }

  const { data: session, isLoading } = useSession(sessionId);
  const pauseMutation = usePauseSession();
  const resumeMutation = useResumeSession();
  const completeMutation = useCompleteSession();
  const extendMutation = useExtendSession();

  // Timer and elapsed time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);

  // Summary form
  const [showSummary, setShowSummary] = useState(false);
  const [reflection, setReflection] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize timer and track elapsed time
  useEffect(() => {
    if (!session) return;

    const calculateElapsed = () => {
      const started = new Date(session.started_at);
      const now = new Date();
      const totalElapsedMs = now.getTime() - started.getTime();
      const totalElapsedMinutes = Math.floor(totalElapsedMs / 60000);
      const focusedMinutes = Math.max(0, totalElapsedMinutes - session.paused_duration_minutes);
      const elapsedSecs = Math.floor((totalElapsedMs / 1000) % 60);

      // Check if we've exceeded planned duration
      if (session.status === 'ACTIVE' && totalElapsedMinutes >= session.planned_duration_minutes && !showExtendModal) {
        setShowExtendModal(true);
      }

      return focusedMinutes * 60 + elapsedSecs;
    };

    setElapsedSeconds(calculateElapsed());

    if (session.status === 'ACTIVE') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(calculateElapsed());
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, showExtendModal]);

  const handlePause = async () => {
    if (!session) return;
    await pauseMutation.mutateAsync(session.id);
  };

  const handleResume = async () => {
    if (!session) return;
    await resumeMutation.mutateAsync(session.id);
  };

  const handleFinish = () => {
    if (session?.status === 'ACTIVE') {
      handlePause();
    }
    setShowSummary(true);
  };

  const handleCancel = async () => {
    if (!session) return;
    if (window.confirm('Cancel session? You can resume it later.')) {
      await completeMutation.mutateAsync({ sessionId: session.id });
      navigate('/activities');
    }
  };

  const handleSaveSummary = async () => {
    if (!session) return;
    try {
      await completeMutation.mutateAsync({
        sessionId: session.id,
        reflection: reflection.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      navigate('/sessions/summary', { state: { sessionId: session.id } });
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleExtend = async (additionalMinutes: number) => {
    if (!session) return;
    await extendMutation.mutateAsync({
      sessionId: session.id,
      additionalMinutes,
    });
    setShowExtendModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-container mx-auto mb-4" />
          <p className="text-secondary">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-secondary mb-4">Session not found</p>
          <button
            onClick={() => navigate('/activities')}
            className="px-4 py-2 bg-primary-container text-on-primary-container rounded-lg hover:bg-primary"
          >
            Back to Activities
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = Math.max(0, session.planned_duration_minutes * 60 - elapsedSeconds);
  const completionPercentage = Math.min(100, Math.round((elapsedSeconds / (session.planned_duration_minutes * 60)) * 100));

  // Extension Modal
  if (showExtendModal && !showSummary) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 max-w-md w-full mx-4">
          <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Session Complete</h2>
          <p className="text-secondary mb-6">Continue learning?</p>
          <div className="space-y-3">
            <button
              onClick={() => setShowSummary(true)}
              className="w-full px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold hover:bg-primary transition-colors"
            >
              Finish Session
            </button>
            <button
              onClick={() => handleExtend(15)}
              className="w-full px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-semibold hover:bg-outline-variant/30 transition-colors"
            >
              Extend 15 minutes
            </button>
            <button
              onClick={() => handleExtend(30)}
              className="w-full px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-semibold hover:bg-outline-variant/30 transition-colors"
            >
              Extend 30 minutes
            </button>
            <button
              onClick={() => handleExtend(60)}
              className="w-full px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-semibold hover:bg-outline-variant/30 transition-colors"
            >
              Extend 60 minutes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Summary Modal
  if (showSummary) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h2 className="font-display text-2xl font-bold text-on-surface mb-6">Session Summary</h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
              <span className="text-secondary">Planned Time</span>
              <span className="font-semibold text-on-surface">{session.planned_duration_minutes} min</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
              <span className="text-secondary">Focused Time</span>
              <span className="font-semibold text-on-surface">{Math.floor(elapsedSeconds / 60)} min</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
              <span className="text-secondary">Paused Time</span>
              <span className="font-semibold text-on-surface">{session.paused_duration_minutes} min</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
              <span className="text-secondary">Completion</span>
              <span className="font-semibold text-on-surface">{completionPercentage}%</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-secondary">Memory Mode</span>
              <span className="font-semibold text-on-surface">{session.memory_mode}</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Reflection (Optional)
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="How did you feel about this session? What did you learn?"
                className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes or resources to remember?"
                className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveSummary}
              disabled={completeMutation.isPending}
              className="flex-1 px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold hover:bg-primary disabled:opacity-50 transition-colors"
            >
              {completeMutation.isPending ? 'Saving...' : 'Save Session'}
            </button>
            <button
              onClick={() => setShowSummary(false)}
              className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-semibold hover:bg-outline-variant/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Session Display
  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-[11px] font-bold tracking-wider uppercase text-secondary mb-2">
            {session.projects?.name || 'Project'} • {session.categories?.name || 'Category'}
          </div>
          <h1 className="font-display text-4xl font-bold text-on-surface mb-3">
            {session.topics?.name || 'Topic'}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="px-3 py-1 bg-primary-container/20 text-primary-container rounded-full text-xs font-semibold">
              {session.memory_mode}
            </span>
            <span className="px-3 py-1 bg-surface-container-high text-secondary rounded-full text-xs font-semibold">
              {session.activity_type}
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-12">
          <div className="text-7xl font-bold font-mono text-on-surface mb-4">
            {formatTime(elapsedSeconds)}
          </div>
          <div className="text-xl text-secondary mb-2">
            {formatTime(remainingSeconds)} remaining
          </div>
          <div className="w-full bg-outline-variant/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-container h-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-xs text-secondary mt-2">{completionPercentage}% Complete</div>
        </div>

        {/* Status */}
        <div className="text-center mb-12">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              session.status === 'ACTIVE'
                ? 'bg-green-500/20 text-green-700'
                : session.status === 'PAUSED'
                ? 'bg-orange-500/20 text-orange-700'
                : ''
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${session.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
            {session.status === 'ACTIVE' ? 'FOCUSING' : 'PAUSED'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-8">
          {session.status === 'ACTIVE' ? (
            <button
              onClick={handlePause}
              disabled={pauseMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-surface-container-high text-on-surface rounded-lg font-semibold hover:bg-outline-variant/30 disabled:opacity-50 transition-colors"
            >
              <Pause className="w-5 h-5" />
              Pause
            </button>
          ) : (
            <button
              onClick={handleResume}
              disabled={resumeMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-surface-container-high text-on-surface rounded-lg font-semibold hover:bg-outline-variant/30 disabled:opacity-50 transition-colors"
            >
              <Play className="w-5 h-5" />
              Resume
            </button>
          )}

          <button
            onClick={handleFinish}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary-container text-on-primary-container rounded-lg font-semibold hover:bg-primary disabled:opacity-50 transition-colors"
          >
            <Check className="w-5 h-5" />
            Finish
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-surface-container border border-outline-variant/50 text-secondary rounded-lg font-semibold hover:bg-outline-variant/10 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel Session
        </button>
      </div>
    </div>
  );
}
