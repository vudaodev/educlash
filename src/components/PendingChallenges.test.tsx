import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PendingChallenges } from './PendingChallenges';

const mockUseChallenges = vi.fn();

vi.mock('@/hooks/useChallenges', () => ({
  useChallenges: () => mockUseChallenges(),
}));

function renderComponent() {
  return render(
    <MemoryRouter>
      <PendingChallenges />
    </MemoryRouter>
  );
}

describe('PendingChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list of pending challenges', () => {
    mockUseChallenges.mockReturnValue({
      data: [
        {
          id: 'ch-1',
          challenger_id: 'user-456',
          challenged_id: 'user-123',
          quiz_id: 'quiz-1',
          status: 'pending',
          created_at: '2026-02-20T10:00:00Z',
          expires_at: '2026-02-21T10:00:00Z',
          challenger: { username: 'alice' },
          quiz: { title: 'CS101 Quiz' },
        },
      ],
      isLoading: false,
    });

    renderComponent();
    expect(screen.getByText(/alice/i)).toBeInTheDocument();
  });

  it('shows empty state when no pending challenges', () => {
    mockUseChallenges.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderComponent();
    expect(screen.getByText(/no.*challenge/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseChallenges.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderComponent();
    expect(
      container.querySelector('[class*="animate-pulse"]') ||
      screen.queryByText(/loading/i)
    ).toBeTruthy();
  });
});
