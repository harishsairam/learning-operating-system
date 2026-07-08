-- Create learning_sessions table
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context (from user selection)
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  memory_mode TEXT NOT NULL DEFAULT 'MEMORIZE',
  activity_type TEXT NOT NULL DEFAULT 'Study',
  
  -- Timing (in minutes)
  planned_duration_minutes INTEGER NOT NULL,
  focused_duration_minutes INTEGER NOT NULL DEFAULT 0,
  paused_duration_minutes INTEGER NOT NULL DEFAULT 0,
  
  -- Lifecycle Timestamps
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  resumed_at TIMESTAMP WITH TIME ZONE,
  
  -- State: ACTIVE, PAUSED, COMPLETED, CANCELLED
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  
  -- Reflection & Notes (optional)
  reflection TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for MVP
CREATE POLICY "Allow all actions on learning_sessions" ON learning_sessions FOR ALL USING (true);

-- Performance indexes
CREATE INDEX idx_learning_sessions_project_id ON learning_sessions(project_id);
CREATE INDEX idx_learning_sessions_topic_id ON learning_sessions(topic_id);
CREATE INDEX idx_learning_sessions_status ON learning_sessions(status);
CREATE INDEX idx_learning_sessions_started_at ON learning_sessions(started_at);

-- Comment on table and key columns
COMMENT ON TABLE learning_sessions IS 'Active learning session tracking. Represents execution phase of learning cycle.';
COMMENT ON COLUMN learning_sessions.status IS 'Session state: ACTIVE, PAUSED, COMPLETED, or CANCELLED';
COMMENT ON COLUMN learning_sessions.focused_duration_minutes IS 'Actual focused time (excludes paused time)';
COMMENT ON COLUMN learning_sessions.paused_duration_minutes IS 'Total time spent in paused state';
COMMENT ON COLUMN learning_sessions.planned_duration_minutes IS 'User-intended session duration; may be extended';
