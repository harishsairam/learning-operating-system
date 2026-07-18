import React, { useState } from 'react';
import { useDeleteActivity } from '../../hooks/useActivities';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { LearningActivity } from '../../types';

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
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen || !activity) return null;

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    
    try {
      await deleteActivity.mutateAsync({ id: activity.id });
      onClose();
      // Reset state on successful delete
      setConfirmText('');
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-scrim/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-elevation-3 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/50">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="font-display text-xl font-bold">Delete Learning Activity</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <p className="text-on-surface">
              You are about to <strong>permanently delete</strong> the learning log for <strong>{activity.study_date}</strong>.
            </p>
            <div className="p-4 bg-error-container/10 border border-error/20 rounded-xl space-y-2">
              <p className="text-sm font-semibold text-error">This action will permanently remove:</p>
              <ul className="text-sm text-on-surface-variant space-y-1 ml-4 list-disc">
                <li>The learning activity record</li>
                <li>All associated Knowledge Units</li>
                <li>All revision logs and performance history</li>
                <li>All scheduled revision data</li>
              </ul>
            </div>
            <p className="text-sm text-on-surface-variant">
              This cannot be undone. Please proceed with caution.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-error">
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
        </div>

        <div className="p-6 bg-surface-container-low flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={handleClose}
            disabled={deleteActivity.isPending}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteActivity.isPending || confirmText !== 'DELETE'}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-on-error bg-error hover:bg-error/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {deleteActivity.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
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
