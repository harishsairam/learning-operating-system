-- ============================================================================
-- Database Schema Validation Script
-- ============================================================================
-- This script verifies that the database schema matches the expected final state
-- after migrations and schema.sql have been applied.
--
-- Run this against your Supabase database to validate correctness.
-- ============================================================================

-- ============================================================================
-- PART 1: Verify All Core Tables Exist
-- ============================================================================

SELECT 
  'TABLE VERIFICATION' as check_type,
  tablename,
  'EXISTS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'projects', 'categories', 'topics', 'learning_activities', 
    'knowledge_units', 'learning_sessions', 'revision_logs'
  )
ORDER BY tablename;

-- Expected result: 7 rows (all tables exist)

-- ============================================================================
-- PART 2: Verify revision_schedule Does NOT Exist
-- ============================================================================

SELECT 
  'REVISION_SCHEDULE_REMOVED' as check_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'revision_schedule'
  ) THEN 'PROBLEM: Table still exists!' ELSE 'OK: Removed as expected' END as status;

-- Expected result: "OK: Removed as expected"

-- ============================================================================
-- PART 3: Verify knowledge_units Has SRS Columns
-- ============================================================================

SELECT 
  'SRS_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'knowledge_units' 
  AND column_name IN (
    'srs_ease_factor', 'srs_interval', 'srs_repetitions', 'next_review_date'
  )
ORDER BY column_name;

-- Expected result: 4 rows with correct data types:
-- - srs_ease_factor: numeric|real
-- - srs_interval: integer
-- - srs_repetitions: integer
-- - next_review_date: date

-- ============================================================================
-- PART 4: Verify revision_logs Table Structure
-- ============================================================================

SELECT 
  'REVISION_LOGS_STRUCTURE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'revision_logs'
ORDER BY ordinal_position;

-- Expected result: 
-- id: uuid, NOT NULL, default: gen_random_uuid()
-- activity_id: uuid, YES (nullable), default: NULL
-- knowledge_unit_id: uuid, NOT NULL, default: NULL
-- quality: integer, NOT NULL, default: NULL
-- time_spent_seconds: integer, YES, default: NULL
-- created_at: timestamp with time zone, NOT NULL, default: now()

-- ============================================================================
-- PART 5: Verify Foreign Key Constraints (revision_logs)
-- ============================================================================

SELECT 
  'FK_CONSTRAINTS' as check_type,
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu 
  ON rc.constraint_name = kcu.constraint_name
  AND rc.table_schema = kcu.table_schema
WHERE kcu.table_name = 'revision_logs'
ORDER BY kcu.column_name;

-- Expected result:
-- activity_id -> learning_activities(id) [ON DELETE SET NULL]
-- knowledge_unit_id -> knowledge_units(id) [ON DELETE CASCADE]

-- ============================================================================
-- PART 6: Verify Indexes
-- ============================================================================

SELECT 
  'INDEXES' as check_type,
  indexname,
  tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN (
    'idx_revision_logs_activity', 'idx_revision_logs_ku',
    'idx_learning_sessions_project_id', 'idx_learning_sessions_topic_id',
    'idx_learning_sessions_status', 'idx_learning_sessions_started_at'
  )
ORDER BY tablename, indexname;

-- Expected result: 6 indexes (4 for revision_logs/learning_sessions)

-- ============================================================================
-- PART 7: Verify RLS Policies
-- ============================================================================

SELECT 
  'RLS_POLICIES' as check_type,
  policyname,
  tablename
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'projects', 'categories', 'topics', 'learning_activities', 
    'knowledge_units', 'learning_sessions', 'revision_logs'
  )
ORDER BY tablename, policyname;

-- Expected result: 7+ policies (one per table minimum)

-- ============================================================================
-- PART 8: Verify RPC Function
-- ============================================================================

SELECT 
  'RPC_FUNCTION' as check_type,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'delete_learning_log_safe';

-- Expected result: 1 row with delete_learning_log_safe function

-- ============================================================================
-- PART 9: Verify RLS is Enabled on All Tables
-- ============================================================================

SELECT 
  'RLS_ENABLED' as check_type,
  tablename,
  CASE WHEN relrowsecurity = true THEN 'YES' ELSE 'NO' END as rls_enabled
FROM pg_tables pt
JOIN pg_class pc ON pt.tablename = pc.relname
WHERE schemaname = 'public' 
  AND tablename IN (
    'projects', 'categories', 'topics', 'learning_activities', 
    'knowledge_units', 'learning_sessions', 'revision_logs'
  )
ORDER BY tablename;

-- Expected result: All YES

-- ============================================================================
-- PART 10: Data Validation (if there's existing data)
-- ============================================================================

-- Check that revision_logs has no orphaned records
SELECT 
  'DATA_INTEGRITY' as check_type,
  'revision_logs orphaned activity_id' as check_name,
  COUNT(*) as count
FROM revision_logs rl
WHERE rl.activity_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM learning_activities la WHERE la.id = rl.activity_id
  );

-- Expected result: 0 rows (no orphaned records)

-- Check that revision_logs properly references knowledge_units
SELECT 
  'DATA_INTEGRITY' as check_type,
  'revision_logs orphaned knowledge_unit_id' as check_name,
  COUNT(*) as count
FROM revision_logs rl
WHERE NOT EXISTS (
  SELECT 1 FROM knowledge_units ku WHERE ku.id = rl.knowledge_unit_id
);

-- Expected result: 0 rows (no orphaned records)

-- ============================================================================
-- PART 11: Schema Summary
-- ============================================================================

SELECT 
  'SCHEMA_SUMMARY' as check_type,
  COUNT(*) as table_count,
  'Tables in database' as description
FROM pg_tables 
WHERE schemaname = 'public';

SELECT 
  'SCHEMA_SUMMARY' as check_type,
  COUNT(*) as function_count,
  'Functions in database' as description
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- ============================================================================
-- END OF VALIDATION SCRIPT
-- ============================================================================
