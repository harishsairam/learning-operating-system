<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/26e3c62c-bc39-417e-84ee-a09761468f41

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Key Features

- Daily Command Center for planning today’s study topics
- Start or resume live learning sessions from the dashboard
- Quick revision queue with complete / reschedule / skip actions
- Spaced repetition scheduling from logged learning activities

## Daily Command Center

The dashboard now includes a dedicated planner for today’s study topics with:

- `daily_plans` CRUD and drag/reorder support
- quick start/resume session workflow from planned topics
- integrated study and revision progress overview

### Supabase Migration

The schema includes a `supabase/migrations/20260708_create_daily_plans_table.sql` migration that creates the `daily_plans` table and enables safe row-level access.

To apply the migration locally, run your Supabase migration workflow and then start the app:

```bash
npm install
npm run dev
```
