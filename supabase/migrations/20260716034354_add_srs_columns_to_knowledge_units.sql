-- Migration to add SRS tracking columns to knowledge_units

ALTER TABLE public.knowledge_units
ADD COLUMN IF NOT EXISTS srs_ease_factor numeric DEFAULT 2.5 NOT NULL,
ADD COLUMN IF NOT EXISTS srs_interval integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS srs_repetitions integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS next_review_date date;

-- Explicitly notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
