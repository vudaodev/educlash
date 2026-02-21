import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Mock auth context
const mockAuth = {
  user: null as { id: string } | null,
  session: null,
  loading: false,
  hasProfile: null as boolean | null,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

function renderApp(route = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('App routing', () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.loading = false;
    mockAuth.hasProfile = null;
    vi.clearAllMocks();
  });

  it('renders login page on /login', async () => {
    renderApp('/login');
    await waitFor(() => {
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated user from /play to /login', async () => {
    renderApp('/play');
    await waitFor(() => {
      // Protected route redirects to login, no play content shown
      expect(screen.queryByText('Play')).not.toBeInTheDocument();
    });
  });

  it('renders play page for authenticated user with profile', async () => {
    mockAuth.user = { id: 'user-123' };
    mockAuth.hasProfile = true;
    renderApp('/play');
    await waitFor(() => {
      expect(screen.getByText('Upload materials, generate quizzes, and challenge friends.')).toBeInTheDocument();
    });
  });

  it('redirects unknown routes to /play', async () => {
    mockAuth.user = { id: 'user-123' };
    mockAuth.hasProfile = true;
    renderApp('/nonexistent');
    await waitFor(() => {
      expect(screen.getByText('Upload materials, generate quizzes, and challenge friends.')).toBeInTheDocument();
    });
  });

  it('renders app shell with bottom nav for main routes', async () => {
    mockAuth.user = { id: 'user-123' };
    mockAuth.hasProfile = true;
    renderApp('/play');
    await waitFor(() => {
      // BottomNav renders these links
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });
  });
});
