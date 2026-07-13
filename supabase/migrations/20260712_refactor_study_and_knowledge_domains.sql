-- Migration: Add KnowledgeUnit and move revision scheduling to KnowledgeUnit

-- Add study session reference and end time to learning activities
ALTER TABLE learning_activities
ADD COLUMN learning_session_id UUID REFERENCES learning_sessions(id) ON DELETE SET NULL;

ALTER TABLE learning_activities
ADD COLUMN end_time TIME;

-- Create knowledge units as a separate knowledge management entity
CREATE TABLE knowledge_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES learning_activities(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT,
  what_i_learned TEXT,
  active_recall_questions TEXT[],
  importance TEXT,
  confidence TEXT,
  memory_mode TEXT NOT NULL DEFAULT 'MEMORIZE',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE knowledge_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on knowledge_units" ON knowledge_units FOR ALL USING (true);

CREATE INDEX idx_knowledge_units_project_id ON knowledge_units(project_id);
CREATE INDEX idx_knowledge_units_category_id ON knowledge_units(category_id);
CREATE INDEX idx_knowledge_units_topic_id ON knowledge_units(topic_id);
CREATE INDEX idx_knowledge_units_activity_id ON knowledge_units(activity_id);

-- Add knowledge unit reference to revision schedule and migrate existing revisions
ALTER TABLE revision_schedule
ADD COLUMN knowledge_unit_id UUID;

ALTER TABLE revision_schedule
ADD CONSTRAINT fk_revision_schedule_knowledge_unit FOREIGN KEY (knowledge_unit_id) REFERENCES knowledge_units(id) ON DELETE CASCADE;

CREATE INDEX idx_revision_schedule_knowledge_unit_id ON revision_schedule(knowledge_unit_id);

-- Create default knowledge units for existing study activities
INSERT INTO knowledge_units (activity_id, project_id, category_id, topic_id, memory_mode, created_at, updated_at)
SELECT id, project_id, category_id, topic_id, memory_mode, created_at, updated_at
FROM learning_activities;

-- Update existing revision rows to point to the new knowledge units
UPDATE revision_schedule rs
SET knowledge_unit_id = ku.id
FROM knowledge_units ku
WHERE rs.activity_id = ku.activity_id;

-- Make knowledge_unit_id required once migration has populated existing rows
ALTER TABLE revision_schedule
ALTER COLUMN knowledge_unit_id SET NOT NULL;

-- Remove activity reference from revision schedule and memory_mode from study activity
ALTER TABLE revision_schedule
DROP COLUMN activity_id;

ALTER TABLE learning_activities
DROP COLUMN memory_mode;
