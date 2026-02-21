# Skill: new-rpc

Generate a Supabase Postgres RPC function (plpgsql).

## Usage

```
/new-rpc <function-name>
```

Example: `/new-rpc submit-quiz-attempt`, `/new-rpc update-streak`, `/new-rpc generate-invite-code`

## Instructions

1. Generate a SQL migration file at `supabase/migrations/<timestamp>_<function_name>.sql`. Use the current timestamp in format `YYYYMMDDHHMMSS`.

2. Use this template:

```sql
-- Function: <function_name>
-- Description: <what it does>
-- Called by: <frontend via supabase.rpc() | another RPC>

CREATE OR REPLACE FUNCTION <function_name>(
  p_param1 uuid,
  p_param2 text
  -- add parameters with p_ prefix
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
  -- declare variables with v_ prefix
BEGIN
  -- Verify the calling user has permission
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- TODO: implement function logic

  -- Return result as JSON
  v_result := jsonb_build_object(
    'success', true
    -- add return fields
  );

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION <function_name> TO authenticated;
```

3. Follow these conventions for EduClash RPCs:

   - **`SECURITY DEFINER`**: Runs as the function owner (bypasses RLS). Use this when the function needs to write to tables the user can't directly access (e.g., updating another user's XP in a challenge).
   - **`SECURITY INVOKER`**: Runs as the calling user (respects RLS). Use when the function only touches the user's own rows.
   - **`auth.uid()`**: Gets the current authenticated user's ID inside the function.
   - **`SET search_path = public`**: Security best practice for `SECURITY DEFINER` functions.

4. For functions that modify multiple tables atomically (like `submit_quiz_attempt`), wrap the logic in the function body — plpgsql functions are automatically transactional.

5. Create the corresponding TypeScript call in the relevant hook or a new file:

```typescript
// Call from frontend
const { data, error } = await supabase.rpc('<function_name>', {
  p_param1: value1,
  p_param2: value2,
});
```

## EduClash-Specific RPCs

Reference these when generating RPCs for this project:

- **`submit_quiz_attempt`**: Scores answers, inserts `quiz_attempts` row, awards +10 XP, calls `update_streak()`, auto-calls `complete_challenge()` if both players submitted. Returns `{ score, correct_count, xp_earned }`.
- **`complete_challenge`**: Compares scores (time as tiebreaker), awards +25 XP to winner, updates `wins`/`losses`, sets challenge `status = 'completed'`.
- **`update_streak`**: Compares `streak_last_date` against `current_date` (UTC). Same day = no-op, next day = increment + 5 XP bonus, gap = reset to 1.
- **`generate_invite_code`**: Returns unique 6-char alphanumeric. Use `substr(md5(random()::text), 1, 6)` with uniqueness loop.

## Conventions

- Parameter names: `p_` prefix (e.g., `p_quiz_id`)
- Local variables: `v_` prefix (e.g., `v_score`)
- Always check `auth.uid() IS NOT NULL` at the top
- Return `jsonb` for flexible structured responses
- Grant execute to `authenticated` role only
- One function per migration file
