# Lift Log

A simple gym tracker: start a workout, log exercises with sets × reps × weight, and see your history and personal bests per exercise.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Postgres + Auth, Row Level Security) · Tailwind CSS 4 · deploys on Vercel.

## Features

- Email/password sign-in (Supabase Auth) with "Forgot password?" reset by email; each user only ever sees their own data (RLS)
- Workouts with name, date and notes
- Log sets per exercise — type a new exercise name or pick one you've used before; add several identical sets at once
- "+ Set" prefilled from your previous set, and "Last:" shows what you did for that exercise last time
- Exercises page: best set, estimated 1RM, and full history per exercise
- Tap a logged set to fix its weight or reps
- kg / lb switch in the header, saved per user (weights are stored in lb and converted for display)

## Local setup

1. Create a Supabase project, then run the files in [`supabase/migrations/`](supabase/migrations/) in order in the SQL editor (or apply it through the Supabase MCP / `supabase db push`).
2. `cp .env.example .env.local` and fill in the project URL and publishable (or anon) key from **Project Settings → API**.
3. `npm install && npm run dev` and open http://localhost:3000.

Checks: `npm run lint`, `npm test` (Vitest) and `npm run build`. The same three run in GitHub Actions on every pull request and push to `main` (`.github/workflows/ci.yml`).

For quick testing you can turn off **Confirm email** under Auth → Providers → Email; otherwise new accounts must click the confirmation link first.

## Deploying to Vercel

Functions run in Portland (`pdx1`, set in [`vercel.json`](vercel.json)) to sit next to the Supabase database in us-west-2; change both together if the database moves. Import the GitHub repo in Vercel and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as environment variables (the Vercel ↔ Supabase integration can set these for you). In Supabase → Auth → URL Configuration, set the Site URL to your Vercel domain and add `https://<your-domain>/auth/confirm**` as a redirect URL (the `**` lets the password-reset link carry its `?next=` parameter). Add `http://localhost:3000/auth/confirm**` too for local testing.

## MCP servers

`.mcp.json` registers the Vercel and Supabase MCP servers for Claude Code in this project. Authenticate each one with `/mcp` the first time.
