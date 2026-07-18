import React, { useState, useEffect } from 'react';
import { useDeleteActivity } from '../../hooks/useActivities';
import { AlertTriangle, Trash2, X, Archive, History, Loader2 } from 'lucide-react';
import type { LearningActivity } from '../../types';
import { supabase } from '../../lib/supabase';

interface DeleteActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity: LearningActivity | null;
}

export function DeleteActivityDialog({
  isOpen,
  onClose,
  activity
}: DeleteActivityDialogProps) {
  const deleteActivity = useDeleteActivity();
  const [deleteMode, setDeleteMode] = useState<1 | 2 | 3>(1);
  const [confirmText, setConfirmText] = useState('');
  const [knowledgeUnitCount, setKnowledgeUnitCount] = useState<number | null>(null);
  const [isFetchingCount, setIsFetchingCount] = useState(false);

  useEffect(() => {
    if (isOpen && activity) {
      setIsFetchingCount(true);
      supabase
        .from('knowledge_units')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', activity.id)
        .then(({ count, error }) => {
          if (!error) setKnowledgeUnitCount(count || 0);
          setIsFetchingCount(false);
        });
    } else {
      setKnowledgeUnitCount(null);
      setDeleteMode(1);
      setConfirmText('');
    }
  }, [isOpen, activity]);

  if (!isOpen || !activity) return null;

  const handleDelete = async () => {
    if (deleteMode === 3 && confirmText !== 'DELETE') return;
    
    try {
      await deleteActivity.mutateAsync({ id: activity.id, mode: deleteMode });
      onClose();
      // Reset state on successful delete
      setDeleteMode(1);
      setConfirmText('');
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-scrim/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-elevation-3 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/50">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="font-display text-xl font-bold">Delete Learning Log</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-on-surface">
            You are about to delete the learning log for <strong>{activity.study_date}</strong>. 
            {isFetchingCount ? (
              <span className="flex items-center gap-2 mt-2 font-medium text-secondary">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching linked data...
              </span>
            ) : knowledgeUnitCount !== null && knowledgeUnitCount > 0 ? (
              <span className="block mt-2 font-medium text-error">
                This log generated {knowledgeUnitCount} Knowledge Unit(s) in your Revision System.
              </span>
            ) : null}
          </p>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-on-surface-variant uppercase tracking-wider mb-4">Choose Deletion Mode</h3>
            
            {/* Mode 1 */}
            <label className={`flex gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              deleteMode === 1 ? 'border-primary bg-primary-container/10' : 'border-outline-variant/50 hover:bg-surface-container-low'
            }`}>
              <div className="pt-1">
                <input 
                  type="radio" 
                  name="deleteMode" 
                  checked={deleteMode === 1}
                  onChange={() => setDeleteMode(1)}
                  className="w-4 h-4 text-primary focus:ring-primary" 
                />
              </div>
              <div>
                <div className="font-semibold text-on-surface flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  Delete Log Only
                </div>
                <p className="text-sm text-on-surface-variant mt-1">
                  Removes this activity from your timeline, but <strong>keeps</strong> the Knowledge Units and active revisions intact.
                </p>
              </div>
            </label>

            {/* Mode 2 */}
            <label className={`flex gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              deleteMode === 2 ? 'border-primary bg-primary-container/10' : 'border-outline-variant/50 hover:bg-surface-container-low'
            }`}>
              <div className="pt-1">
                <input 
                  type="radio" 
                  name="deleteMode" 
                  checked={deleteMode === 2}
                  onChange={() => setDeleteMode(2)}
                  className="w-4 h-4 text-primary focus:ring-primary" 
                />
              </div>
              <div>
                <div className="font-semibold text-on-surface flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Delete Log & Knowledge Units
                </div>
                <p className="text-sm text-on-surface-variant mt-1">
                  Removes the activity and its active Knowledge Units. Past revision performance history will be <strong>archived</strong>.
                </p>
              </div>
            </label>

            {/* Mode 3 */}
            <label className={`flex gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
              deleteMode === 3 ? 'border-error bg-error-container/20' : 'border-outline-variant/50 hover:bg-surface-container-low'
            }`}>
              <div className="pt-1">
                <input 
                  type="radio" 
                  name="deleteMode" 
                  checked={deleteMode === 3}
                  onChange={() => setDeleteMode(3)}
                  className="w-4 h-4 text-error focus:ring-error" 
                />
              </div>
              <div>
                <div className="font-semibold text-error flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Permanent Delete (Everything)
                </div>
                <p className="text-sm text-on-surface-variant mt-1">
                  Wipes the activity, Knowledge Units, scheduled revisions, and all past performance history permanently.
                </p>
              </div>
            </label>
          </div>

          {deleteMode === 3 && (
            <div className="mt-4 p-4 bg-error-container/10 border border-error/20 rounded-xl animate-in slide-in-from-top-2">
              <label className="block text-sm font-semibold text-error mb-2">
                Type DELETE to confirm permanent removal
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-surface-container-lowest border border-error/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-error transition-all"
              />
            </div>
          )}
        </div>

        <div className="p-6 bg-surface-container-low flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteActivity.isPending || (deleteMode === 3 && confirmText !== 'DELETE')}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-on-error bg-error hover:bg-error/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {deleteActivity.isPending ? (
              'Deleting...'
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
