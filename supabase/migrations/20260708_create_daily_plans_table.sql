-- Migration: create_daily_plans_table.sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  memory_mode TEXT NOT NULL DEFAULT 'MEMORIZE',
  activity_type TEXT NOT NULL DEFAULT 'Study',
  estimated_duration_minutes INTEGER NOT NULL CHECK (estimated_duration_minutes > 0),
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions on daily_plans" ON public.daily_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON public.daily_plans(date);
CREATE INDEX IF NOT EXISTS idx_daily_plans_project_id ON public.daily_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_topic_id ON public.daily_plans(topic_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_status ON public.daily_plans(status);

COMMIT;
