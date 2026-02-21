import { vi } from 'vitest';

export function createMockSupabaseClient() {
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
  });

  const mockGetSession = vi.fn().mockResolvedValue({
    data: { session: null },
    error: null,
  });

  const mockUnsubscribe = vi.fn();
  const mockOnAuthStateChange = vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });

  const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
  const mockSignOut = vi.fn().mockResolvedValue({ error: null });

  return {
    client: {
      from: mockFrom,
      auth: {
        getSession: mockGetSession,
        onAuthStateChange: mockOnAuthStateChange,
        signInWithOAuth: mockSignInWithOAuth,
        signOut: mockSignOut,
      },
    },
    mocks: {
      from: mockFrom,
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      insert: mockInsert,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithOAuth: mockSignInWithOAuth,
      signOut: mockSignOut,
      unsubscribe: mockUnsubscribe,
    },
  };
}
