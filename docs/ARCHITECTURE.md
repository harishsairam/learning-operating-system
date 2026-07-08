# Architecture

## Overall Architecture
The application is a modern, single-page application (SPA) built with React. It follows a clean architecture pattern, separating UI concerns from data access and business logic.

## Frontend
- **Framework**: React 18 (Client-side rendering).
- **Styling**: Tailwind CSS for utility-first styling.
- **Routing**: React Router 7.
- **State Management**: TanStack Query (React Query) is used for server-state caching, synchronization, and optimistic UI updates.

## Backend / Database
- **Provider**: Supabase.
- **Access Pattern**: All database interactions are abstracted behind dedicated service modules in `/src/api/`. UI components interact *only* with these functions, never directly with Supabase clients.

## Data Flow
1. **User Action**: UI component invokes an API function (e.g., `createActivity`).
2. **Data Transformation**: API function translates React props into Supabase-compatible payload.
3. **Database Execution**: Supabase SDK performs the operation.
4. **Cache Invalidation**: TanStack Query invalidates relevant cache keys, triggering automatic UI refetching.

## Learning Workflow
1. **Log**: User records a `LearningActivity` via `/log`.
2. **Derive**: The API triggers the generation of a `RevisionSchedule` based on the activity ID.
3. **Persist**: Both activity and schedule are committed to the DB.

## Relationships
The schema follows a hierarchical descent:
`Project` -> `Category` -> `Topic` -> `LearningActivity` -> `Revision`

This structure ensures clean aggregation for dashboards and timeline views, allowing the frontend to easily query "How many hours spent in Project X?".
