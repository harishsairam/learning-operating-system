import { describe, expect, it } from 'vitest';
import { REVISION_INTERVALS, calculateNextReviewDate, createInitialRevisionState } from './revisions';

describe('revision scheduling', () => {
  it('uses the fixed intervals for each stage', () => {
    const baseDate = new Date('2026-07-18T00:00:00.000Z');

    expect(REVISION_INTERVALS).toEqual([1, 3, 7, 15, 30, 60, 120]);
    expect(calculateNextReviewDate(0, baseDate)).toEqual(new Date('2026-07-19T00:00:00.000Z'));
    expect(calculateNextReviewDate(1, baseDate)).toEqual(new Date('2026-07-21T00:00:00.000Z'));
    expect(calculateNextReviewDate(6, baseDate)).toEqual(new Date('2026-11-15T00:00:00.000Z'));
  });

  it('creates the default state for a new knowledge unit', () => {
    const state = createInitialRevisionState('2026-07-18');

    expect(state).toEqual({
      revision_stage: 0,
      next_review_date: '2026-07-19',
      last_reviewed_at: null,
    });
  });
});
