-- ============================================================================
-- Migration: Relax Constraints for Safe Deletion and Add Delete RPC
-- ============================================================================

-- 1. Relax knowledge_units.activity_id constraint
ALTER TABLE public.knowledge_units ALTER COLUMN activity_id DROP NOT NULL;
ALTER TABLE public.knowledge_units DROP CONSTRAINT IF EXISTS knowledge_units_activity_id_fkey;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_units_activity_id_fkey') THEN
        ALTER TABLE public.knowledge_units ADD CONSTRAINT knowledge_units_activity_id_fkey 
            FOREIGN KEY (activity_id) REFERENCES public.learning_activities(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 2. Relax revision_logs.activity_id constraint
ALTER TABLE public.revision_logs ALTER COLUMN activity_id DROP NOT NULL;
ALTER TABLE public.revision_logs DROP CONSTRAINT IF EXISTS revision_logs_activity_id_fkey;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revision_logs_activity_id_fkey') THEN
        ALTER TABLE public.revision_logs ADD CONSTRAINT revision_logs_activity_id_fkey 
            FOREIGN KEY (activity_id) REFERENCES public.learning_activities(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 3. Relax revision_logs.knowledge_unit_id constraint
ALTER TABLE public.revision_logs ALTER COLUMN knowledge_unit_id DROP NOT NULL;
ALTER TABLE public.revision_logs DROP CONSTRAINT IF EXISTS revision_logs_knowledge_unit_id_fkey;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revision_logs_knowledge_unit_id_fkey') THEN
        ALTER TABLE public.revision_logs ADD CONSTRAINT revision_logs_knowledge_unit_id_fkey 
            FOREIGN KEY (knowledge_unit_id) REFERENCES public.knowledge_units(id) ON DELETE SET NULL;
    END IF;
END $$;


-- 4. Create the safe deletion RPC
CREATE OR REPLACE FUNCTION public.delete_learning_log_safe(p_activity_id UUID, p_mode INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mode 1: Delete Learning Log only (KUs remain, Revision history remains)
    IF p_mode = 1 THEN
        -- Simply delete the activity. The ON DELETE SET NULL constraints will orphan the KUs and Logs safely.
        DELETE FROM public.learning_activities WHERE id = p_activity_id;

    -- Mode 2: Delete Learning Log and Knowledge Units (Revision history becomes archived)
    ELSIF p_mode = 2 THEN
        -- Delete KUs directly. This will CASCADE delete revision_schedule, but SET NULL on revision_logs
        DELETE FROM public.knowledge_units WHERE activity_id = p_activity_id;
        
        -- Delete the activity itself
        DELETE FROM public.learning_activities WHERE id = p_activity_id;

    -- Mode 3: Delete everything permanently
    ELSIF p_mode = 3 THEN
        -- Delete revision logs first
        DELETE FROM public.revision_logs WHERE activity_id = p_activity_id;
        
        -- Delete KUs (cascades to schedule)
        DELETE FROM public.knowledge_units WHERE activity_id = p_activity_id;
        
        -- Delete activity
        DELETE FROM public.learning_activities WHERE id = p_activity_id;
    END IF;
END;
$$;

-- Explicitly notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
