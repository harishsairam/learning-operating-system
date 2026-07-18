import { addDays, format } from 'date-fns';

export interface SRSData {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
}

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm
 * 
 * Quality (q):
 * 5 - perfect response
 * 4 - correct response after a hesitation
 * 3 - correct response recalled with serious difficulty
 * 2 - incorrect response; where the correct one seemed easy to recall
 * 1 - incorrect response; the correct one remembered
 * 0 - complete blackout
 */
export function calculateNextReview(
  quality: number,
  previousEase: number,
  previousInterval: number,
  previousRepetitions: number
): SRSData {
  let easeFactor = previousEase;
  let interval = previousInterval;
  let repetitions = previousRepetitions;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response
    repetitions = 0;
    interval = 1;
  }

  // Calculate new ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Ease factor shouldn't fall below 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const nextReviewDate = addDays(new Date(), interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: format(nextReviewDate, 'yyyy-MM-dd'),
  };
}

/**
 * Converts simple user feedback to SM-2 quality score
 * Easy: 5
 * Good: 4
 * Hard: 3
 * Again (Fail): 1
 */
export function statusToQuality(status: 'Easy' | 'Good' | 'Hard' | 'Again'): number {
  switch (status) {
    case 'Easy': return 5;
    case 'Good': return 4;
    case 'Hard': return 3;
    case 'Again': return 1;
    default: return 4;
  }
}
