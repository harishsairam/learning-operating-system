# Project Status: Learning Operating System (Second Brain)

## Project Overview
- **Purpose**: A comprehensive "Learning Operating System" designed to track learning interactions, manage knowledge domains, and implement spaced repetition for effective retention.
- **Current Version**: 0.1.0
- **Development Phase**: MVP / Beta
- **Technology Stack**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Supabase.

## Current Features

| Feature | Status | Description |
| :--- | :--- | :--- |
| **Dashboard** | Completed | Central hub for activity tracking, streak management, and daily review tasks. |
| **Daily Command Center** | Completed | Planner, quick start session actions, and revision controls on the dashboard. |
| **Active Session Resume** | Completed | Brings users back into an active learning session from the dashboard. |
| **Learning Log** | Completed | Primary interface for capturing learning interactions with inline entity creation. |
| **Timeline** | Completed | Chronological view of all recorded learning activities. |
| **Projects/Categories/Topics** | Completed | Hierarchical knowledge domain management. |
| **Inline Creation** | Completed | Context-aware creation of entities (Projects/Categories/Topics) within the Log form. |
| **Learning Activities** | Completed | Core entity for recording study duration, source, and notes. |
| **Spaced Repetition** | Completed | Automated generation of revision schedules upon activity logging. |

## Current Database
The application utilizes a relational schema hosted on **Supabase (PostgreSQL)**.

- **Tables**:
    - `projects`: Top-level domains.
    - `categories`: Sub-domains (FK: project_id).
    - `topics`: Specific subjects (FK: category_id).
    - `learning_activities`: Core study events (FKs: project, category, topic).
    - `revision_schedule`: Planned review tasks (FK: activity_id).
    - `daily_plans`: Daily planning entries for study topics, sessions, and priorities.

## Current Pages
- **Dashboard (`/`)**: Overview, streaks, and upcoming revisions.
- **Learning Log (`/log`)**: Capturing new learning sessions.
- **Timeline (`/timeline`)**: Historic view of activities.
- **Management (`/topics`)**: CRUD for Projects, Categories, and Topics.

## Current Components
- `SearchableSelect`: Reusable, type-safe dropdown with inline filtering.
- `InlineCreateModal`: Modal for adding new entities without losing form context.

## Known Limitations
- No AI/LLM integrations for summarization or insight generation.
- No User Authentication (currently using default Supabase policies).
- No global search functionality across notes or topics.

## Next Milestone
Implementation of active recall features, including a dedicated flashcard system and structured note-taking within the Topic view.

## Technical Debt
- Need to implement robust error handling for Supabase edge cases in API services.
- Move from `any` types in some UI components to strict TypeScript interfaces.
