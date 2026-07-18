-- Simplify revision tracking to knowledge_units only.
-- This migration is safe to re-run and does not alter existing review dates.

ALTER TABLE public.knowledge_units
  ADD COLUMN IF NOT EXISTS revision_stage INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reviewed_at DATE;

UPDATE public.knowledge_units
SET revision_stage = COALESCE(revision_stage, 0),
    last_reviewed_at = COALESCE(last_reviewed_at, NULL)
WHERE revision_stage IS NULL;

ALTER TABLE public.knowledge_units
  DROP COLUMN IF EXISTS srs_ease_factor,
  DROP COLUMN IF EXISTS srs_interval,
  DROP COLUMN IF EXISTS srs_repetitions;

DROP TABLE IF EXISTS public.revision_logs;
DROP TABLE IF EXISTS public.revision_schedule;

DROP FUNCTION IF EXISTS public.delete_learning_log_safe(UUID, INT);
DROP FUNCTION IF EXISTS public.delete_learning_log_safe(UUID, TEXT);
