# EduClash — Hackathon Task Tracker

**Event:** HACKLDN 24-Hour Hackathon | February 2026
**Stack:** Vite + React + TypeScript + Tailwind + shadcn/ui | Supabase (DB + Auth + Storage + Edge Functions) | Gemini API
**Architecture:** No separate backend. Frontend calls Supabase directly for CRUD. Edge Functions + Postgres RPCs for server-side logic.

---

## Legend

| Symbol | Meaning                                  |
| ------ | ---------------------------------------- |
| `[ ]`  | Pending                                  |
| `[~]`  | In Progress                              |
| `[x]`  | Done                                     |
| `*`    | Blocking dependency for downstream tasks |

---

## Phase 1 — Setup & Skeleton (Hour 0–4)

### 1.1 Project Bootstrapping

| #      | Task                                                                                                         | Status | Depends On    | Notes                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------ | ------ | ------------- | --------------------------------------------------------------- |
| 1.1.1  | \* Create GitHub repo, add team members, agree on branching strategy                                         | `[x]`  | —             | Use `main` as always-deployable                                 |
| 1.1.2  | \* Scaffold frontend with Vite + React + TypeScript                                                          | `[x]`  | 1.1.1         | `npm create vite@latest . -- --template react-ts`               |
| 1.1.3  | \* Install and configure Tailwind CSS                                                                        | `[x]`  | 1.1.2         | Tailwind v4 with `@tailwindcss/vite` plugin                     |
| 1.1.4  | \* Install React Router v6 and wire up root `<BrowserRouter>` in `main.tsx`                                  | `[x]`  | 1.1.2         | —                                                               |
| 1.1.5  | \* Initialize shadcn/ui: run `npx shadcn@latest init`, configure `components.json`                           | `[x]`  | 1.1.3         | Sets up `cn()` utility, CSS variables, path aliases             |
| 1.1.6  | \* Add shadcn/ui components: Button, Input, Card, Dialog, Toast, Skeleton, Badge, Avatar, Tabs, DropdownMenu | `[x]`  | 1.1.5         | Added 14 components including Label, Textarea, Select, Progress |
| 1.1.7  | \* Install TanStack Query; wrap app in `<QueryClientProvider>` in `main.tsx`                                 | `[x]`  | 1.1.2         | `npm i @tanstack/react-query`                                   |
| 1.1.8  | \* Install React Hook Form + Zod + resolver                                                                  | `[x]`  | 1.1.2         | `npm i react-hook-form zod @hookform/resolvers`                 |
| 1.1.9  | \* Set up `.env` file; add `.env` to `.gitignore`                                                            | `[x]`  | 1.1.1         | Vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`             |
| 1.1.10 | \* Create Supabase project, capture project URL and anon key                                                 | `[x]`  | —             | Also note service role key for Edge Functions                   |
| 1.1.11 | Configure Vercel deployment: connect repo, set env vars                                                      | `[x]`  | 1.1.2, 1.1.10 | Single deployment target — no backend to deploy                 |
| 1.1.12 | \* Add top-level React `<ErrorBoundary>` component wrapping `<App>`                                          | `[x]`  | 1.1.2         | `src/components/ErrorBoundary.tsx`                              |

### 1.2 Database Schema

| #      | Task                                                                                                                                                                                                                                                               | Status | Depends On | Notes                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------- | --------------------------------------------------------------- |
| 1.2.1  | \* Create `users` table: `id (uuid, PK, refs auth.users)`, `username (text, unique)`, `email`, `avatar_url`, `xp (int, default 0)`, `current_streak (int, default 0)`, `streak_last_date (date)`, `wins (int, default 0)`, `losses (int, default 0)`, `created_at` | `[x]`  | 1.1.10     | SQL ready in `supabase/schema.sql` — run in Supabase SQL Editor |
| 1.2.2  | \* Create `friendships` table: `id`, `user_id`, `friend_id`, `status (pending/accepted)`, `created_at`                                                                                                                                                             | `[x]`  | 1.2.1      | SQL ready in `supabase/schema.sql`                              |
| 1.2.3  | \* Create `teams` table: `id`, `name`, `owner_id`, `invite_code (unique)`, `created_at`                                                                                                                                                                            | `[x]`  | 1.2.1      | SQL ready in `supabase/schema.sql`                              |
| 1.2.4  | \* Create `team_members` table: `team_id`, `user_id`, `joined_at`; composite PK                                                                                                                                                                                    | `[x]`  | 1.2.3      | SQL ready in `supabase/schema.sql`                              |
| 1.2.5  | \* Create `folders` table: `id`, `name`, `owner_id`, `team_id (nullable)`, `created_at`                                                                                                                                                                            | `[x]`  | 1.2.1      | SQL ready in `supabase/schema.sql`                              |
| 1.2.6  | \* Create `materials` table: `id`, `owner_id`, `team_id (nullable)`, `folder_id (nullable)`, `title`, `extracted_text`, `file_url`, `source_type (pdf/pptx/text)`, `created_at`                                                                                    | `[x]`  | 1.2.5      | SQL ready in `supabase/schema.sql`                              |
| 1.2.7  | \* Create `quizzes` table: `id`, `creator_id`, `question_count`, `time_limit_minutes`, `mode (solo/competitive)`, `created_at`                                                                                                                                     | `[x]`  | 1.2.1      | SQL ready in `supabase/schema.sql`                              |
| 1.2.8  | \* Create `questions` table: `id`, `quiz_id`, `question_text`, `options (jsonb)`, `correct_option_index`, `order`                                                                                                                                                  | `[x]`  | 1.2.7      | SQL ready in `supabase/schema.sql`                              |
| 1.2.9  | \* Create `challenges` table: `id`, `quiz_id`, `challenger_id`, `challenged_id`, `status (pending/accepted/expired/completed)`, `expires_at`, `created_at`                                                                                                         | `[x]`  | 1.2.7      | SQL ready in `supabase/schema.sql`                              |
| 1.2.10 | \* Create `quiz_attempts` table: `id`, `quiz_id`, `user_id`, `challenge_id (nullable)`, `score`, `time_taken_seconds`, `completed_at`                                                                                                                              | `[x]`  | 1.2.9      | SQL ready in `supabase/schema.sql`                              |
| 1.2.11 | \* Enable RLS on all tables; write RLS policies                                                                                                                                                                                                                    | `[x]`  | 1.2.10     | SQL ready in `supabase/schema.sql` — all 10 tables covered      |
| 1.2.12 | Create Supabase Storage bucket `materials` for file uploads; set RLS policy                                                                                                                                                                                        | `[x]`  | 1.1.10     | SQL ready in `supabase/schema.sql`                              |

### 1.3 Postgres Functions (RPCs)

| #     | Task                                                                                                                                                                                             | Status | Depends On    | Notes                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------- | ---------------------------------- |
| 1.3.1 | \* Create `submit_quiz_attempt(p_quiz_id, p_answers, p_time_taken, p_challenge_id)` — scores attempt, inserts row, awards +10 XP, updates streak, returns `{ score, correct_count, xp_earned }`  | `[x]`  | 1.2.10, 1.2.1 | SQL ready in `supabase/schema.sql` |
| 1.3.2 | \* Create `complete_challenge(p_challenge_id)` — compares both attempts, determines winner (score then time), awards +25 XP to winner, updates wins/losses, sets challenge status to 'completed' | `[x]`  | 1.2.9, 1.2.10 | SQL ready in `supabase/schema.sql` |
| 1.3.3 | \* Create `update_streak(p_user_id)` — checks `streak_last_date`, increments or resets `current_streak`, awards +5 XP for streak bonus                                                           | `[x]`  | 1.2.1         | SQL ready in `supabase/schema.sql` |
| 1.3.4 | Create `generate_invite_code()` — returns unique 6-char alphanumeric code                                                                                                                        | `[x]`  | —             | SQL ready in `supabase/schema.sql` |

### 1.4 Authentication

| #     | Task                                                                                                                                                                                       | Status | Depends On          | Notes                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------- | -------------------------------------------------- |
| 1.4.1 | \* Install `@supabase/supabase-js`; create `src/lib/supabase.ts` client singleton                                                                                                          | `[x]`  | 1.1.10, 1.1.2       | `src/lib/supabase.ts`                              |
| 1.4.2 | \* Enable Google OAuth in Supabase dashboard; configure redirect URLs                                                                                                                      | `[x]`  | 1.1.10              | localhost:5173 (dev) + production domain           |
| 1.4.3 | \* Create `AuthContext` — wraps `supabase.auth.onAuthStateChange`, exposes `user`, `session`, `loading`, `signInWithGoogle`, `signOut`                                                     | `[x]`  | 1.4.1               | `src/contexts/AuthContext.tsx`                     |
| 1.4.4 | \* Create `<ProtectedRoute>` component — redirects to `/login` if no session                                                                                                               | `[x]`  | 1.4.3               | `src/components/ProtectedRoute.tsx`                |
| 1.4.5 | \* Build `/login` page — "Continue with Google" button using shadcn Button                                                                                                                 | `[x]`  | 1.4.3, 1.1.6        | `src/pages/LoginPage.tsx`                          |
| 1.4.6 | \* Build `/setup-username` page — React Hook Form with Zod validation, username availability check via `supabase.from('users').select().eq('username', input)`, submit inserts `users` row | `[x]`  | 1.4.3, 1.2.1, 1.1.8 | `src/pages/SetupUsernamePage.tsx`                  |
| 1.4.7 | Add post-login redirect check in `AuthContext`: if no `users` row for `auth.uid()`, redirect to `/setup-username`                                                                          | `[x]`  | 1.4.6               | `hasProfile` check in AuthContext + ProtectedRoute |
| 1.4.8 | Create `useCurrentUser` hook — TanStack Query wrapper for fetching current user's profile from `users` table                                                                               | `[x]`  | 1.4.3, 1.1.7, 1.2.1 | `src/hooks/useCurrentUser.ts`                      |

### 1.5 UI Shell & Routing

| #     | Task                                                                                                                      | Status | Depends On | Notes                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- | ------------------------------------------------ |
| 1.5.1 | \* Define route structure in `App.tsx`: `/login`, `/setup-username`, `/play`, `/profile`, `/leaderboard`, `/quiz/:quizId` | `[x]`  | 1.1.4      | `src/App.tsx` — lazy-loaded routes with Suspense |
| 1.5.2 | \* Build `<BottomNav>` — 3 tabs (Profile, Play, Leaderboard); active tab highlighted; fixed bottom on mobile              | `[x]`  | 1.1.6      | `src/components/BottomNav.tsx` with Lucide icons |
| 1.5.3 | \* Build `<AppShell>` layout — renders `<Outlet>` with `<BottomNav>` below; max-width container for desktop               | `[x]`  | 1.5.2      | `src/components/AppShell.tsx`                    |
| 1.5.4 | Define global design tokens: primary colour, accent in `tailwind.config.ts` and CSS variables                             | `[x]`  | 1.1.5      | Purple primary via oklch in `src/index.css`      |

---

## Phase 2 — Core Feature Build (Hour 4–12)

### 2.1 Material Upload (Client-Side Extraction)

| #     | Task                                                                                                                                                                                                                                 | Status | Depends On                         | Notes                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------- | ------------------------------------------------------------------------------------- |
| 2.1.1 | \* Install `pdfjs-dist`; create `src/lib/extractPdf.ts` — extracts text from PDF file in browser                                                                                                                                     | `[x]`  | 1.1.2                              | Lazy-load PDF.js only on upload page to avoid bundle bloat (~500KB)                   |
| 2.1.2 | \* Install `jszip`; create `src/lib/extractPptx.ts` — extracts text from PPTX by parsing slide XML                                                                                                                                   | `[x]`  | 1.1.2                              | ~20 lines of XML parsing. Test with 2-3 real PPTX files early                         |
| 2.1.3 | \* Create `useMaterials` hook — TanStack Query: fetches `supabase.from('materials').select()` filtered by `owner_id`; includes mutation for inserting new material                                                                   | `[x]`  | 1.1.7, 1.4.1, 1.2.6                | Uses `source_type` column to match DB schema                                          |
| 2.1.4 | \* Build `<UploadMaterialModal>` — shadcn Dialog with tabs for "Upload File" / "Paste Text"; drag-and-drop; runs client-side text extraction; uploads original file to Supabase Storage; inserts `materials` row with extracted text | `[x]`  | 1.1.6, 2.1.1, 2.1.2, 2.1.3, 1.2.12 | Accept `.pdf`, `.pptx` only. React Hook Form for text input. Show extraction progress |
| 2.1.5 | Build `<MaterialList>` — shadcn Cards with title, source type Badge, date; shown in Play tab                                                                                                                                         | `[x]`  | 1.1.6, 2.1.3                       | —                                                                                     |
| 2.1.6 | Create `useFolders` hook — TanStack Query: fetches/creates folders via `supabase.from('folders')`                                                                                                                                    | `[x]`  | 1.1.7, 1.4.1, 1.2.5                | —                                                                                     |
| 2.1.7 | Build `<FolderPicker>` — shadcn DropdownMenu to assign material to a folder                                                                                                                                                          | `[x]`  | 1.1.6, 2.1.6                       | —                                                                                     |
| 2.1.8 | Build `<FolderView>` — groups materials by folder in Play tab; "Uncategorised" section                                                                                                                                               | `[x]`  | 2.1.5, 2.1.6                       | —                                                                                     |

### 2.2 Quiz Generation (Gemini via Edge Function)

| #     | Task                                                                                                                                                                                                                                                  | Status | Depends On                  | Notes                                                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 2.2.1 | \* Create Supabase Edge Function `generate-quiz`: accepts `{ material_ids[], question_count, time_limit_minutes, mode }`, fetches material text from DB, calls Gemini API, inserts into `quizzes` + `questions` tables, returns `quiz_id`             | `[x]`  | 1.1.10, 1.2.7, 1.2.8, 1.2.6 | `supabase/functions/generate-quiz/index.ts` — Gemini 2.5 Flash with structured JSON output |
| 2.2.2 | \* Write Gemini prompt template: takes `extracted_text` + `question_count`, returns JSON array of `{ question_text, options, correct_option_index }`                                                                                                  | `[x]`  | 2.2.1                       | Embedded in Edge Function with `response_schema` for structured output                      |
| 2.2.3 | Add error handling for Gemini API: catch rate limits/timeouts, retry up to 2 times, return user-friendly error                                                                                                                                        | `[x]`  | 2.2.1                       | 3-attempt retry logic implemented in Edge Function                                          |
| 2.2.4 | Build `<CreateQuizModal>` — shadcn Dialog, multi-step: (1) select materials/folder, (2) question count + time limit via React Hook Form + Zod, (3) generating state, (4) opponent picker (competitive only); calls Edge Function via `supabase.functions.invoke('generate-quiz', ...)` | `[x]`  | 1.1.6, 1.1.8, 2.2.1, 2.1.5  | `src/components/CreateQuizModal.tsx` — 4-step flow: Step 4 is inline user search for 1v1 mode |
| 2.2.5 | Show success feedback — shadcn Toast with "Quiz ready!" and auto-navigation                                                                                                                                                                                                            | `[x]`  | 2.2.4                       | Solo: auto-navigates to `/quiz/:id`. Competitive: shows opponent picker, sends challenge, then navigates to quiz |

### 2.3 Solo Quiz Play Flow

| #     | Task                                                                                                                                                                                                    | Status | Depends On                 | Notes                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------- | --------------------------------------------- |
| 2.3.1 | \* Create `useQuiz` hook — TanStack Query: fetches quiz + questions via `supabase.from('questions').select()`. Strip `correct_option_index` client-side before rendering (store separately for scoring) | `[x]`  | 1.1.7, 1.4.1, 1.2.7, 1.2.8 | `src/hooks/useQuiz.ts` — strips answers before exposing to UI |
| 2.3.2 | \* Build `<QuizPlayer>` page (`/quiz/:quizId`) — one question at a time, countdown timer, prev/next nav, submit on last question or timer expiry                                                        | `[x]`  | 2.3.1, 1.1.6               | `src/pages/QuizPlayer.tsx` — timer from mount |
| 2.3.3 | \* Wire quiz submission — call `supabase.rpc('submit_quiz_attempt', { ... })` with answers + time; navigate to results                                                                                  | `[x]`  | 2.3.2, 1.3.1               | Sends flat int[] for p_answers                |
| 2.3.4 | Build `<QuizResult>` — score, time taken, XP earned (from RPC response), per-question breakdown with correct answer highlighted                                                                         | `[x]`  | 2.3.3, 1.1.6               | `src/components/QuizResult.tsx` with CTAs     |
| 2.3.5 | Wire auto-submit: timer hits 0 → submit with answers given so far                                                                                                                                       | `[x]`  | 2.3.2                      | Deadline-based setTimeout in QuizPlayer       |
| 2.3.6 | Add progress indicator — "Question 3 of 20" with progress bar                                                                                                                                           | `[x]`  | 2.3.2                      | shadcn Progress bar + "Question X of Y" text  |
| 2.3.7 | Show XP earned as animated Toast after quiz submit                                                                                                                                                      | `[x]`  | 2.3.4                      | `toast.success('+X XP earned!')` in QuizPlayer after submit |

### 2.4 1v1 Challenge Flow

| #     | Task                                                                                                                                                                                  | Status | Depends On          | Notes                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------- | --------------------------------------------------------------------------- |
| 2.4.1 | \* Create `useChallenges` hook — TanStack Query: fetch incoming (pending, not expired) and outgoing challenges via `supabase.from('challenges').select()` with joins on users/quizzes | `[x]`  | 1.1.7, 1.4.1, 1.2.9 | `src/hooks/useChallenges.ts` — fetches with user+quiz+attempt joins         |
| 2.4.2 | \* Write challenge send mutation — insert into `challenges` table with `status = 'pending'`, `expires_at = now() + 24h`                                                               | `[x]`  | 2.4.1, 2.2.1        | `useSendChallenge` in useChallenges.ts                                      |
| 2.4.3 | \* Write challenge accept mutation — update `status = 'accepted'`; validate still pending and not expired                                                                             | `[x]`  | 2.4.1               | `useAcceptChallenge` in useChallenges.ts                                    |
| 2.4.4 | \* Wire challenge completion into `submit_quiz_attempt` RPC — when both attempts for a `challenge_id` exist, `complete_challenge` is called automatically                             | `[x]`  | 1.3.1, 1.3.2        | Already in Postgres + QuizPlayer captures challenge_result                  |
| 2.4.5 | Build `<PendingChallenges>` section in Play tab — list incoming challenges with challenger name, quiz info, time remaining, "Accept" button                                           | `[x]`  | 2.4.1, 1.1.6        | `src/components/PendingChallenges.tsx` — categorized sections               |
| 2.4.6 | Build `<ChallengeCard>` — shadcn Card with avatar, name, quiz info, expiry countdown, Accept CTA                                                                                      | `[x]`  | 1.1.6               | `src/components/ChallengeCard.tsx` — handles all challenge states           |
| 2.4.7 | Build `<SendChallengeFlow>` — username search, user result card, "Send Challenge" button, quiz selector                                                                               | `[x]`  | 2.4.2, 2.2.4, 1.1.6 | `src/components/SendChallengeFlow.tsx` — 2-step dialog                      |
| 2.4.8 | Build `<ChallengeResult>` — both scores, winner banner, XP delta, "Rematch" CTA                                                                                                       | `[x]`  | 2.4.4, 1.1.6        | `src/components/ChallengeResult.tsx` — shown post-quiz if both completed    |

---

## Phase 3 — Integration & Polish (Hour 12–20)

### 3.1 Friends & Social

| #     | Task                                                                                                                                                    | Status | Depends On          | Notes                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------- | ------------------------------------------ |
| 3.1.1 | \* Create `useUserSearch` hook — TanStack Query: `supabase.from('users').select().ilike('username', '%query%').neq('id', currentUserId)` with debounce  | `[x]`  | 1.1.7, 1.4.1, 1.2.1 | `useUserSearch` in `src/hooks/useChallenges.ts`; used by CreateQuizModal + SendChallengeFlow |
| 3.1.2 | \* Create `useFriends` hook — TanStack Query: fetch accepted friendships + pending requests via `supabase.from('friendships').select()` with user joins | `[x]`  | 1.1.7, 1.4.1, 1.2.2 | Mutations for send request, accept request |
| 3.1.3 | Build `<UserSearchBar>` — debounced Input (300ms), calls `useUserSearch`, renders result rows                                                           | `[x]`  | 1.1.6, 3.1.1        | Implemented inline in CreateQuizModal (Step 4) and SendChallengeFlow rather than as standalone component |
| 3.1.4 | Build `<UserSearchResult>` row — Avatar, username, "Add Friend" and "Challenge" buttons                                                                 | `[x]`  | 1.1.6, 3.1.2, 2.4.2 | —                                          |
| 3.1.5 | Build `<FriendRequests>` section — incoming requests with Accept button; shown in Profile tab                                                           | `[x]`  | 3.1.2, 1.1.6        | —                                          |
| 3.1.6 | Integrate `<UserSearchBar>` into Play tab above `<PendingChallenges>`                                                                                   | `[x]`  | 3.1.3, 2.4.5        | —                                          |

### 3.2 Leaderboard

| #     | Task                                                                                                                                    | Status | Depends On           | Notes                                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------- | -------------------------------------------------------- |
| 3.2.1 | \* Create `useLeaderboard` hook — TanStack Query: fetch friends + self from `users` table, ordered by XP desc; compute rank client-side | `[x]`  | 1.1.7, 3.1.2         | `src/hooks/useLeaderboard.ts` — two-step: useFriends for IDs, then fetch full profiles |
| 3.2.2 | Build `<Leaderboard>` page — rank, Avatar, username, XP, streak, W/L; current user highlighted; using shadcn Card + Badge               | `[x]`  | 3.2.1, 1.1.6         | `src/pages/LeaderboardPage.tsx` — medal emojis for top 3, current user highlighted     |
| 3.2.3 | Add sort Tabs: "XP", "Streak", "Wins" — client-side re-sort                                                                             | `[x]`  | 3.2.2                | Built into LeaderboardPage with shadcn Tabs + useMemo sort                              |
| 3.2.4 | Add head-to-head record per friend (W/L against that friend)                                                                            | `[ ]`  | 3.2.2, 1.2.10, 1.2.9 | Nice-to-have                                             |

### 3.3 Teams

| #     | Task                                                                                                                                                | Status | Depends On                 | Notes                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| 3.3.1 | _ Create `useTeams` hook — TanStack Query: fetch user's teams via `supabase.from('team_members').select('_, teams(\*)')`, mutations for create/join | `[ ]`  | 1.1.7, 1.4.1, 1.2.3, 1.2.4 | Team creation calls `generate_invite_code()` RPC |
| 3.3.2 | Build `<TeamsSection>` in Profile tab — list teams, "Create Team" and "Join Team" buttons                                                           | `[ ]`  | 3.3.1, 1.1.6               | —                                                |
| 3.3.3 | Build `<CreateTeamModal>` — shadcn Dialog, name input via React Hook Form, submit, show generated invite code with copy button                      | `[ ]`  | 3.3.1, 1.1.6, 1.1.8, 1.3.4 | —                                                |
| 3.3.4 | Build `<JoinTeamModal>` — shadcn Dialog, invite code input, submit, success/error Toast                                                             | `[ ]`  | 3.3.1, 1.1.6               | —                                                |
| 3.3.5 | Build `<TeamDetailView>` — team name, invite code with copy, member list with Avatars                                                               | `[ ]`  | 3.3.1, 1.1.6               | —                                                |

### 3.4 Profile Page

| #     | Task                                                                                                                                                                      | Status | Depends On          | Notes                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------- | -------------------------------------------- |
| 3.4.1 | \* Build `<ProfilePage>` — Avatar, username, XP bar, streak counter, win/loss record using shadcn Card + Badge                                                            | `[x]`  | 1.4.8, 1.1.6        | `src/pages/ProfilePage.tsx`                  |
| 3.4.2 | Add `<XpProgressBar>` — visual bar showing XP within a tier (every 100 XP = 1 level)                                                                                      | `[x]`  | 3.4.1               | Built into ProfilePage using shadcn Progress |
| 3.4.3 | Add streak display with flame icon — green if active, grey if 0                                                                                                           | `[x]`  | 3.4.1               | Flame icon from Lucide, orange when active   |
| 3.4.4 | Add recent activity section — last 5 quiz attempts with score and date via `supabase.from('quiz_attempts').select().order('completed_at', { ascending: false }).limit(5)` | `[ ]`  | 3.4.1, 1.2.10       | Nice-to-have                                 |
| 3.4.5 | Embed `<TeamsSection>` and `<FriendRequests>` into `<ProfilePage>`                                                                                                        | `[ ]`  | 3.4.1, 3.3.2, 3.1.5 | —                                            |

### 3.5 Play Tab Composition

| #     | Task                                                                                                         | Status | Depends On                 | Notes                               |
| ----- | ------------------------------------------------------------------------------------------------------------ | ------ | -------------------------- | ----------------------------------- |
| 3.5.1 | Build `<PlayPage>` — compose: `<UserSearchBar>`, `<PendingChallenges>`, "Create Quiz" button, `<FolderView>` | `[~]`  | 2.4.5, 3.1.3, 2.1.8, 2.2.4 | Challenges + FolderView + Upload wired in; needs UserSearchBar |
| 3.5.2 | Add "Create Quiz" FAB on Play tab — opens `<CreateQuizModal>`                                                | `[x]`  | 3.5.1, 2.2.4               | Placed as header button (not FAB); functional      |
| 3.5.3 | Add "Upload Material" button in Play tab header — opens `<UploadMaterialModal>`                              | `[x]`  | 3.5.1, 2.1.4               | —                                                 |

---

## Phase 4 — Demo Prep (Hour 20–24)

### 4.1 Integration Testing

| #     | Task                                                                                       | Status | Depends On                 | Notes                                  |
| ----- | ------------------------------------------------------------------------------------------ | ------ | -------------------------- | -------------------------------------- |
| 4.1.1 | E2E: Sign up with Google → set username → reaches Play tab                                 | `[ ]`  | 1.4.5, 1.4.6, 1.4.7        | —                                      |
| 4.1.2 | E2E: Upload PDF → material appears → generate quiz → play through → see score + XP         | `[ ]`  | 2.1.4, 2.2.4, 2.3.2, 2.3.4 | Use real lecture slides                |
| 4.1.3 | E2E: User A challenges User B → B accepts → both complete → winner determined → XP updated | `[ ]`  | 2.4.2, 2.4.3, 2.4.4        | Two browser windows                    |
| 4.1.4 | E2E: Add friend via search → friend appears on Leaderboard                                 | `[ ]`  | 3.1.3, 3.1.2, 3.2.2        | —                                      |
| 4.1.5 | E2E: Create team → copy invite code → second user joins → team shows for both              | `[ ]`  | 3.3.1, 3.3.3, 3.3.4        | —                                      |
| 4.1.6 | Verify streak does not double-increment for multiple quizzes on same day                   | `[ ]`  | 1.3.3                      | —                                      |
| 4.1.7 | Test timer auto-submit with a 1-minute quiz                                                | `[ ]`  | 2.3.5                      | —                                      |
| 4.1.8 | Test challenge expiry: set `expires_at` to past, verify expired status                     | `[ ]`  | 2.4.1                      | —                                      |
| 4.1.9 | Test RLS policies: verify user cannot read/write other users' data                         | `[ ]`  | 1.2.11                     | Critical since no backend guards exist |

### 4.2 UI Polish

| #     | Task                                                                        | Status | Depends On   | Notes                                                    |
| ----- | --------------------------------------------------------------------------- | ------ | ------------ | -------------------------------------------------------- |
| 4.2.1 | Add Skeleton loading states for all data-fetching views                     | `[ ]`  | Phase 2+3    | shadcn Skeleton component                                |
| 4.2.2 | Add empty state messages: no materials, no challenges, no friends, no teams | `[ ]`  | Phase 2+3    | Motivating copy ("Upload your first slides!")            |
| 4.2.3 | Ensure mobile-responsive at 375px viewport; fix overflow/layout issues      | `[ ]`  | Phase 3      | Chrome DevTools mobile mode                              |
| 4.2.4 | Add EduClash logo/wordmark to login page and app header                     | `[ ]`  | 1.4.5, 1.5.3 | SVG or text-based                                        |
| 4.2.5 | Review and unify spacing, font weights across the app                       | `[ ]`  | Phase 3      | 30-min design pass; shadcn ensures component consistency |

### 4.3 Bug Fixes & Hardening

| #     | Task                                                                                         | Status | Depends On | Notes                                   |
| ----- | -------------------------------------------------------------------------------------------- | ------ | ---------- | --------------------------------------- |
| 4.3.1 | Audit RLS policies: verify every table has correct read/write policies for all operations    | `[ ]`  | 1.2.11     | Primary security layer since no backend |
| 4.3.2 | Add Zod validation to all form inputs (upload, quiz creation, team creation, username setup) | `[ ]`  | 1.1.8      | —                                       |
| 4.3.3 | Handle Gemini API rate limit/timeout gracefully with user-facing Toast error                 | `[ ]`  | 2.2.3      | —                                       |
| 4.3.4 | Handle file upload errors (too large, wrong format) with clear UI feedback                   | `[ ]`  | 2.1.4      | Max 10MB                                |
| 4.3.5 | Test PPTX extraction with 2-3 real files; add raw text paste fallback if unreliable          | `[ ]`  | 2.1.2      | —                                       |

### 4.4 Demo Preparation

| #     | Task                                                                                                    | Status | Depends On  | Notes                                      |
| ----- | ------------------------------------------------------------------------------------------------------- | ------ | ----------- | ------------------------------------------ |
| 4.4.1 | Prepare two demo accounts with pre-loaded data: friends, completed challenge, XP/streak                 | `[ ]`  | 4.1.3       | Seed via Supabase SQL editor               |
| 4.4.2 | Upload real lecture slides to demo account as seeded material                                           | `[ ]`  | 4.4.1       | Well-structured slides for clean AI output |
| 4.4.3 | Run full demo script end-to-end at least twice; note friction points                                    | `[ ]`  | 4.1.1–4.1.5 | Target 3–4 minutes                         |
| 4.4.4 | Record fallback demo video at 1080p                                                                     | `[ ]`  | 4.4.3       | Under 3 minutes                            |
| 4.4.5 | Prepare pitch talking points: problem → sign up → upload → generate → challenge → profile → leaderboard | `[ ]`  | 4.4.3       | —                                          |
| 4.4.6 | Set production env vars on Vercel; verify production URL is live                                        | `[ ]`  | 1.1.11      | Test with fresh browser session            |
| 4.4.7 | Write README: what EduClash is, tech stack, setup instructions                                          | `[ ]`  | Phase 3     | Judges may check the repo                  |

---

## Dependency Map (Critical Path)

```
1.1.10 (Supabase project)
  ├─> 1.2.1–1.2.12 (DB schema)
  │     ├─> 1.2.11 (RLS policies) ← CRITICAL, do early
  │     └─> 1.3.1–1.3.4 (Postgres RPCs)
  │
  ├─> 1.4.1–1.4.8 (Auth + user hook)
  │     └─> 1.5.1–1.5.4 (UI shell)
  │
  └─> 2.2.1 (Edge Function: generate-quiz)

1.1.2 (Vite scaffold)
  ├─> 1.1.3–1.1.8 (Tailwind, shadcn, TanStack Query, RHF+Zod)
  ├─> 2.1.1–2.1.2 (Client-side extractors)
  │     └─> 2.1.4 (Upload modal)
  │           └─> 2.2.4 (Create quiz modal)
  │                 └─> 2.3.x (Solo play)
  │                 │     └─> 2.3.3 (Submit → RPC)
  │                 └─> 2.4.x (1v1 challenge)
  │
  └─> 3.x (Social, leaderboard, teams, profile)
```

**Critical path:** Supabase project → Schema + RLS → Postgres RPCs → Auth → Upload → Quiz generation Edge Function → Solo play → Challenge flow

**Parallelizable:** shadcn/ui setup, client-side extractors, and Edge Function development can happen alongside DB schema work.

---

## Task Count Summary

| Phase     | Section              | Tasks   |
| --------- | -------------------- | ------- |
| Phase 1   | Setup & Skeleton     | 40      |
| Phase 2   | Core Features        | 25      |
| Phase 3   | Integration & Polish | 22      |
| Phase 4   | Demo Prep            | 20      |
| **Total** |                      | **107** |

---

## Architecture Notes

**No Express backend.** Frontend calls Supabase directly via `supabase-js` for all CRUD. Server-side logic lives in:

- **Postgres RPCs** — `submit_quiz_attempt()`, `complete_challenge()`, `update_streak()`, `generate_invite_code()` — atomic transactions for scoring, XP, and streaks.
- **Supabase Edge Function** — `generate-quiz` — calls Gemini API with service role key, inserts quiz data.

**RLS is the security layer.** Since there's no backend middleware, Row Level Security policies on every table are critical. Test thoroughly.

**Client-side file extraction.** PDF.js and JSZip run in the browser. Original files are uploaded to Supabase Storage; extracted text is stored in `materials.extracted_text`. Lazy-load PDF.js to avoid bundle bloat.

**Gemini structured output.** Use `response_mime_type: "application/json"` with a `response_schema` to force valid JSON. Eliminates manual JSON parsing and retry logic for malformed output.

**Auth flow:** Username check happens in `AuthContext` on every auth state change — query `users` by `auth.uid()`, redirect to `/setup-username` if no row exists.

**Tiebreaker timing:** `time_taken_seconds` is measured client-side from `<QuizPlayer>` mount to submission, not from quiz creation.

**Challenge completion:** Handled inside the `submit_quiz_attempt` Postgres function — if both attempts for a `challenge_id` exist, `complete_challenge()` is called automatically. No polling or cron needed.

**Streak edge case:** `update_streak` uses Postgres `current_date` to avoid timezone bugs. Compare against `streak_last_date` column.

**Deployment:** Vercel (frontend) + Supabase (everything else). Two services, no CORS issues.
