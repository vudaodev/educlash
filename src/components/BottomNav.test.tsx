import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';

function renderNav(initialRoute = '/play') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <BottomNav />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renders three navigation links', () => {
    renderNav();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('links to correct routes', () => {
    renderNav();
    expect(screen.getByText('Profile').closest('a')).toHaveAttribute('href', '/profile');
    expect(screen.getByText('Play').closest('a')).toHaveAttribute('href', '/play');
    expect(screen.getByText('Leaderboard').closest('a')).toHaveAttribute('href', '/leaderboard');
  });

  it('applies active styling to current route', () => {
    renderNav('/profile');
    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink?.className).toContain('font-semibold');
  });
});
