-- ============================================================
-- EduClash — Full Database Schema
-- Paste this entire file into Supabase SQL Editor and run once.
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 1.1 Users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  avatar_url text,
  xp int NOT NULL DEFAULT 0,
  current_streak int NOT NULL DEFAULT 0,
  streak_last_date date,
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Friendships
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

-- 1.3 Teams
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.4 Team Members
CREATE TABLE team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- 1.5 Folders
CREATE TABLE folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.6 Materials
CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  extracted_text text,
  file_url text,
  source_type text NOT NULL CHECK (source_type IN ('pdf', 'pptx', 'text')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.7 Quizzes
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_count int NOT NULL,
  time_limit_minutes int NOT NULL,
  mode text NOT NULL DEFAULT 'solo' CHECK (mode IN ('solo', 'competitive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.8 Questions
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL,           -- JSON array of 4 strings
  correct_option_index int NOT NULL,
  "order" int NOT NULL
);

-- 1.9 Challenges
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  challenger_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'completed')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.10 Quiz Attempts
CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  score int NOT NULL DEFAULT 0,
  time_taken_seconds int NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- ── Users ────────────────────────────────────────────────────
-- Anyone authenticated can read any user (needed for search, leaderboard)
CREATE POLICY "users_select_all" ON users
  FOR SELECT TO authenticated USING (true);

-- Users can insert their own row (signup)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Users can update their own row
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ── Friendships ──────────────────────────────────────────────
-- Both parties can read
CREATE POLICY "friendships_select" ON friendships
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR friend_id = auth.uid());

-- User can send a friend request (they are user_id)
CREATE POLICY "friendships_insert" ON friendships
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Either party can update (accept)
CREATE POLICY "friendships_update" ON friendships
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

-- Either party can delete (unfriend)
CREATE POLICY "friendships_delete" ON friendships
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR friend_id = auth.uid());

-- ── Teams ────────────────────────────────────────────────────
-- Team members can read
CREATE POLICY "teams_select" ON teams
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- Any authenticated user can create a team
CREATE POLICY "teams_insert" ON teams
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

-- Only owner can update
CREATE POLICY "teams_update" ON teams
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Only owner can delete
CREATE POLICY "teams_delete" ON teams
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- ── Team Members ─────────────────────────────────────────────
-- Team members can see each other
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT TO authenticated
  USING (
    team_id IN (SELECT team_id FROM team_members AS tm WHERE tm.user_id = auth.uid())
  );

-- Users can join a team (insert themselves)
CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Users can leave (delete themselves), owners can remove anyone
CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

-- ── Folders ──────────────────────────────────────────────────
-- Owner can read own folders; team members can read team folders
CREATE POLICY "folders_select" ON folders
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "folders_insert" ON folders
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "folders_update" ON folders
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "folders_delete" ON folders
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- ── Materials ────────────────────────────────────────────────
-- Owner can read own; team members can read team materials
CREATE POLICY "materials_select" ON materials
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "materials_insert" ON materials
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "materials_update" ON materials
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "materials_delete" ON materials
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- ── Quizzes ──────────────────────────────────────────────────
-- Creator can read; challenge participants can read
CREATE POLICY "quizzes_select" ON quizzes
  FOR SELECT TO authenticated
  USING (
    creator_id = auth.uid()
    OR id IN (
      SELECT quiz_id FROM challenges
      WHERE challenger_id = auth.uid() OR challenged_id = auth.uid()
    )
  );

CREATE POLICY "quizzes_insert" ON quizzes
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

CREATE POLICY "quizzes_delete" ON quizzes
  FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- ── Questions ────────────────────────────────────────────────
-- Readable if user can read the parent quiz
CREATE POLICY "questions_select" ON questions
  FOR SELECT TO authenticated
  USING (
    quiz_id IN (
      SELECT id FROM quizzes
      WHERE creator_id = auth.uid()
        OR id IN (
          SELECT quiz_id FROM challenges
          WHERE challenger_id = auth.uid() OR challenged_id = auth.uid()
        )
    )
  );

CREATE POLICY "questions_insert" ON questions
  FOR INSERT TO authenticated
  WITH CHECK (
    quiz_id IN (SELECT id FROM quizzes WHERE creator_id = auth.uid())
  );

-- ── Challenges ───────────────────────────────────────────────
-- Both participants can read
CREATE POLICY "challenges_select" ON challenges
  FOR SELECT TO authenticated
  USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

-- Challenger can create
CREATE POLICY "challenges_insert" ON challenges
  FOR INSERT TO authenticated WITH CHECK (challenger_id = auth.uid());

-- Both participants can update (accept/expire)
CREATE POLICY "challenges_update" ON challenges
  FOR UPDATE TO authenticated
  USING (challenger_id = auth.uid() OR challenged_id = auth.uid())
  WITH CHECK (challenger_id = auth.uid() OR challenged_id = auth.uid());

-- ── Quiz Attempts ────────────────────────────────────────────
-- User can read own attempts; challenge opponent can also read
CREATE POLICY "quiz_attempts_select" ON quiz_attempts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR challenge_id IN (
      SELECT id FROM challenges
      WHERE challenger_id = auth.uid() OR challenged_id = auth.uid()
    )
  );

CREATE POLICY "quiz_attempts_insert" ON quiz_attempts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder
CREATE POLICY "materials_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'materials' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can read their own files
CREATE POLICY "materials_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'materials' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 4. POSTGRES RPCs
-- ============================================================

-- 4.1 Generate Invite Code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM teams WHERE invite_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 4.2 Update Streak
CREATE OR REPLACE FUNCTION update_streak(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date date;
  v_today date := current_date;
  v_streak int;
  v_bonus int := 0;
BEGIN
  SELECT streak_last_date, current_streak
  INTO v_last_date, v_streak
  FROM users WHERE id = p_user_id;

  IF v_last_date = v_today THEN
    -- Already played today, no change
    RETURN 0;
  ELSIF v_last_date = v_today - 1 THEN
    -- Consecutive day: increment streak
    v_streak := v_streak + 1;
    v_bonus := 5;
  ELSE
    -- Gap or first time: reset to 1
    v_streak := 1;
    v_bonus := 5;
  END IF;

  UPDATE users
  SET current_streak = v_streak,
      streak_last_date = v_today,
      xp = xp + v_bonus
  WHERE id = p_user_id;

  RETURN v_bonus;
END;
$$;

-- 4.3 Complete Challenge
CREATE OR REPLACE FUNCTION complete_challenge(p_challenge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge record;
  v_attempt_1 record;
  v_attempt_2 record;
  v_winner_id uuid;
  v_result jsonb;
BEGIN
  -- Get challenge info
  SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id;

  IF v_challenge IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  IF v_challenge.status = 'completed' THEN
    RETURN jsonb_build_object('already_completed', true);
  END IF;

  -- Get both attempts
  SELECT * INTO v_attempt_1
  FROM quiz_attempts
  WHERE challenge_id = p_challenge_id AND user_id = v_challenge.challenger_id;

  SELECT * INTO v_attempt_2
  FROM quiz_attempts
  WHERE challenge_id = p_challenge_id AND user_id = v_challenge.challenged_id;

  -- Both must exist
  IF v_attempt_1 IS NULL OR v_attempt_2 IS NULL THEN
    RETURN jsonb_build_object('waiting', true);
  END IF;

  -- Determine winner: higher score wins; if tied, faster time wins
  IF v_attempt_1.score > v_attempt_2.score THEN
    v_winner_id := v_challenge.challenger_id;
  ELSIF v_attempt_2.score > v_attempt_1.score THEN
    v_winner_id := v_challenge.challenged_id;
  ELSIF v_attempt_1.time_taken_seconds < v_attempt_2.time_taken_seconds THEN
    v_winner_id := v_challenge.challenger_id;
  ELSIF v_attempt_2.time_taken_seconds < v_attempt_1.time_taken_seconds THEN
    v_winner_id := v_challenge.challenged_id;
  ELSE
    -- Perfect tie: challenger wins (has to be someone)
    v_winner_id := v_challenge.challenger_id;
  END IF;

  -- Award XP and update W/L
  UPDATE users SET xp = xp + 25, wins = wins + 1 WHERE id = v_winner_id;
  UPDATE users SET losses = losses + 1
  WHERE id = CASE
    WHEN v_winner_id = v_challenge.challenger_id THEN v_challenge.challenged_id
    ELSE v_challenge.challenger_id
  END;

  -- Mark challenge as completed
  UPDATE challenges SET status = 'completed' WHERE id = p_challenge_id;

  v_result := jsonb_build_object(
    'winner_id', v_winner_id,
    'challenger_score', v_attempt_1.score,
    'challenged_score', v_attempt_2.score,
    'challenger_time', v_attempt_1.time_taken_seconds,
    'challenged_time', v_attempt_2.time_taken_seconds
  );

  RETURN v_result;
END;
$$;

-- 4.4 Submit Quiz Attempt
CREATE OR REPLACE FUNCTION submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers int[],       -- array of selected option indexes, in question order
  p_time_taken int,
  p_challenge_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_questions record;
  v_score int := 0;
  v_correct_count int := 0;
  v_total int := 0;
  v_xp_earned int := 0;
  v_streak_bonus int := 0;
  v_challenge_result jsonb;
  v_q record;
  v_idx int := 1;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Score the answers
  FOR v_q IN
    SELECT correct_option_index FROM questions
    WHERE quiz_id = p_quiz_id ORDER BY "order" ASC
  LOOP
    v_total := v_total + 1;
    IF v_idx <= array_length(p_answers, 1) AND p_answers[v_idx] = v_q.correct_option_index THEN
      v_correct_count := v_correct_count + 1;
    END IF;
    v_idx := v_idx + 1;
  END LOOP;

  -- Calculate score as percentage (0-100)
  IF v_total > 0 THEN
    v_score := round((v_correct_count::numeric / v_total) * 100);
  END IF;

  -- Insert attempt
  INSERT INTO quiz_attempts (quiz_id, user_id, challenge_id, score, time_taken_seconds)
  VALUES (p_quiz_id, v_user_id, p_challenge_id, v_score, p_time_taken);

  -- Award +10 XP for completing a quiz
  UPDATE users SET xp = xp + 10 WHERE id = v_user_id;
  v_xp_earned := 10;

  -- Update streak
  v_streak_bonus := update_streak(v_user_id);
  v_xp_earned := v_xp_earned + v_streak_bonus;

  -- If this is a challenge attempt, try to complete the challenge
  IF p_challenge_id IS NOT NULL THEN
    v_challenge_result := complete_challenge(p_challenge_id);
  END IF;

  RETURN jsonb_build_object(
    'score', v_score,
    'correct_count', v_correct_count,
    'total_questions', v_total,
    'xp_earned', v_xp_earned,
    'streak_bonus', v_streak_bonus,
    'challenge_result', v_challenge_result
  );
END;
$$;

-- Grant RPC access to authenticated users
GRANT EXECUTE ON FUNCTION generate_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION update_streak TO authenticated;
GRANT EXECUTE ON FUNCTION complete_challenge TO authenticated;
GRANT EXECUTE ON FUNCTION submit_quiz_attempt TO authenticated;
