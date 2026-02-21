import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChallengeResult } from './ChallengeResult';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const mockChallenge = {
  id: 'ch-1',
  challenger_id: 'user-123',
  challenged_id: 'user-456',
  quiz_id: 'quiz-1',
  status: 'completed' as const,
  winner_id: 'user-123',
  created_at: '2026-02-20T10:00:00Z',
  expires_at: '2026-02-21T10:00:00Z',
  challenger: { username: 'me' },
  challenged: { username: 'bob' },
  quiz: { title: 'CS101 Quiz' },
  attempts: [
    { user_id: 'user-123', score: 8, time_taken_seconds: 120 },
    { user_id: 'user-456', score: 6, time_taken_seconds: 150 },
  ],
};

function renderResult(challenge = mockChallenge) {
  return render(
    <MemoryRouter>
      <ChallengeResult challenge={challenge} />
    </MemoryRouter>
  );
}

describe('ChallengeResult', () => {
  it('displays both players scores', () => {
    renderResult();
    expect(screen.getByText(/8/)).toBeInTheDocument();
    expect(screen.getByText(/6/)).toBeInTheDocument();
  });

  it('shows winner banner', () => {
    renderResult();
    expect(
      screen.getByText(/win|victory|won/i)
    ).toBeInTheDocument();
  });

  it('shows XP earned', () => {
    renderResult();
    // Winner gets +25 XP
    expect(screen.getByText(/25.*xp|xp.*25/i)).toBeInTheDocument();
  });

  it('shows a rematch CTA', () => {
    renderResult();
    expect(
      screen.getByRole('button', { name: /rematch/i })
    ).toBeInTheDocument();
  });
});
