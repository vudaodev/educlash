import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SetupUsernamePage from './SetupUsernamePage';

const mockNavigate = vi.fn();
const mockRefreshProfile = vi.fn().mockResolvedValue(undefined);
const mockFrom = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@test.com', user_metadata: {} },
    refreshProfile: mockRefreshProfile,
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <SetupUsernamePage />
    </MemoryRouter>
  );
}

describe('SetupUsernamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form', () => {
    renderPage();
    expect(screen.getByText('Choose your username')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /let's go/i })).toBeInTheDocument();
  });

  it('shows validation error for short username', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Username'), 'ab');
    await user.click(screen.getByRole('button', { name: /let's go/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid characters', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Username'), 'bad name!');
    await user.click(screen.getByRole('button', { name: /let's go/i }));
    await waitFor(() => {
      expect(screen.getByText(/letters, numbers, and underscores only/i)).toBeInTheDocument();
    });
  });

  it('shows error when username is taken', async () => {
    const user = userEvent.setup();
    // Availability check returns existing user
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'other-user' }, error: null }),
        }),
      }),
    });

    renderPage();
    await user.type(screen.getByLabelText('Username'), 'taken_name');
    await user.click(screen.getByRole('button', { name: /let's go/i }));

    await waitFor(() => {
      expect(screen.getByText('Username is already taken')).toBeInTheDocument();
    });
  });

  it('shows server error on insert failure', async () => {
    const user = userEvent.setup();
    // Availability check: not taken
    const mockInsert = vi.fn().mockResolvedValue({
      error: { message: 'Database error' },
    });
    mockFrom
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({ insert: mockInsert });

    renderPage();
    await user.type(screen.getByLabelText('Username'), 'validname');
    await user.click(screen.getByRole('button', { name: /let's go/i }));

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument();
    });
  });

  it('navigates to /play on successful submit', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom
      .mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({ insert: mockInsert });

    renderPage();
    await user.type(screen.getByLabelText('Username'), 'validname');
    await user.click(screen.getByRole('button', { name: /let's go/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/play', { replace: true });
    });
    expect(mockRefreshProfile).toHaveBeenCalled();
  });

  it('shows "Setting up..." while submitting', async () => {
    const user = userEvent.setup();
    // Make the availability check hang so we can see the submitting state
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => new Promise(() => {}), // never resolves
        }),
      }),
    });

    renderPage();
    await user.type(screen.getByLabelText('Username'), 'validname');
    await user.click(screen.getByRole('button', { name: /let's go/i }));

    await waitFor(() => {
      expect(screen.getByText('Setting up...')).toBeInTheDocument();
    });
  });
});
