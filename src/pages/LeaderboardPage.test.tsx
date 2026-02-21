import { render, screen } from '@testing-library/react';
import LeaderboardPage from './LeaderboardPage';

describe('LeaderboardPage', () => {
  it('renders heading', () => {
    render(<LeaderboardPage />);
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });
});
