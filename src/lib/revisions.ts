import { addDays, format } from 'date-fns';

export const REVISION_INTERVALS = [1, 3, 7, 15, 30, 60, 120] as const;

export function calculateNextReviewDate(stage: number, baseDate: Date = new Date()): Date {
  const intervalDays = REVISION_INTERVALS[Math.min(stage, REVISION_INTERVALS.length - 1)] ?? REVISION_INTERVALS[REVISION_INTERVALS.length - 1];
  return addDays(baseDate, intervalDays);
}

export function createInitialRevisionState(today: string): {
  revision_stage: number;
  next_review_date: string;
  last_reviewed_at: null;
} {
  const tomorrow = format(addDays(new Date(today), 1), 'yyyy-MM-dd');

  return {
    revision_stage: 0,
    next_review_date: tomorrow,
    last_reviewed_at: null,
  };
}
