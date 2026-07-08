-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create learning_activities table
CREATE TABLE learning_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  activity_type TEXT DEFAULT 'Study' NOT NULL,
  study_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create revision_schedule table
CREATE TABLE revision_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES learning_activities(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  revision_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_status TEXT,
  time_spent_minutes INTEGER
);

-- Note: Since there is no user authentication required for Version 1, 
-- you can either disable RLS (Row Level Security) completely or create simple policies.
-- Here we create policies that allow all access for the MVP (not recommended for production with sensitive data).

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all actions on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all actions on topics" ON topics FOR ALL USING (true);
CREATE POLICY "Allow all actions on learning_activities" ON learning_activities FOR ALL USING (true);
CREATE POLICY "Allow all actions on revision_schedule" ON revision_schedule FOR ALL USING (true);
-- Performance indexes

CREATE INDEX idx_categories_project_id
ON categories(project_id);

CREATE INDEX idx_topics_category_id
ON topics(category_id);

CREATE INDEX idx_learning_activities_project_id
ON learning_activities(project_id);

CREATE INDEX idx_learning_activities_category_id
ON learning_activities(category_id);

CREATE INDEX idx_learning_activities_topic_id
ON learning_activities(topic_id);

CREATE INDEX idx_revision_schedule_activity_id
ON revision_schedule(activity_id);

CREATE INDEX idx_revision_schedule_revision_date
ON revision_schedule(revision_date);

CREATE INDEX idx_revision_schedule_completed
ON revision_schedule(completed);