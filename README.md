# Jmaie v0.2: money, food and training

Personal app for budgeting (salary + iCut barber income), a lean-bulk meal plan and a 4-day gym program.

## What's inside

| Area | Pages |
|---|---|
| Money | Overview, Transactions (quick add, edit, search), Budget (suggested plan, 50/30/20 check), Savings & investing, iCut bookings |
| Health | Today's food (tap "Ate it"), Meal plan & recipes, Gym (tick sets, log kg/reps), Progress (weight, calories, workouts) |
| Other | AI assistant, Settings (categories, theme, CSV export) |

Plans live in `src/lib/plan/` (`budget.ts`, `nutrition.ts`, `training.ts`, `investing.ts`). Edit those files to change amounts, recipes or exercises.

## Database

Uses the same Postgres database as v0.1 through plain SQL (`pg`). Existing tables are untouched.
On first request the app creates four new tables if they don't exist: `meal_logs`, `body_weights`, `workout_sets`, `app_settings`.

## Environment variables

See `.env.example`: `DATABASE_URL`, `APP_PASSWORD` (or `APP_PASSWORD_HASH`), `SESSION_SECRET`, optional `ANTHROPIC_API_KEY` (and `ANTHROPIC_MODEL`).
These are already set on the Vercel project.

## Local development

```bash
npm install
cp .env.example .env   # fill in values
npm run dev
```

`scripts/dev-fixture.sql` recreates the v0.1 tables with sample data for a local test database. Never run it against production.
