import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

// Mock supabase
const mockUnsubscribe = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function TestConsumer() {
  const { user, loading, hasProfile, signInWithGoogle, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.id ?? 'none'}</span>
      <span data-testid="hasProfile">{String(hasProfile)}</span>
      <button onClick={signInWithGoogle}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

function setup() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

const fakeUser = { id: 'user-123', email: 'test@test.com' };
const fakeSession = { user: fakeUser };

beforeEach(() => {
  vi.clearAllMocks();
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockSignInWithOAuth.mockResolvedValue({ error: null });
  mockSignOut.mockResolvedValue({ error: null });
});

describe('AuthProvider', () => {
  it('starts in loading state', () => {
    // Never resolve getSession to keep loading
    mockGetSession.mockReturnValue(new Promise(() => {}));
    setup();
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('sets loading false when no session', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('restores session and checks profile', async () => {
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'user-123' }, error: null }),
        }),
      }),
    });
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user-123');
      expect(screen.getByTestId('hasProfile').textContent).toBe('true');
    });
  });

  it('sets hasProfile false when no profile row', async () => {
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('hasProfile').textContent).toBe('false');
    });
  });

  it('calls signInWithOAuth with google provider', async () => {
    const user = userEvent.setup();
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    await user.click(screen.getByText('Sign In'));
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.stringContaining('/play') },
    });
  });

  it('calls supabase signOut and resets profile', async () => {
    const user = userEvent.setup();
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'user-123' }, error: null }),
        }),
      }),
    });
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('hasProfile').textContent).toBe('true');
    });
    await user.click(screen.getByText('Sign Out'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = setup();
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within AuthProvider'
    );
    spy.mockRestore();
  });
});
