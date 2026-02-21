import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useChallenges, useSendChallenge, useAcceptChallenge } from './useChallenges';

const mockUser = { id: 'user-123' };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockRpc = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    }),
    rpc: mockRpc,
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

describe('useChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches incoming challenges for the current user', async () => {
    const challenges = [
      {
        id: 'ch-1',
        challenger_id: 'user-456',
        challenged_id: 'user-123',
        quiz_id: 'quiz-1',
        status: 'pending',
        created_at: '2026-02-20T10:00:00Z',
        expires_at: '2026-02-21T10:00:00Z',
      },
    ];
    mockSelect.mockReturnValue({
      or: () => ({
        order: () => Promise.resolve({ data: challenges, error: null }),
      }),
    });

    const { result } = renderHook(() => useChallenges(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.length).toBeGreaterThan(0);
  });

  it('fetches outgoing challenges sent by the current user', async () => {
    const challenges = [
      {
        id: 'ch-2',
        challenger_id: 'user-123',
        challenged_id: 'user-789',
        quiz_id: 'quiz-2',
        status: 'pending',
        created_at: '2026-02-20T10:00:00Z',
        expires_at: '2026-02-21T10:00:00Z',
      },
    ];
    mockSelect.mockReturnValue({
      or: () => ({
        order: () => Promise.resolve({ data: challenges, error: null }),
      }),
    });

    const { result } = renderHook(() => useChallenges(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toBeDefined();
  });

  it('filters out expired challenges', async () => {
    const challenges = [
      {
        id: 'ch-expired',
        challenger_id: 'user-456',
        challenged_id: 'user-123',
        quiz_id: 'quiz-1',
        status: 'pending',
        created_at: '2026-02-18T10:00:00Z',
        expires_at: '2026-02-19T10:00:00Z', // already expired
      },
      {
        id: 'ch-valid',
        challenger_id: 'user-456',
        challenged_id: 'user-123',
        quiz_id: 'quiz-2',
        status: 'pending',
        created_at: '2026-02-20T10:00:00Z',
        expires_at: '2026-02-22T10:00:00Z', // still valid
      },
    ];
    mockSelect.mockReturnValue({
      or: () => ({
        order: () => Promise.resolve({ data: challenges, error: null }),
      }),
    });

    const { result } = renderHook(() => useChallenges(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should filter expired challenges client-side or via query
    const pending = result.current.data?.filter(
      (c) => c.status === 'pending'
    );
    if (pending) {
      for (const c of pending) {
        expect(new Date(c.expires_at).getTime()).toBeGreaterThan(Date.now());
      }
    }
  });

  it('handles supabase error', async () => {
    mockSelect.mockReturnValue({
      or: () => ({
        order: () =>
          Promise.resolve({ data: null, error: { message: 'DB error' } }),
      }),
    });

    const { result } = renderHook(() => useChallenges(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useSendChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a challenge via mutation', async () => {
    mockInsert.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              id: 'ch-new',
              challenger_id: 'user-123',
              challenged_id: 'user-456',
              quiz_id: 'quiz-1',
              status: 'pending',
              created_at: '2026-02-21T00:00:00Z',
              expires_at: '2026-02-22T00:00:00Z',
            },
            error: null,
          }),
      }),
    });

    const { result } = renderHook(() => useSendChallenge(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      challenged_id: 'user-456',
      quiz_id: 'quiz-1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockInsert).toHaveBeenCalled();
  });

  it('validates challenge is to a different user', async () => {
    const { result } = renderHook(() => useSendChallenge(), {
      wrapper: createWrapper(),
    });

    // Should not allow challenging yourself
    result.current.mutate({
      challenged_id: 'user-123', // same as current user
      quiz_id: 'quiz-1',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useAcceptChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts a pending challenge via mutation', async () => {
    mockUpdate.mockReturnValue({
      eq: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: {
                id: 'ch-1',
                status: 'accepted',
              },
              error: null,
            }),
        }),
      }),
    });

    const { result } = renderHook(() => useAcceptChallenge(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ challengeId: 'ch-1' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
