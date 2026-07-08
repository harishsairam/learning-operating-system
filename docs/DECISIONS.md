# Architectural Decisions (ADR)

## Decision: Introduction of "Learning Activity"
- **Decision**: Replaced "Study Session" with a more extensible "Learning Activity" model.
- **Reason**: To support diverse learning modes (Revision, Practice, Lecture, etc.) without altering the core schema.
- **Trade-offs**: Slightly more complex query structure for historic data analysis.

## Decision: Migration to Supabase
- **Decision**: Replaced local storage mock with Supabase CRUD.
- **Reason**: To enable cloud persistence, multi-user capability, and robust relational data handling.
- **Trade-offs**: Added complexity in local development and network handling.

## Decision: Inline Creation for Capture
- **Decision**: Built `SearchableSelect` with `InlineCreateModal`.
- **Reason**: To minimize friction in the Learning Log. Users should never leave the capture flow to manage meta-entities.
- **Trade-offs**: Slightly increased complexity in UI state management.

## Decision: Modular API Services
- **Decision**: All data interactions are encapsulated in `/src/api/`.
- **Reason**: Decoupling the UI from the database implementation allows us to swap providers (e.g., Supabase -> PostgreSQL, Local -> Cloud) without UI changes.
- **Future Impact**: Ensures the UI remains stable as the backend scales.
