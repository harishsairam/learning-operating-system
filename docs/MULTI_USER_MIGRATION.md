# Multi-user migration strategy

## Chosen approach

For this development project, the safest path is to add the new user ownership columns and RLS policies in a new migration, then backfill records to the current authenticated user only when a user is available. Because this workspace is still a local development app, existing rows can be reset rather than preserved if they are not associated with a real Supabase Auth account.

## Recommended rollout

1. Apply the new migration in Supabase.
2. Create a profile row for each authenticated user with a matching auth.users entry.
3. For existing local data:
   - If the app is still using a local dev database with no auth users, clear the existing rows and let the app recreate them after login.
   - If a real Supabase project is being used, backfill each table's user_id using the current authenticated user or a temporary admin user before enabling strict RLS.
4. Confirm the app creates records with user_id automatically via the new client-side auth helpers.

## Notes

- The new migration is additive and isolated to a single file.
- Existing rows remain readable after the migration, but they will be inaccessible under strict RLS until a user_id is assigned.
- For local development, resetting the data is the simplest option and avoids ownership ambiguity.
