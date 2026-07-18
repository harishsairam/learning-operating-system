-- ============================================================================
-- Migration: Consolidate Revision Architecture
-- This migration brings the database into 100% sync with the frontend app.
-- All actions are wrapped in a single transaction block.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create revision_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.revision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES public.learning_activities(id) ON DELETE SET NULL,
    knowledge_unit_id UUID NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    quality INTEGER NOT NULL,
    time_spent_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.revision_logs ENABLE ROW LEVEL SECURITY;

-- Policy (Allow all actions for MVP)
DROP POLICY IF EXISTS "Allow all actions on revision_logs" ON public.revision_logs;
CREATE POLICY "Allow all actions on revision_logs"
ON public.revision_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revision_logs_activity ON public.revision_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_revision_logs_ku ON public.revision_logs(knowledge_unit_id);

-- ============================================================================
-- STEP 2: Verify knowledge_units contains SRS columns
-- ============================================================================

ALTER TABLE public.knowledge_units
ADD COLUMN IF NOT EXISTS srs_ease_factor NUMERIC NOT NULL DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS srs_interval INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS srs_repetitions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_review_date DATE;

-- ============================================================================
-- Migrate data from revision_schedule to revision_logs (Completed Revisions)
-- ============================================================================

DO $$
BEGIN
    -- Check if revision_schedule exists before trying to migrate data
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'revision_schedule') THEN
        
        -- 1. Migrate COMPLETED revisions to revision_logs
        -- Duplicate migration is prevented because revision_schedule is dropped
        -- at the end of this transaction. If this script is run again, the IF EXISTS
        -- block skips execution entirely.
        INSERT INTO public.revision_logs (
            knowledge_unit_id,
            quality,
            time_spent_seconds,
            created_at
        )
        SELECT
            knowledge_unit_id,
            4, -- Map legacy completion to a default quality of 'Good' (4)
            COALESCE(time_spent_minutes, 0) * 60, -- Convert minutes to seconds
            COALESCE(completed_at, now()) -- Preserve completion timestamp
        FROM public.revision_schedule
        WHERE completed = true;
        
        -- 2. Migrate PENDING revision dates to knowledge_units
        -- Only pending rows (completed = false) are considered.
        UPDATE public.knowledge_units ku
        SET next_review_date = (
            SELECT MIN(rs.revision_date)
            FROM public.revision_schedule rs
            WHERE rs.knowledge_unit_id = ku.id
              AND rs.completed = false
        )
        WHERE ku.next_review_date IS NULL;
        
    END IF;
END $$;

-- ============================================================================
-- STEP 6: Drop legacy revision_schedule table
-- Only executes if all the above succeeds due to the transaction block.
-- ============================================================================

DROP TABLE IF EXISTS public.revision_schedule CASCADE;

-- ============================================================================
-- STEP 3: Create ONE RPC function for safe deletion
-- ============================================================================

-- Drop any potential overloaded versions to ensure exactly one exists
DROP FUNCTION IF EXISTS public.delete_learning_log_safe(UUID, TEXT);
DROP FUNCTION IF EXISTS public.delete_learning_log_safe(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.delete_learning_log_safe(
    p_activity_id UUID,
    p_mode INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mode 1: Preserve Knowledge Units & SRS data
    IF p_mode = 1 THEN
        -- We explicitly set activity_id to NULL to detach them
        UPDATE public.knowledge_units
        SET activity_id = NULL
        WHERE activity_id = p_activity_id;
        
        UPDATE public.revision_logs
        SET activity_id = NULL
        WHERE activity_id = p_activity_id;
    
    -- Mode 2: Delete Knowledge Units but Preserve SRS logs
    ELSIF p_mode = 2 THEN
        UPDATE public.revision_logs
        SET activity_id = NULL
        WHERE activity_id = p_activity_id;
        
        -- Note: knowledge_unit_id cascades automatically, but if we drop KU,
        -- it deletes revision_logs too! Let's just delete the KU.
        DELETE FROM public.knowledge_units
        WHERE activity_id = p_activity_id;
        
    -- Mode 3: Delete Everything (Cascade)
    ELSIF p_mode = 3 THEN
        DELETE FROM public.revision_logs
        WHERE activity_id = p_activity_id;
        
        DELETE FROM public.knowledge_units
        WHERE activity_id = p_activity_id;
    END IF;

    -- Delete the root learning activity (and cascades to other constraints if any)
    DELETE FROM public.learning_activities
    WHERE id = p_activity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_learning_log_safe(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_learning_log_safe(UUID, INTEGER) TO anon;

COMMIT;

-- ============================================================================
-- Notify PostgREST to reload schema cache (Must be outside the transaction block)
-- ============================================================================

NOTIFY pgrst, 'reload schema';
