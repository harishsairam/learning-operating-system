-- Migration: Add memory_mode field to learning_activities table
-- This migration adds support for Memory Engine v2 by introducing memory modes
-- to control revision scheduling based on learning needs.

ALTER TABLE learning_activities
ADD COLUMN memory_mode TEXT DEFAULT 'MEMORIZE' NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN learning_activities.memory_mode IS 
'Memory mode controls revision scheduling: REFERENCE (no revisions), LEARN_ONCE (1 day), MEMORIZE (1,3,7,15,30), MASTER (1,3,7,15,30,60,90,180,365)';
