# EduClash — Product Requirements Document

**HACKLDN 24-Hour Hackathon** | Version 1.2 | February 2026

> _Gamify your revision. Compete with friends. Ace your exams._

---

## 1. Product Overview

| Field            | Detail                                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product Name** | EduClash (educlash.app)                                                                                                                                                                                                                              |
| **Summary**      | A competitive quiz web app that transforms lecture slides into interactive 1v1 battles. Built for university students who want the dopamine rush of gaming while actually learning. Track wins, losses, XP, and streaks as you compete with friends. |
| **Hackathon**    | HACKLDN — 24-hour build                                                                                                                                                                                                                              |

---

## 2. Problem & Solution

| The Problem                                                                                                                                            | Our Solution                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| University students struggle to stay engaged with lecture slides. Revision feels passive and repetitive, leading to poor retention and low motivation. | A competitive quiz web app that turns lecture material into interactive battles, tracking wins, losses, XP, and streaks to gamify revision and boost engagement. |

**User Story:** As a university student, I want to find engaging ways to study, so that I can perform better in my exams and retain more information.

---

## 3. Target Users

| Field            | Detail                                                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary User** | University students (especially gamers) who want an engaging, competitive way to revise lecture material.                                                                                                                             |
| **Persona**      | John and Sharon are university students on the same course who both enjoy gaming. They want the dopamine rush of competition but don't want to fail university. They upload their lecture slides and challenge each other to quizzes. |

---

## 4. Core MVP Features

### 4.0 Authentication

Users sign up and log in via Supabase Auth with OAuth providers (Google and others). On first login, all users must complete a **username setup step** before accessing the app — this username is used for social discovery and challenge invites. The user's avatar is pulled from their OAuth profile picture.

### 4.1 Upload Material

Users can upload study material as **files (PDF, PPTX) or raw text**. Uploaded files have text extracted server-side, and the extracted text is stored alongside the original file. This stored text is sent to the Gemini API as context for quiz question generation.

### 4.2 Teams (Simplified)

Users can create a team and receive a **shareable invite code**. Other users enter the invite code to join the team instantly — no approval needed. No update, delete, or role management in MVP.

### 4.3 Quiz 1v1 via Invite

Challenge a friend to a 1v1 quiz using username search. The flow works as follows:

1. Player A searches for Player B by username and sends a challenge.
2. Player B sees the pending challenge **in-app** (in the Play tab). No email or push notifications.
3. Player B has **24 hours** to accept the challenge. If not accepted, the challenge expires automatically.
4. Once accepted, **both players independently complete the quiz within 24 hours**.
5. The winner is determined by score; **total quiz completion time** (from first question loaded to last answer submitted) is used as a tiebreaker on equal scores.

Default quiz settings: **20 questions, 20-minute time limit**.

### 4.4 Quiz Creation & Customization

Users can configure quizzes with the following options:

- **Source:** a selected folder or specific uploaded materials
- **Question style:** multiple choice only (MVP)
- **Quiz length:** configurable number of questions (default: 20)
- **Time limit:** configurable per quiz (default: 20 minutes)
- **Mode:** solo practice or competitive (1v1 against a friend)

Questions are generated by sending the selected material's extracted text to the Gemini API, which returns multiple-choice questions with four options each.

### 4.5 Personal Profile & XP

Each user has a profile displaying their name, OAuth avatar, XP points, current streak, and overall record (wins/losses).

**XP is earned as follows:**

| Action                             | XP Reward  |
| ---------------------------------- | ---------- |
| Complete any quiz                  | +10 XP     |
| Win a 1v1 match                    | +25 XP     |
| Daily streak bonus (≥1 quiz/day)   | +5 XP/day  |

**Streak:** A daily activity streak — completing at least one quiz per day maintains it. Missing a day resets the streak to zero.

### 4.6 Friends & Social

Users discover each other via **username search**. From search results, users can add friends or send a direct 1v1 challenge. The friends list is used to populate the leaderboard.

---

## 5. Differentiator Features

### 5.1 Material Folders

Save and organize material into folders (e.g., per module, per semester, per programme). Team folders are shared and visible to team members.

### 5.2 Friends Leaderboard

A social leaderboard showing XP rankings, win streaks, and head-to-head records among friends and team members.

---

## 6. Nice-to-Have Features

- Open-ended and complete-the-sentence question types (with AI grading)
- Link/URL as upload source (with web scraping)
- Email notifications for challenge invites
- Automatic quiz generation from least-reviewed topics (spaced repetition)
- Schedule quiz sessions for teams
- Team vs. team quiz battles
- Nemesis tracking system (head-to-head rivalry stats)
- Extended leaderboard with records, win streaks, and rankings
- Learning roadmap with Duolingo-style checkpoints

---

## 7. App Architecture & Navigation

| Tab             | Description                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Profile**     | User name, OAuth avatar, XP, streak, leaderboard position, win/loss record, and teams joined.                   |
| **Play**        | Upload material, create quizzes, send 1v1 challenges by username, and view/accept incoming challenge invites.    |
| **Leaderboard** | Friends leaderboard with sortable rankings by XP, daily streak, and head-to-head records.                        |

The app should be **mobile-responsive** as primary usage will be on phones.

---

## 8. Data Model

| Entity          | Key Fields                                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| **User**        | id, username, email, avatar_url, xp, current_streak, streak_last_date, wins, losses |
| **Friendship**  | user_id, friend_id, status (pending / accepted)                                     |
| **Team**        | id, name, owner_id, invite_code                                                     |
| **TeamMember**  | team_id, user_id, joined_at                                                         |
| **Material**    | id, owner_id, team_id (nullable), title, extracted_text, file_url, source_type (pdf / pptx / text) |
| **Folder**      | id, name, owner_id, team_id (nullable)                                              |
| **Quiz**        | id, creator_id, question_count, time_limit_minutes, mode (solo / competitive)       |
| **Question**    | id, quiz_id, question_text, options (json), correct_option_index, order             |
| **Challenge**   | id, quiz_id, challenger_id, challenged_id, status (pending / accepted / expired / completed), expires_at |
| **QuizAttempt** | id, quiz_id, user_id, challenge_id (nullable), score, time_taken_seconds, completed_at |

---

## 9. Tech Stack

| Frontend         | Backend / API | Database             | AI           |
| ---------------- | ------------- | -------------------- | ------------ |
| React            | Node.js       | Supabase (DB + Auth) | Gemini API   |
| Tailwind CSS     |               |                      |              |
| React Router     |               |                      |              |

**Auth:** Supabase Auth with OAuth providers (Google, etc.). Mandatory username setup on first login.

---

## 10. Build Plan & Milestones

| Hour 0–4                           | Hour 4–12                                       | Hour 12–20                              | Hour 20–24       |
| ---------------------------------- | ----------------------------------------------- | --------------------------------------- | ---------------- |
| **Setup + Skeleton**               | **Core Feature Build**                          | **Integration & Polish**                | **Demo Prep**    |
| Setup repo + env                   | Quiz generation via Gemini API                  | Friends & social (username search, add) | Final testing    |
| Supabase Auth + username setup     | Material upload + text extraction               | Leaderboard                             | Bug fixes        |
| Basic UI shell + routing           | Quiz play flow (solo)                           | XP & streak system                      | Prepare pitch    |
| DB schema + Supabase tables        | 1v1 challenge flow (send / accept / complete)   | Teams (create + invite code)            | Fallback video   |

---

## 11. Risks & Assumptions

| Type               | Detail                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Technical Risk** | Gemini API quiz generation quality and latency — AI-generated questions may be inaccurate or poorly formatted from complex slides. _Mitigation: allow users to edit/flag questions._ |
| **Technical Risk** | PDF/PPTX text extraction quality — complex slide layouts may produce garbled text. _Mitigation: support raw text paste as a fallback input method._                                  |
| **Assumption**     | Students will upload lecture slides in standard formats (PDF, PPTX) that can be reliably text-extracted.                                                                             |
| **Assumption**     | The competitive/gaming angle is a strong enough motivator to drive adoption among university students.                                                                               |

---

## 12. Demo Strategy

1. Open with the problem: "As a uni student, I want engaging ways to study."
2. Sign up with Google and set a username.
3. Upload real lecture slides and show quiz generation in real time.
4. Send a 1v1 challenge to a teammate by username and play through a live quiz.
5. Show the profile with XP, streak, and win/loss record updating.
6. Show the leaderboard with friend rankings.
7. **Fallback:** pre-recorded video of the full flow if live demo has issues.
