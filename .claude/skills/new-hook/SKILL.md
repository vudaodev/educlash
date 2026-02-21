# Skill: new-hook

Generate a TanStack Query hook for a given entity.

## Usage

```
/new-hook <entity>
```

Example: `/new-hook materials`, `/new-hook teams`, `/new-hook challenges`

## Instructions

1. Create a file at `src/hooks/use<Entity>.ts` (PascalCase entity name).

2. Use this template, replacing `<entity>` (camelCase plural), `<Entity>` (PascalCase singular), and `<table>` (snake_case table name):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Types — adjust columns to match the actual DB schema in tasks.md §1.2
export interface <Entity> {
  id: string;
  created_at: string;
  // TODO: add remaining columns from the <table> table
}

export interface Create<Entity>Input {
  // TODO: add required fields for insert
}

// Query key factory
const <entity>Keys = {
  all: ['<table>'] as const,
  detail: (id: string) => ['<table>', id] as const,
};

// Fetch all (with RLS — only returns rows the user can see)
export function use<Entity>s() {
  return useQuery({
    queryKey: <entity>Keys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('<table>')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as <Entity>[];
    },
  });
}

// Fetch one by ID
export function use<Entity>(id: string | undefined) {
  return useQuery({
    queryKey: <entity>Keys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('<table>')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as <Entity>;
    },
    enabled: !!id,
  });
}

// Create mutation
export function useCreate<Entity>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Create<Entity>Input) => {
      const { data, error } = await supabase
        .from('<table>')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as <Entity>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: <entity>Keys.all });
    },
  });
}

// Delete mutation
export function useDelete<Entity>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('<table>').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: <entity>Keys.all });
    },
  });
}
```

3. Replace the `TODO` comments with actual columns from the database schema. Refer to `tasks.md` §1.2 or the Supabase schema for the correct columns.

4. If the entity has relationships (e.g., `materials` belongs to `folders`), add appropriate `.eq()` filters or accept parent IDs as parameters.

5. Do NOT add mutations for operations handled by Postgres RPCs (e.g., `submit_quiz_attempt`, `complete_challenge`). Those should call `supabase.rpc()` instead.

## Conventions

- Import supabase from `@/lib/supabase`
- Use `@tanstack/react-query` — never raw `useEffect` + `useState` for server state
- Query key factories keep cache invalidation predictable
- All queries rely on RLS — no manual `auth.uid()` filters unless needed for a specific join
- `enabled` flag on detail queries prevents fetching with undefined IDs
