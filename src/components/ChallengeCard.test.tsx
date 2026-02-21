import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChallengeCard } from './ChallengeCard';

const mockChallenge = {
  id: 'ch-1',
  challenger_id: 'user-456',
  challenged_id: 'user-123',
  quiz_id: 'quiz-1',
  status: 'pending' as const,
  created_at: '2026-02-20T10:00:00Z',
  expires_at: '2026-02-21T10:00:00Z',
  challenger: { username: 'alice' },
  quiz: { title: 'CS101 Quiz' },
};

describe('ChallengeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays the challenger name', () => {
    render(<ChallengeCard challenge={mockChallenge} onAccept={vi.fn()} />);
    expect(screen.getByText(/alice/i)).toBeInTheDocument();
  });

  it('shows quiz info', () => {
    render(<ChallengeCard challenge={mockChallenge} onAccept={vi.fn()} />);
    expect(screen.getByText(/CS101 Quiz/i)).toBeInTheDocument();
  });

  it('shows expiry information', () => {
    render(<ChallengeCard challenge={mockChallenge} onAccept={vi.fn()} />);
    // Should show some indication of when the challenge expires
    expect(
      screen.getByText(/expir/i) || screen.getByText(/time/i)
    ).toBeInTheDocument();
  });

  it('renders an accept button', () => {
    render(<ChallengeCard challenge={mockChallenge} onAccept={vi.fn()} />);
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
  });

  it('calls onAccept with challenge id when accept is clicked', async () => {
    const onAccept = vi.fn();
    const user = userEvent.setup();

    render(<ChallengeCard challenge={mockChallenge} onAccept={onAccept} />);
    await user.click(screen.getByRole('button', { name: /accept/i }));

    expect(onAccept).toHaveBeenCalledWith('ch-1');
  });
});
