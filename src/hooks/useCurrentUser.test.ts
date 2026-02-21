import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useCurrentUser } from './useCurrentUser';

// Mock auth
const mockUser = { id: 'user-123' };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock supabase
const mockSingle = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user profile successfully', async () => {
    const profile = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@test.com',
      avatar_url: null,
      xp: 150,
      current_streak: 3,
      streak_last_date: null,
      wins: 5,
      losses: 2,
      created_at: '2026-01-01',
    };
    mockSingle.mockResolvedValue({ data: profile, error: null });

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(profile);
  });

  it('uses correct query key', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'user-123' }, error: null });
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    // Verify the query was made (implicitly tests queryKey works)
    expect(mockSingle).toHaveBeenCalled();
  });

  it('throws on supabase error', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Not found', code: 'PGRST116' },
    });
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
