# Project Status: Learning Operating System (Second Brain)

## Overview
The application is evolving from a basic study session tracker into a comprehensive "Learning Operating System". The core architecture has been refactored to support flexible "Learning Activities" rather than just fixed study sessions. The knowledge capture workflow has been significantly enhanced to minimize friction.

## Current State & Architecture
- **Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, React Query, Lucide Icons.
- **Database**: Integrated with Supabase, leveraging a relational schema defined in `supabase/schema.sql`.
- **UI Architecture**: Client-side Single Page Application (SPA) with a consistent, minimalist design language (neutral surface colors, primary accents, consistent spacing).
- **Core Entities**:
  - `projects`: High-level domains (e.g., "Computer Science").
  - `categories`: Sub-domains within projects (e.g., "Algorithms").
  - `topics`: Specific subjects (e.g., "Dynamic Programming").
  - `learning_activities`: The central hub recording learning interactions (replaces `study_sessions`).
  - `revision_schedule`: Spaced repetition intervals generated from activities.

## Recent Architectural Changes
1. **Introduction of "Learning Activity"**:
   - Replaced "Study Session" with a more extensible "Learning Activity" model.
   - Database schema and types (`LearningActivity`) now include an `activity_type` field (currently defaulting to "Study").
   - Added `start_time` to track exactly when an activity occurred.
   - Decoupled relationships: `learning_activities` now directly link to `project_id`, `category_id`, and `topic_id` for flatter, more scalable querying.

2. **Streamlined Knowledge Capture Workflow**:
   - The "Learning Log" is now the primary interaction point.
   - Users can create Projects, Categories, and Topics directly from within the Learning Log form using a custom `SearchableSelect` component and `InlineCreateModal`.
   - This eliminates navigation friction, ensuring users never have to leave the page to capture knowledge.

3. **UI Component Refactoring**:
   - Separated UI components from business logic.
   - Built reusable `SearchableSelect` and `InlineCreateModal` components that can be leveraged across the application for seamless data entry.
   - Updated the Dashboard and Timeline to reflect "Learning Activities" instead of "Study Sessions", using icons and metadata (like duration, start time, type) to prepare for multiple activity types (e.g., Revision, PYQ Practice).

## Future Roadmap & Prepared Architecture
- **Extensible Activity Types**: The `activity_type` field in the database is ready to support "Revision", "PYQ Practice", "Mock Test", "Video Lecture", "Reading", etc., without schema changes. The UI will later be updated to allow selection of these types.
- **Knowledge Units / Hubs**: The `Topic` entity is structurally prepared to evolve into a "Knowledge Hub". Future features like Notes, Revision History, Flashcards, and Mind Maps will be attached to the `topic_id`.
- **Database Migration**: The application has been fully migrated from a local mock to a live Supabase backend. The `supabase/schema.sql` file is fully synchronized with the `src/types/index.ts` models.

## Known Constraints (Intentional Exclusions for V1)
- No AI or LLM integrations.
- No User Authentication.
- No Global Search.
- No Calendar / Notifications.
- No Flashcards / Mind Maps implementation.
- No external attachments or complex analytics.
