import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const mockSignInWithGoogle = vi.fn();
const mockAuth = {
  user: null as { id: string } | null,
  loading: false,
  signInWithGoogle: mockSignInWithGoogle,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.loading = false;
    vi.clearAllMocks();
  });

  it('returns null when loading', () => {
    mockAuth.loading = true;
    const { container } = renderLogin();
    expect(container.innerHTML).toBe('');
  });

  it('redirects when user is already logged in', () => {
    mockAuth.user = { id: 'user-123' };
    renderLogin();
    // Navigate component doesn't render visible content
    expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
  });

  it('shows CTA and tagline', () => {
    renderLogin();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(
      screen.getByText(/Turn your lectures into battles/)
    ).toBeInTheDocument();
  });

  it('calls signInWithGoogle on button click', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByText('Continue with Google'));
    expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
  });
});
