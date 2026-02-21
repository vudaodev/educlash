# Skill: new-edge-function

Generate a Supabase Edge Function (Deno).

## Usage

```
/new-edge-function <function-name>
```

Example: `/new-edge-function generate-quiz`, `/new-edge-function send-notification`

## Instructions

1. Create the directory and file at `supabase/functions/<function-name>/index.ts` (kebab-case name).

2. Use this template:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Init Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify the calling user (optional — remove if function is public)
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await req.json();

    // TODO: implement function logic

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

3. If the function needs secrets (like `GEMINI_API_KEY`), access them via `Deno.env.get()` and note which secrets need to be set in the Supabase dashboard.

4. To call this function from the frontend:

```typescript
const { data, error } = await supabase.functions.invoke('<function-name>', {
  body: { /* payload */ },
});
```

## Conventions

- Use `supabaseAdmin` (service role) for DB writes that bypass RLS — this is intentional for server-side logic
- Always verify the calling user via the `Authorization` header unless the function is explicitly public
- CORS headers are required for browser calls
- Keep secrets out of the frontend — only access API keys inside Edge Functions
- Function names use kebab-case to match Supabase conventions
- Return JSON responses with appropriate status codes
- Catch all errors and return structured error responses
