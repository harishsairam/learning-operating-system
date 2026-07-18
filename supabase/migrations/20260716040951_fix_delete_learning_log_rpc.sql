-- ============================================================================
-- Migration: Fix RPC signature for delete_learning_log_safe
-- ============================================================================

-- Function signature matching integer mode
CREATE OR REPLACE FUNCTION public.delete_learning_log_safe(p_activity_id UUID, p_mode INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mode 1: Delete Learning Log only (KUs remain, Revision history remains)
    IF p_mode = 1 THEN
        DELETE FROM public.learning_activities WHERE id = p_activity_id;

    -- Mode 2: Delete Learning Log and Knowledge Units (Revision history becomes archived)
    ELSIF p_mode = 2 THEN
        DELETE FROM public.knowledge_units WHERE activity_id = p_activity_id;
        DELETE FROM public.learning_activities WHERE id = p_activity_id;

    -- Mode 3: Delete everything permanently
    ELSIF p_mode = 3 THEN
        DELETE FROM public.revision_logs WHERE activity_id = p_activity_id;
        DELETE FROM public.knowledge_units WHERE activity_id = p_activity_id;
        DELETE FROM public.learning_activities WHERE id = p_activity_id;
    END IF;
END;
$$;

-- Overloaded function signature matching text mode to guarantee PostgREST resolves the call
CREATE OR REPLACE FUNCTION public.delete_learning_log_safe(p_activity_id UUID, p_mode TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Cast the text mode to integer and call the primary function
    PERFORM public.delete_learning_log_safe(p_activity_id, p_mode::INT);
END;
$$;

-- Explicitly notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
