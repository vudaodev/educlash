import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from './ProfilePage';

const mockSignOut = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}));

const mockUseCurrentUser = vi.fn();
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton when loading', () => {
    mockUseCurrentUser.mockReturnValue({ isLoading: true, data: null });
    const { container } = render(<ProfilePage />);
    // Skeleton uses animate-pulse
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('displays user profile data', () => {
    mockUseCurrentUser.mockReturnValue({
      isLoading: false,
      data: {
        id: 'user-123',
        username: 'quizmaster',
        email: 'test@test.com',
        avatar_url: null,
        xp: 250,
        current_streak: 5,
        wins: 10,
        losses: 3,
        streak_last_date: null,
        created_at: '2026-01-01',
      },
    });
    render(<ProfilePage />);
    expect(screen.getByText('quizmaster')).toBeInTheDocument();
    expect(screen.getByText('250 XP')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // wins
    expect(screen.getByText('3')).toBeInTheDocument(); // losses
  });

  it('calculates level from XP correctly', () => {
    mockUseCurrentUser.mockReturnValue({
      isLoading: false,
      data: {
        id: 'u', username: 'x', email: 'e', avatar_url: null,
        xp: 350, current_streak: 0, wins: 0, losses: 0,
        streak_last_date: null, created_at: '',
      },
    });
    render(<ProfilePage />);
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('50 / 100 XP')).toBeInTheDocument();
  });

  it('applies orange styling for active streak', () => {
    mockUseCurrentUser.mockReturnValue({
      isLoading: false,
      data: {
        id: 'u', username: 'x', email: 'e', avatar_url: null,
        xp: 0, current_streak: 3, wins: 0, losses: 0,
        streak_last_date: null, created_at: '',
      },
    });
    const { container } = render(<ProfilePage />);
    const flame = container.querySelector('.text-orange-500');
    expect(flame).toBeInTheDocument();
  });

  it('calls signOut when button is clicked', async () => {
    const user = userEvent.setup();
    mockUseCurrentUser.mockReturnValue({
      isLoading: false,
      data: {
        id: 'u', username: 'x', email: 'e', avatar_url: null,
        xp: 0, current_streak: 0, wins: 0, losses: 0,
        streak_last_date: null, created_at: '',
      },
    });
    render(<ProfilePage />);
    await user.click(screen.getByText('Sign out'));
    expect(mockSignOut).toHaveBeenCalledOnce();
  });
});
