# Deletion Workflow Simplification - Analysis & Implementation Plan

**Date**: July 18, 2026  
**Goal**: Remove complex 3-mode RPC deletion, use CASCADE deletes instead  
**Status**: READY FOR IMPLEMENTATION

---

## Current State Analysis

### Frontend Deletion Dialog (`DeleteActivityDialog.tsx`)
- **Complexity**: 3 radio button options with mode selection
- **User Experience**: Confusing, requires understanding of modes
- **Logic**:
  - Mode 1: Delete activity only, preserve knowledge units & revisions
  - Mode 2: Delete activity & knowledge units, preserve revision logs
  - Mode 3: Delete everything (requires typing "DELETE")
- **Icons Used**: Archive, History, Trash2, AlertTriangle
- **Knowledge Unit Counting**: Fetches count to display info

### Backend API (`activities.ts`)
- **Function**: `deleteActivity(id: string, mode: number)`
- **RPC Call**: `delete_learning_log_safe(p_activity_id, p_mode)`
- **Modes**: 1, 2, or 3

### Hook (`useActivities.ts`)
- **Mutation**: `useDeleteActivity()` passes `{ id, mode }` tuple
- **Invalidation**: Clears activities, dashboard, and revisions queries

### RPC Function (`20260716100000_consolidate_revision_architecture.sql`)
- **Current**: 100+ lines with 3 distinct IF/ELSIF blocks
- **Logic**:
  - Mode 1: Set activity_id to NULL in knowledge_units & revision_logs
  - Mode 2: Set activity_id to NULL in revision_logs, delete knowledge_units
  - Mode 3: Delete everything with CASCADE
- **Issue**: Complex, maintenance burden, not needed with proper CASCADE

---

## Foreign Key Relationships (CASCADE Status)

### Current Schema (`schema.sql`)

```
learning_activities
├─ projects(id) ON DELETE CASCADE ✅
├─ categories(id) ON DELETE CASCADE ✅
├─ topics(id) ON DELETE CASCADE ✅
└─ (no direct references to knowledge_units)

knowledge_units
├─ activity_id → learning_activities(id) ON DELETE CASCADE ✅
├─ projects(id) ON DELETE CASCADE ✅
├─ categories(id) ON DELETE CASCADE ✅
└─ topics(id) ON DELETE CASCADE ✅

revision_logs
├─ activity_id → learning_activities(id) ON DELETE SET NULL ⚠️
└─ knowledge_unit_id → knowledge_units(id) ON DELETE CASCADE ✅
```

### Key Finding
- ✅ `knowledge_units.activity_id` has `ON DELETE CASCADE` ✓
- ✅ `revision_logs.knowledge_unit_id` has `ON DELETE CASCADE` ✓
- ⚠️ `revision_logs.activity_id` has `ON DELETE SET NULL` (allows orphaning revision_logs)

**Decision**: This is CORRECT. We want:
1. Delete activity → cascades to knowledge_units → cascades to revision_logs
2. revision_logs.activity_id becomes NULL (orphaned but preserved for history)

---

## Proposed Changes

### 1. Simplify RPC Function
**File**: `supabase/migrations/20260716100000_consolidate_revision_architecture.sql`

**Remove**:
- All 3 modes and their IF/ELSIF blocks
- Mode 1, 2, 3 conditional logic
- 60+ lines of mode-specific code

**Replace With**:
- Single operation: `DELETE FROM learning_activities WHERE id = ?`
- Let CASCADE handle everything
- 5 lines instead of 100+

### 2. Update Delete API
**File**: `src/api/activities.ts`

**Remove**:
```typescript
export async function deleteActivity(id: string, mode: number) {
  const { error } = await supabase.rpc('delete_learning_log_safe', {
    p_activity_id: id,
    p_mode: mode
  });
  if (error) throw error;
  return true;
}
```

**Replace With**:
```typescript
export async function deleteActivity(id: string) {
  const { error } = await supabase
    .from('learning_activities')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
```

### 3. Simplify Frontend Dialog
**File**: `src/components/ui/DeleteActivityDialog.tsx`

**Remove**:
- All 3 radio button options
- Mode selection state (`deleteMode`)
- Knowledge unit count fetching (no longer needed)
- Conditional rendering for Mode 3 confirmation
- Icons: Archive, History
- 200+ lines of dialog content

**Replace With**:
- Single warning message about CASCADE deletion
- Simple delete confirmation
- Single "Confirm Delete" button
- Keep "Cancel" option
- 50 lines instead of 250+

### 4. Update Hook
**File**: `src/hooks/useActivities.ts`

**Remove**: `mode` parameter from mutation

**Before**:
```typescript
mutationFn: ({ id, mode }: { id: string, mode: number }) => deleteActivity(id, mode),
```

**After**:
```typescript
mutationFn: ({ id }: { id: string }) => deleteActivity(id),
```

### 5. Update Dialog Invocation
**File**: `src/pages/LearningLog.tsx` (or wherever dialog is used)

**Before**:
```typescript
await deleteActivity.mutateAsync({ id: activity.id, mode: deleteMode });
```

**After**:
```typescript
await deleteActivity.mutateAsync({ id: activity.id });
```

---

## CASCADE Deletion Behavior

When user deletes a `learning_activity`:

```
DELETE FROM learning_activities WHERE id = 'xxx'
    ↓
    ├─ CASCADE deletes all rows from knowledge_units where activity_id = 'xxx'
    │     ↓
    │     └─ CASCADE deletes all rows from revision_logs where knowledge_unit_id = (deleted KUs)
    │
    └─ Sets revision_logs.activity_id = NULL for orphaned logs
        (because revision_logs.activity_id has ON DELETE SET NULL)
```

### Result
- ✅ Learning activity deleted
- ✅ All knowledge units deleted
- ✅ All revision logs deleted (if they only linked via knowledge_unit_id)
- ✅ Orphaned revision_logs preserved with NULL activity_id (for history)

**This is the desired behavior.**

---

## Implementation Checklist

### Phase 1: Database Migration
- [ ] Update `20260716100000_consolidate_revision_architecture.sql`
  - Simplify `delete_learning_log_safe` function
  - OR remove function entirely (rely on CASCADE)
- [ ] Update `schema.sql` comments documenting CASCADE behavior

### Phase 2: Backend Changes
- [ ] Update `src/api/activities.ts` - `deleteActivity()` function
  - Remove `mode` parameter
  - Use direct `.delete()` instead of RPC call

### Phase 3: Frontend Changes
- [ ] Update `src/components/ui/DeleteActivityDialog.tsx`
  - Remove mode selection UI
  - Remove knowledge unit count fetching
  - Simplify to single warning + confirmation
  
- [ ] Update `src/hooks/useActivities.ts`
  - Remove `mode` parameter from mutation

- [ ] Find all usages of `DeleteActivityDialog` and update calls
  - Remove any `deleteMode` state
  - Call with just `id`

### Phase 4: Testing & Documentation
- [ ] Test deletion in UI
- [ ] Verify CASCADE works (all data deleted)
- [ ] Update docs about CASCADE behavior
- [ ] Remove references to deletion modes in documentation

---

## Code Changes Summary

| File | Changes | Lines |
|------|---------|-------|
| `20260716100000_consolidate_revision_architecture.sql` | Simplify RPC function | -60, +5 |
| `src/api/activities.ts` | Remove mode parameter | -3, +3 |
| `src/components/ui/DeleteActivityDialog.tsx` | Remove mode UI | -200, +60 |
| `src/hooks/useActivities.ts` | Remove mode parameter | -1 |
| `schema.sql` | Document CASCADE | +5 |

**Total**: ~150 lines of code removed, 75 lines added = **75 lines simplified**

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Data loss | 🔴 HIGH | Cascading deletes are permanent! Add confirmation dialog |
| User confusion | 🟢 LOW | Simpler UI = clearer intent |
| Breaking changes | 🟡 MEDIUM | This is a migration, old code won't work (but MVP has no users yet) |
| Orphaned records | 🟢 LOW | CASCADE + SET NULL handles this correctly |

---

## Benefits of Simplification

1. **Reduced Complexity**: 100+ line RPC → 5 line DELETE
2. **Cleaner UI**: 250+ lines → 60 lines of dialog code
3. **Fewer Parameters**: `deleteActivity(id, mode)` → `deleteActivity(id)`
4. **Better Maintainability**: Fewer edge cases, clearer intent
5. **Faster Performance**: Direct DELETE vs RPC call overhead
6. **Easier Testing**: Single behavior instead of 3 modes
7. **Clearer UX**: User knows exactly what will happen

---

## Recommended Implementation Order

1. **Update Migration** - Simplify RPC
2. **Update API** - Remove mode parameter
3. **Update Hook** - Remove mode from mutation
4. **Update Dialog** - Simplify UI
5. **Find & Update Usages** - Any component calling deleteActivity
6. **Test End-to-End** - Verify deletion works
7. **Update Docs** - Remove mode references

---

## Final Warning

Once a user deletes a Learning Activity, **all associated data is permanently deleted**:
- ❌ Activity record gone
- ❌ Knowledge units gone
- ❌ Revision logs gone
- ❌ All SRS data gone

Make sure confirmation dialog is clear about this!

---

**Status**: ANALYSIS COMPLETE, READY FOR IMPLEMENTATION
