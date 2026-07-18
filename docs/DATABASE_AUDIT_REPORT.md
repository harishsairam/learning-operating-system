# Database Audit Report: Revision System Reconciliation
**Date**: July 18, 2026  
**Status**: REQUIRES APPROVAL BEFORE IMPLEMENTATION  
**Scope**: Revision system migrations, schema synchronization, and consistency analysis

---

## Executive Summary

The revision system database migrations are **partially out of sync** with the main schema file and contain **redundant/duplicate migrations**. The primary issues are:

1. **schema.sql** is defined independently and includes `revision_schedule` table
2. **Migrations 20260716100000–100005** are designed to refactor revision system but contain overlaps
3. **Foreign key constraints** differ between schema.sql and migrations
4. **TypeScript types** have moved on (no `revision_schedule` type) but database schema hasn't
5. **RLS policies** reference tables that may not exist yet

This creates a **schema drift** where:
- Running `schema.sql` on a fresh database creates revision_schedule
- Running migrations afterward drops it, leaving inconsistency
- Re-running migrations may fail due to duplicate operations or constraint mismatches

---

## Detailed Audit Findings

### 1. Schema Files & Migrations Overview

#### **Main Schema Definition** (`supabase/schema.sql`)
- **Total tables**: 8 (projects, categories, topics, learning_activities, knowledge_units, revision_schedule, learning_sessions, revision_logs)
- **Defines revision_schedule**: YES (lines 57–67)
- **Defines revision_logs**: YES (lines 148–153)
- **SRS columns in knowledge_units**: YES (lines 35–38)

#### **Migration Timeline** (in execution order)
```
20260708_create_daily_plans_table.sql
20260712_refactor_study_and_knowledge_domains.sql
  ├─ Creates/updates learning_sessions
  ├─ Adds learning_session_id to learning_activities
  ├─ Creates knowledge_units (first time)
  ├─ Links revision_schedule to knowledge_units
  └─ Drops activity_id from revision_schedule

20260713060506_create_knowledge_units.sql
  ├─ Creates knowledge_units IF NOT EXISTS
  ├─ Adds knowledge_unit_id to revision_schedule
  └─ Migrates learning_activities → knowledge_units

20260716034354_add_srs_columns_to_knowledge_units.sql
  ├─ Adds srs_ease_factor, srs_interval, srs_repetitions
  └─ Adds next_review_date

20260716035255_safe_delete_learning_log.sql (obsolete)
20260716040951_fix_delete_learning_log_rpc.sql (obsolete)

20260716100000_consolidate_revision_architecture.sql ⭐ COMPREHENSIVE
  ├─ Creates revision_logs table
  ├─ Verifies SRS columns on knowledge_units
  ├─ Migrates completed revisions: revision_schedule → revision_logs
  ├─ Migrates pending revision dates: revision_schedule → knowledge_units.next_review_date
  ├─ Drops old revision_schedule table
  ├─ Creates delete_learning_log_safe(UUID, INTEGER) RPC
  └─ Wraps entire migration in transaction

20260716100001_create_revision_logs.sql ❌ DUPLICATE
  └─ Creates revision_logs IF NOT EXISTS (already created in 100000)

20260716100002_migrate_revision_logs_data.sql ❌ REDUNDANT
  └─ Migrates revision_schedule → revision_logs (already done in 100000)

20260716100003_update_next_review_date.sql ❌ REDUNDANT
  └─ Updates knowledge_units.next_review_date (already done in 100000)

20260716100004_create_delete_learning_log_safe.sql ❌ DUPLICATE
  └─ Creates/recreates delete_learning_log_safe RPC (already in 100000)

20260716100005_drop_revision_schedule.sql ❌ REDUNDANT
  └─ Drops revision_schedule IF EXISTS (already done in 100000)

add_memory_mode_to_learning_activities.sql
  ├─ Adds memory_mode to learning_activities

create_learning_sessions_table.sql
  └─ Creates learning_sessions table
```

---

### 2. Identified Conflicts & Inconsistencies

#### **A. revision_schedule Table Definition Mismatch**

**In schema.sql (lines 57–67):**
```sql
CREATE TABLE revision_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_unit_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  revision_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_status TEXT,
  time_spent_minutes INTEGER
);
```

**Status**: This table is **DEFINED** in schema.sql but **DROPPED** by migration 20260716100000.

**Impact**:
- Fresh database from schema.sql has revision_schedule
- After running migrations, revision_schedule is gone
- RLS policy for revision_schedule still referenced in schema.sql (line 75)
- Indexes on revision_schedule still defined (lines 117–122)

---

#### **B. revision_logs Foreign Key Constraints Conflict**

**In schema.sql (lines 148–153):**
```sql
CREATE TABLE revision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES learning_activities(id) ON DELETE CASCADE,
  knowledge_unit_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
  quality INTEGER NOT NULL,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

**In migration 20260716100000 (lines 10–18):**
```sql
CREATE TABLE IF NOT EXISTS public.revision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES public.learning_activities(id) ON DELETE SET NULL,  ← DIFFERS
    knowledge_unit_id UUID NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    quality INTEGER NOT NULL,
    time_spent_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Difference**: 
- schema.sql: `activity_id UUID NOT NULL ... ON DELETE CASCADE`
- migration: `activity_id UUID ... ON DELETE SET NULL`

**Impact**:
- If migration runs after schema.sql, it creates revision_logs with `NOT NULL` activity_id
- Then tries to `CREATE TABLE IF NOT EXISTS` with `NULL` activity_id
- `IF NOT EXISTS` prevents error, but leaves incorrect schema
- If someone later updates the table, data could be lost

---

#### **C. RLS Policies Reference Non-Existent Tables**

**In schema.sql (line 75):**
```sql
CREATE POLICY "Allow all actions on revision_logs" ON revision_logs FOR ALL USING (true);
```

**Problem**: 
- `revision_logs` table is defined in schema.sql at lines 148–153
- But when schema.sql executes line 75, the table hasn't been created yet (created later at line 148)
- If schema.sql is run in strict order, this causes: `ERROR: relation "revision_logs" does not exist`

---

#### **D. Indexes on Non-Existent & Dropped Tables**

**In schema.sql (lines 117–122):**
```sql
CREATE INDEX idx_revision_schedule_knowledge_unit_id
ON revision_schedule(knowledge_unit_id);

CREATE INDEX idx_revision_schedule_revision_date
ON revision_schedule(revision_date);

CREATE INDEX idx_revision_schedule_completed
ON revision_schedule(completed);
```

**Status**: 
- These indexes are created in schema.sql
- But the entire `revision_schedule` table is DROPPED by migration 100000
- Indexes get dropped automatically (CASCADE on DROP TABLE)
- Creates confusion: schema file says these indexes should exist, but they don't after migrations

---

### 3. TypeScript Types vs. Database Schema Mismatch

**TypeScript types (src/types/index.ts):**
- ✅ Has `revision_logs` type with columns: id, activity_id, knowledge_unit_id, quality, time_spent_seconds, created_at
- ❌ Does NOT have `revision_schedule` type
- ✅ Has `knowledge_units` type with SRS columns: srs_ease_factor, srs_interval, srs_repetitions, next_review_date

**Database schema (schema.sql):**
- ✅ Has `revision_logs` table
- ✅ Has `revision_schedule` table (should not exist per types)
- ✅ Has SRS columns in `knowledge_units`

**Conclusion**: TypeScript types reflect the INTENDED final state (post-migration), but schema.sql reflects an older/incorrect state.

---

### 4. What Currently Exists in the Database

**After running all migrations (current state):**
- ✅ `projects` table - correctly defined
- ✅ `categories` table - correctly defined
- ✅ `topics` table - correctly defined
- ✅ `learning_activities` table - correctly defined
- ✅ `knowledge_units` table - with SRS columns (srs_ease_factor, srs_interval, srs_repetitions, next_review_date)
- ❌ `revision_schedule` table - DROPPED by migration 100000
- ✅ `revision_logs` table - exists (created by migration 100000)
- ✅ `learning_sessions` table - correctly defined
- ✅ `delete_learning_log_safe(UUID, INTEGER)` RPC function - exists
- ✅ RLS policies - all enabled (including one for revision_logs)
- ❌ Indexes on `revision_schedule` - dropped (table doesn't exist)

---

### 5. Migration Execution Issues

#### **Issue 5.1: Duplicate Migrations Cause Idempotency Problems**

If migrations 100001–100005 are re-run after 100000:

| Migration | First Run | Re-run Result | Impact |
|-----------|-----------|---------------|--------|
| 100000 (consolidate) | ✅ Creates revision_logs, drops revision_schedule | ✅ Safe (uses IF NOT EXISTS, DROP IF EXISTS) | No issue |
| 100001 (create_revision_logs) | ✅ Creates IF NOT EXISTS | ✅ Creates IF NOT EXISTS (safe) | But table already exists from 100000 |
| 100002 (migrate_revision_logs_data) | ✅ Migrates data | ❌ Could duplicate data if KUs changed | Data integrity risk |
| 100003 (update_next_review_date) | ✅ Updates dates | ⚠️ Overwrites if run again | Possible data loss |
| 100004 (create_delete_learning_log_safe) | ✅ Creates RPC | ✅ Uses CREATE OR REPLACE | Safe but redundant |
| 100005 (drop_revision_schedule) | ✅ Drops IF EXISTS | ✅ Safe (nothing to drop) | Harmless but redundant |

**Conclusion**: 100001–100003 are **NOT idempotent** and will cause issues if re-run.

---

#### **Issue 5.2: Transaction Wrapping**

- Migration 100000 wraps everything in `BEGIN; ... COMMIT;` (good)
- Migrations 100001–100005 do not use transactions (migrations are typically auto-wrapped, but explicit is better)
- If 100001–100003 fail, they could leave database in an inconsistent state

---

### 6. schema.sql Problems Summary

**schema.sql is fundamentally problematic because:**

1. It defines the CURRENT state, not the FINAL state
2. It includes tables that migrations plan to drop
3. It creates RLS policies before tables are defined (order issue)
4. It creates indexes on tables that should be dropped
5. It doesn't reflect the SRS architecture refactoring
6. Running schema.sql + migrations creates a mismatch

**The correct approach**: schema.sql should represent the FINAL desired state, not an intermediate state.

---

## Recommended Fixes (AWAITING APPROVAL)

### **Option A: Clean Up & Consolidate (RECOMMENDED)**

**Goal**: Make schema.sql the source of truth & clean up migrations.

**Steps**:

1. **Update schema.sql**:
   - ❌ REMOVE `revision_schedule` table definition
   - ✅ KEEP `revision_logs` table (with `activity_id UUID ON DELETE SET NULL`)
   - ✅ KEEP SRS columns in `knowledge_units`
   - ✅ FIX RLS policy order (move after all table definitions)
   - ❌ REMOVE indexes on revision_schedule

2. **Consolidate migrations**:
   - ✅ KEEP `20260716100000_consolidate_revision_architecture.sql` (comprehensive)
   - ❌ DELETE `20260716100001_create_revision_logs.sql` (redundant)
   - ❌ DELETE `20260716100002_migrate_revision_logs_data.sql` (redundant)
   - ❌ DELETE `20260716100003_update_next_review_date.sql` (redundant)
   - ❌ DELETE `20260716100004_create_delete_learning_log_safe.sql` (redundant)
   - ❌ DELETE `20260716100005_drop_revision_schedule.sql` (redundant)

3. **Create a new baseline migration** (if needed for production):
   - This migration would be run on a fresh production database
   - It would verify/recreate the final correct schema if it doesn't match

**Pros**:
- Single source of truth (schema.sql)
- Migrations become clean and non-redundant
- Future developers have a clear reference

**Cons**:
- Requires deletion of existing migration files (git history remains)
- Any database that ran the old migrations is now out of sync with schema.sql

---

### **Option B: Keep Migrations, Fix schema.sql**

**Goal**: Keep migration history intact, fix schema.sql to match final state.

**Steps**:

1. **Update schema.sql to reflect FINAL state post-migrations**:
   - ❌ REMOVE `revision_schedule` table
   - ✅ KEEP `revision_logs` with correct constraints
   - ✅ KEEP SRS columns
   - ✅ FIX RLS policy order
   - ❌ REMOVE revision_schedule indexes

2. **Keep all migrations** (for audit trail)

3. **Document**: Add a README in `supabase/migrations/` explaining that migrations 100001–100005 are redundant

**Pros**:
- Preserves git history
- No data loss if old migrations were run

**Cons**:
- Confusing to future developers (why redundant migrations?)
- schema.sql no longer reflects the starting state

---

### **Option C: Create a Clean Baseline Migration**

**Goal**: Create a single, comprehensive migration that brings any database into the correct final state.

**Steps**:

1. **Keep current migrations** (for existing production database)

2. **Create new migration**: `20260719_baseline_revision_system.sql`
   - Check if each object exists
   - Recreate/fix if needed
   - Document the idempotent operations

3. **Update schema.sql** to match final state

**Pros**:
- Handles existing databases that may be in various states
- New databases can be bootstrapped cleanly
- Most flexible approach

**Cons**:
- Most complex solution
- Requires careful error handling

---

## Data Integrity Assessment

**Risk Level**: 🟡 MODERATE

### **What Could Go Wrong**:

1. **If migrations 100001–100003 re-run**:
   - Duplicate data could be inserted into `revision_logs`
   - `next_review_date` could be overwritten incorrectly
   - Result: Lost or corrupted revision history

2. **If schema.sql runs after migrations**:
   - RLS policies might fail (table reference error)
   - Indexes might not be created on the right tables
   - Result: Inconsistent state

3. **If foreign key constraint mismatches exist**:
   - Deleting a `learning_activity` could either CASCADE delete or SET NULL on `revision_logs.activity_id`
   - Result: Inconsistent behavior between different environments

---

## Recommended Action Plan (AFTER APPROVAL)

### **Phase 1: Assessment** (Already complete)
- ✅ Audit completed
- ✅ Issues identified
- ⏳ Awaiting approval

### **Phase 2: Backup & Preparation** (Before making changes)
1. Export current database state as SQL
2. Document any custom data in revision_logs and knowledge_units
3. Create a backup migration for rollback

### **Phase 3: Implementation** (Choose one option above)
- Option A (Clean up migrations) - RECOMMENDED
- Option B (Keep migrations, fix schema.sql)
- Option C (Create baseline migration)

### **Phase 4: Validation**
1. Run migration from scratch on clean database
2. Verify schema matches TypeScript types
3. Test revision system functionality (getDueRevisions, revision logging, SRS calculations)
4. Verify RLS policies work correctly

### **Phase 5: Documentation**
1. Update [ARCHITECTURE.md](../docs/ARCHITECTURE.md) to explain final revision system design
2. Document why old migrations were removed/consolidated
3. Add clear comments to schema.sql about revision system evolution

---

## Checklist for Approval Decision

Before proceeding, please confirm:

- [ ] **Option A, B, or C** is acceptable?
- [ ] **Data loss risk**: Acceptable to potentially re-migrate data if we choose Option A?
- [ ] **Timeline**: Should this be fixed before implementing new revision features?
- [ ] **Production**: Is there a production database that needs special handling?
- [ ] **Testing**: Should I include test cases for the revision system after fixing?

---

## Appendix: Query to Verify Current Database State

To check what actually exists in your Supabase database, run:

```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check functions
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- Check revision_logs exists and constraint details
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'revision_logs' 
ORDER BY ordinal_position;

-- Check knowledge_units has SRS columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'knowledge_units' 
ORDER BY ordinal_position;

-- Check if revision_schedule still exists
SELECT EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'revision_schedule'
) AS revision_schedule_exists;
```

---

**Report prepared by**: Database Audit System  
**Next Step**: Await user approval on recommended actions
