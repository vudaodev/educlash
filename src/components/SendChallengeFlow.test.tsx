import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { SendChallengeFlow } from './SendChallengeFlow';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const mockSelect = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
    }),
  },
}));

const mockSendMutate = vi.fn();
vi.mock('@/hooks/useChallenges', () => ({
  useSendChallenge: () => ({
    mutate: mockSendMutate,
    mutateAsync: mockSendMutate,
    isPending: false,
    isSuccess: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function renderFlow() {
  const onSent = vi.fn();
  const Wrapper = createWrapper();
  const result = render(
    <Wrapper>
      <SendChallengeFlow quizId="quiz-1" onSent={onSent} />
    </Wrapper>
  );
  return { ...result, onSent };
}

describe('SendChallengeFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a search input for finding friends', () => {
    renderFlow();
    expect(
      screen.getByRole('searchbox') ||
      screen.getByPlaceholderText(/search|find|username/i)
    ).toBeInTheDocument();
  });

  it('shows search results after typing', async () => {
    const user = userEvent.setup();
    mockSelect.mockReturnValue({
      ilike: () =>
        Promise.resolve({
          data: [
            { id: 'user-456', username: 'alice' },
            { id: 'user-789', username: 'bob' },
          ],
          error: null,
        }),
    });

    renderFlow();

    const searchInput =
      screen.getByRole('searchbox') ||
      screen.getByPlaceholderText(/search|find|username/i);
    await user.type(searchInput, 'ali');

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
  });

  it('shows a send button for each result', async () => {
    const user = userEvent.setup();
    mockSelect.mockReturnValue({
      ilike: () =>
        Promise.resolve({
          data: [{ id: 'user-456', username: 'alice' }],
          error: null,
        }),
    });

    renderFlow();

    const searchInput =
      screen.getByRole('searchbox') ||
      screen.getByPlaceholderText(/search|find|username/i);
    await user.type(searchInput, 'ali');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /send|challenge/i })
      ).toBeInTheDocument();
    });
  });

  it('calls useSendChallenge mutation when send is clicked', async () => {
    const user = userEvent.setup();
    mockSelect.mockReturnValue({
      ilike: () =>
        Promise.resolve({
          data: [{ id: 'user-456', username: 'alice' }],
          error: null,
        }),
    });
    mockSendMutate.mockResolvedValue(undefined);

    renderFlow();

    const searchInput =
      screen.getByRole('searchbox') ||
      screen.getByPlaceholderText(/search|find|username/i);
    await user.type(searchInput, 'ali');

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /send|challenge/i }));

    expect(mockSendMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        challenged_id: 'user-456',
        quiz_id: 'quiz-1',
      })
    );
  });

  it('calls onSent callback after successful send', async () => {
    const user = userEvent.setup();
    mockSelect.mockReturnValue({
      ilike: () =>
        Promise.resolve({
          data: [{ id: 'user-456', username: 'alice' }],
          error: null,
        }),
    });
    mockSendMutate.mockImplementation((_, opts) => {
      opts?.onSuccess?.();
    });

    const { onSent } = renderFlow();

    const searchInput =
      screen.getByRole('searchbox') ||
      screen.getByPlaceholderText(/search|find|username/i);
    await user.type(searchInput, 'ali');

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /send|challenge/i }));

    await waitFor(() => {
      expect(onSent).toHaveBeenCalled();
    });
  });
});
