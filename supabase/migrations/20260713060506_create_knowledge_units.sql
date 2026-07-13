-- ============================================================================
-- Migration: Create Knowledge Units and migrate Revision Schedule
-- Compatible with PostgreSQL 17 / Supabase
-- ============================================================================

-- ============================================================================
-- 1. Create Knowledge Units table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.knowledge_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    activity_id UUID NOT NULL
        REFERENCES public.learning_activities(id)
        ON DELETE CASCADE,

    project_id UUID NOT NULL
        REFERENCES public.projects(id),

    category_id UUID NOT NULL
        REFERENCES public.categories(id),

    topic_id UUID NOT NULL
        REFERENCES public.topics(id),

    title TEXT,

    what_i_learned TEXT,

    active_recall_questions TEXT[] DEFAULT '{}',

    importance TEXT,

    confidence TEXT,

    memory_mode TEXT NOT NULL DEFAULT 'MEMORIZE',

    tags TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.knowledge_units IS
'Stores user knowledge gained from study activities. This table powers revisions, active recall, flashcards and future learning features.';

-- ============================================================================
-- 2. Enable Row Level Security
-- ============================================================================

ALTER TABLE public.knowledge_units
ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Policy
-- ============================================================================

DROP POLICY IF EXISTS "Allow all actions on knowledge_units"
ON public.knowledge_units;

CREATE POLICY "Allow all actions on knowledge_units"
ON public.knowledge_units
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 4. Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_knowledge_units_activity_id
ON public.knowledge_units(activity_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_project_id
ON public.knowledge_units(project_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_category_id
ON public.knowledge_units(category_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_units_topic_id
ON public.knowledge_units(topic_id);

-- ============================================================================
-- 5. Add new column to revision_schedule
-- ============================================================================

ALTER TABLE public.revision_schedule
ADD COLUMN IF NOT EXISTS knowledge_unit_id UUID;

-- ============================================================================
-- 6. Copy Learning Activities into Knowledge Units
-- ============================================================================

INSERT INTO public.knowledge_units (

    activity_id,

    project_id,

    category_id,

    topic_id,

    memory_mode,

    created_at,

    updated_at

)

SELECT

    la.id,

    la.project_id,

    la.category_id,

    la.topic_id,

    COALESCE(la.memory_mode, 'MEMORIZE'),

    la.created_at,

    la.updated_at

FROM public.learning_activities la

WHERE NOT EXISTS (

    SELECT 1

    FROM public.knowledge_units ku

    WHERE ku.activity_id = la.id

);

-- ============================================================================
-- 7. Populate revision_schedule.knowledge_unit_id
-- ============================================================================

DO $$
BEGIN

IF EXISTS (

SELECT 1

FROM information_schema.columns

WHERE table_schema='public'

AND table_name='revision_schedule'

AND column_name='activity_id'

)

THEN

UPDATE public.revision_schedule rs

SET knowledge_unit_id = ku.id

FROM public.knowledge_units ku

WHERE rs.activity_id = ku.activity_id

AND rs.knowledge_unit_id IS NULL;

END IF;

END $$;

-- ============================================================================
-- 8. Verify Migration
-- ============================================================================

DO $$
BEGIN

IF EXISTS (

SELECT 1

FROM information_schema.columns

WHERE table_schema='public'

AND table_name='revision_schedule'

AND column_name='activity_id'

)

THEN

IF EXISTS (

SELECT 1

FROM public.revision_schedule

WHERE activity_id IS NOT NULL

AND knowledge_unit_id IS NULL

)

THEN

RAISE EXCEPTION
'Migration failed. Some revision_schedule rows could not be linked to a Knowledge Unit.';

END IF;

END IF;

END $$;

-- ============================================================================
-- 9. Foreign Key
-- ============================================================================

DO $$
BEGIN

IF NOT EXISTS (

SELECT 1

FROM pg_constraint

WHERE conname = 'fk_revision_schedule_knowledge_unit'

)

THEN

ALTER TABLE public.revision_schedule

ADD CONSTRAINT fk_revision_schedule_knowledge_unit

FOREIGN KEY (knowledge_unit_id)

REFERENCES public.knowledge_units(id)

ON DELETE CASCADE;

END IF;

END $$;

-- ============================================================================
-- 10. Index
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_revision_schedule_knowledge_unit_id

ON public.revision_schedule(knowledge_unit_id);

-- ============================================================================
-- 11. Make column mandatory
-- ============================================================================

ALTER TABLE public.revision_schedule

ALTER COLUMN knowledge_unit_id SET NOT NULL;

-- ============================================================================
-- 12. Remove legacy column
-- ============================================================================

ALTER TABLE public.revision_schedule

DROP COLUMN IF EXISTS activity_id;

-- ============================================================================
-- End Migration
-- ============================================================================