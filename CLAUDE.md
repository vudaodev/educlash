# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduClash is a competitive quiz web app where university students upload lecture slides (PDF/PPTX/text), generate AI-powered quizzes via Gemini, and battle friends in 1v1 challenges with XP, streaks, and leaderboards. Built for HACKLDN 24-hour hackathon (Feb 2026).

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Routing**: React Router v6
- **Data fetching**: TanStack Query for all server state
- **Forms**: React Hook Form + Zod for all form validation
- **Auth & DB**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **AI**: Gemini API (called from Supabase Edge Function, not frontend)
- **Deployment**: Vercel (frontend) + Supabase (everything else)

## Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

**No separate backend.** The frontend calls Supabase directly via `@supabase/supabase-js` for all CRUD. Server-side logic is split between:

1. **Postgres RPCs** — atomic transactions that must not run client-side:
   - `submit_quiz_attempt()` — scores attempt, awards +10 XP, updates streak, auto-calls `complete_challenge()` when both players have submitted
   - `complete_challenge()` — compares scores (time as tiebreaker), awards +25 XP to winner, updates wins/losses
   - `update_streak()` — uses Postgres `current_date` (UTC) to avoid timezone bugs
   - `generate_invite_code()` — unique 6-char alphanumeric for teams

2. **Supabase Edge Function** (`generate-quiz`) — receives material IDs + config, fetches extracted text from DB, calls Gemini API with `response_mime_type: "application/json"` + `response_schema` for structured output, inserts quiz + questions rows

**RLS is the sole security layer.** No backend middleware exists — every table must have Row Level Security policies. This is the most critical security concern in the codebase.

## Database Schema

10 tables in Supabase Postgres (see `tasks.md` §1.2 for full column definitions):

`users` → `friendships` → social features
`users` → `teams` → `team_members` → team features
`users` → `folders` → `materials` → content management
`users` → `quizzes` → `questions` → quiz content
`quizzes` → `challenges` → `quiz_attempts` → gameplay

Key relationships: `users.id` references `auth.users.id`. `challenges` links two users to a quiz. `quiz_attempts` links a user to a quiz with optional `challenge_id`. `materials.extracted_text` stores the text sent to Gemini for generation.

## Key Design Decisions

- **Client-side file extraction**: PDF text via `pdfjs-dist`, PPTX text via `jszip` XML parsing — both run in-browser. Lazy-load `pdfjs-dist` to avoid ~500KB bundle bloat.
- **Auth flow**: `AuthContext` listens to `onAuthStateChange`. On every auth event, query `users` table by `auth.uid()`. If no row exists, redirect to `/setup-username` before granting app access.
- **Challenge lifecycle**: pending → accepted → both players complete quiz independently within 24h → `submit_quiz_attempt` RPC auto-detects both attempts exist and calls `complete_challenge` → completed. No polling or cron needed.
- **Quiz timing**: `time_taken_seconds` is measured client-side from `QuizPlayer` component mount to submission (used as tiebreaker on equal scores).
- **UI components**: Use only shadcn/ui — do not add other component libraries.
- **Mobile-first**: Primary usage on phones. Design at 375px, scale up.
- **Navigation**: 3-tab bottom nav (Profile, Play, Leaderboard) via `BottomNav` component with React Router `NavLink`.

## Environment Variables

```
VITE_SUPABASE_URL=        # Supabase project URL (frontend)
VITE_SUPABASE_ANON_KEY=   # Supabase anon key (frontend)
GEMINI_API_KEY=           # Edge Function secret only (never in frontend)
```

## XP System

+10 XP per quiz completed, +25 XP for winning a 1v1, +5 XP daily streak bonus. Streaks reset if no quiz completed for a calendar day (UTC).
