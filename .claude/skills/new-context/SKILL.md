# Skill: new-context

Generate a React Context provider with hook.

## Usage

```
/new-context <context-name>
```

Example: `/new-context auth`, `/new-context theme`

## Instructions

1. Create a file at `src/contexts/<ContextName>Context.tsx`.

2. Use this template:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Types
interface <ContextName>State {
  // TODO: define state shape
  loading: boolean;
}

interface <ContextName>ContextValue extends <ContextName>State {
  // TODO: add action methods
}

// Context
const <ContextName>Context = createContext<<ContextName>ContextValue | undefined>(undefined);

// Provider
export function <ContextName>Provider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: initialization logic (e.g., auth listener, theme detection)
    setLoading(false);
  }, []);

  const value: <ContextName>ContextValue = {
    loading,
    // TODO: expose state and actions
  };

  return (
    <<ContextName>Context.Provider value={value}>
      {children}
    </<ContextName>Context.Provider>
  );
}

// Hook
export function use<ContextName>() {
  const context = useContext(<ContextName>Context);
  if (!context) {
    throw new Error('use<ContextName> must be used within <ContextName>Provider');
  }
  return context;
}
```

3. Wrap the app with the provider in `src/main.tsx`:

```tsx
import { <ContextName>Provider } from './contexts/<ContextName>Context';

// Add inside the render tree (order matters — outer providers available to inner)
<QueryClientProvider client={queryClient}>
  <<ContextName>Provider>
    <App />
  </<ContextName>Provider>
</QueryClientProvider>
```

4. For **AuthContext** specifically, include:
   - `supabase.auth.onAuthStateChange` listener in the `useEffect`
   - `user`, `session`, `loading` in state
   - `signInWithGoogle()`, `signOut()` as action methods
   - Query `users` table by `auth.uid()` on auth state change — redirect to `/setup-username` if no row exists

## Conventions

- One context per file in `src/contexts/`
- Always provide a custom hook (`use<ContextName>`) — never use the context directly
- Throw an error if the hook is used outside the provider (catches bugs early)
- Use contexts only for truly global state (auth, theme). For server state, use TanStack Query hooks instead.
- Keep context state minimal — derive computed values in components
