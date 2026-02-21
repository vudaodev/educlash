# Skill: new-rls

Generate Row Level Security policies for a Supabase table.

## Usage

```
/new-rls <table-name>
```

Example: `/new-rls users`, `/new-rls materials`, `/new-rls challenges`

## Instructions

1. Generate a SQL migration file at `supabase/migrations/<timestamp>_rls_<table_name>.sql`.

2. Use this template:

```sql
-- RLS Policies for: <table_name>
-- CRITICAL: RLS is the sole security layer — no backend middleware exists.

-- Enable RLS (idempotent)
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- SELECT: users can read their own rows
CREATE POLICY "<table_name>_select_own"
  ON <table_name>
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: users can insert their own rows
CREATE POLICY "<table_name>_insert_own"
  ON <table_name>
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: users can update their own rows
CREATE POLICY "<table_name>_update_own"
  ON <table_name>
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: users can delete their own rows
CREATE POLICY "<table_name>_delete_own"
  ON <table_name>
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

3. Adjust the ownership column based on the table schema:
   - `users` table: use `id = auth.uid()` (not `user_id`)
   - `folders`, `materials`, `quizzes`: use `owner_id = auth.uid()`
   - `friendships`: readable by both `user_id` and `friend_id`
   - `challenges`: readable by both `challenger_id` and `challenged_id`
   - `quiz_attempts`: owned by `user_id`, also readable via challenge participant
   - `teams`: owned by `owner_id`, readable by team members
   - `team_members`: readable by team members, insertable by the joining user

4. For tables with shared access, add additional SELECT policies:

```sql
-- Example: friendships readable by both parties
CREATE POLICY "friendships_select_both"
  ON friendships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Example: challenges readable by both participants
CREATE POLICY "challenges_select_both"
  ON challenges
  FOR SELECT
  TO authenticated
  USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

-- Example: team materials readable by team members
CREATE POLICY "materials_select_team"
  ON materials
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );
```

5. After generating, remind the user to verify:
   - No table is missing RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
   - SELECT policies don't leak data across users
   - INSERT policies prevent spoofing `user_id` / `owner_id`
   - UPDATE/DELETE policies prevent modifying other users' rows
   - `SECURITY DEFINER` RPCs bypass RLS intentionally — that's correct for functions like `complete_challenge` that update both players

## EduClash Table Reference

| Table | Owner Column | Shared Access |
|-------|-------------|---------------|
| `users` | `id` | Public read for leaderboard/search |
| `friendships` | `user_id` | Both `user_id` and `friend_id` can read |
| `teams` | `owner_id` | Team members can read |
| `team_members` | `user_id` | Team members can read each other |
| `folders` | `owner_id` | Team members if `team_id` set |
| `materials` | `owner_id` | Team members if `team_id` set |
| `quizzes` | `creator_id` | Challenge participants can read |
| `questions` | via `quiz_id` | Same as parent quiz |
| `challenges` | `challenger_id` | Both `challenger_id` and `challenged_id` |
| `quiz_attempts` | `user_id` | Challenge opponent can read |

## Conventions

- Policy names: `<table>_<operation>_<scope>` (e.g., `materials_select_team`)
- Always use `TO authenticated` (never allow `anon` writes)
- `USING` = filter for SELECT/UPDATE/DELETE, `WITH CHECK` = filter for INSERT/UPDATE
- Keep policies simple — complex joins in RLS can hurt query performance
- One migration file per table's policies
