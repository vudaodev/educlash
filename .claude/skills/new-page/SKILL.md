# Skill: new-page

Generate a page component with routing integration.

## Usage

```
/new-page <page-name>
```

Example: `/new-page quiz-history`, `/new-page team-detail`, `/new-page folder-view`

## Instructions

1. Create a file at `src/pages/<PageName>Page.tsx` (PascalCase, suffixed with `Page`).

2. Use this template:

```tsx
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function <PageName>Page() {
  // If the page needs a URL param:
  // const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold"><PageTitle></h1>

      {/* Page content */}
      <Card>
        <CardHeader>
          <CardTitle>TODO</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Content goes here</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

3. Add the route to `src/App.tsx`:

```tsx
// Import at top
const <PageName>Page = lazy(() => import('./pages/<PageName>Page'));

// Inside <Routes>, wrapped in ProtectedRoute:
<Route
  path="/<url-path>"
  element={
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <<PageName>Page />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

4. If the page should NOT require authentication (e.g., a public landing page), skip the `<ProtectedRoute>` wrapper and note this to the user.

5. If the page needs data, import and use the appropriate hook from `src/hooks/`.

## Conventions

- Mobile-first: design for 375px width, use responsive Tailwind classes to scale up
- `pb-24` on the outer div leaves room for the `BottomNav` component
- `px-4` for consistent horizontal padding
- Use only shadcn/ui components — no other component libraries
- Lazy-load all pages with `React.lazy` + `Suspense`
- Pages are default exports
- URL paths use kebab-case (`/quiz-history`), component names use PascalCase (`QuizHistoryPage`)
