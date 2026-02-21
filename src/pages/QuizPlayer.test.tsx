import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import QuizPlayer from './QuizPlayer';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const mockQuizData = {
  id: 'quiz-1',
  title: 'CS101 Quiz',
  num_questions: 3,
  difficulty: 'medium',
  time_limit_seconds: 300,
  created_by: 'user-123',
  created_at: '2026-01-01',
  questions: [
    {
      id: 'q-1',
      quiz_id: 'quiz-1',
      question_text: 'What is 1+1?',
      options: ['1', '2', '3', '4'],
    },
    {
      id: 'q-2',
      quiz_id: 'quiz-1',
      question_text: 'What is 2+2?',
      options: ['2', '3', '4', '5'],
    },
    {
      id: 'q-3',
      quiz_id: 'quiz-1',
      question_text: 'What is 3+3?',
      options: ['5', '6', '7', '8'],
    },
  ],
};

const mockAnswers = { 'q-1': 1, 'q-2': 2, 'q-3': 1 };

const mockUseQuiz = vi.fn();
vi.mock('@/hooks/useQuiz', () => ({
  useQuiz: (...args: unknown[]) => mockUseQuiz(...args),
}));

const mockRpc = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function renderQuizPlayer() {
  const Wrapper = createWrapper();
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={['/quiz/quiz-1']}>
        <Routes>
          <Route path="/quiz/:quizId" element={<QuizPlayer />} />
        </Routes>
      </MemoryRouter>
    </Wrapper>
  );
}

describe('QuizPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockUseQuiz.mockReturnValue({
      data: mockQuizData,
      answers: mockAnswers,
      isLoading: false,
      isSuccess: true,
      isError: false,
    });
    mockRpc.mockResolvedValue({ data: { score: 3, xp_earned: 10 }, error: null });
  });

  it('renders the first question', () => {
    renderQuizPlayer();
    expect(screen.getByText('What is 1+1?')).toBeInTheDocument();
  });

  it('shows answer options for the current question', () => {
    renderQuizPlayer();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('navigates to next question', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();

    // Select an answer
    await user.click(screen.getByText('2'));

    // Click next
    const nextBtn = screen.getByRole('button', { name: /next/i });
    await user.click(nextBtn);

    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  });

  it('navigates to previous question', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();

    // Go to question 2
    await user.click(screen.getByText('2'));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Go back
    const prevBtn = screen.getByRole('button', { name: /prev|back/i });
    await user.click(prevBtn);

    expect(screen.getByText('What is 1+1?')).toBeInTheDocument();
  });

  it('displays a countdown timer', () => {
    renderQuizPlayer();
    // Should show time remaining (5:00 for 300 seconds)
    expect(
      screen.getByText(/5:00|5 min|300/)
    ).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    renderQuizPlayer();
    // Should show question number like "1/3" or "Question 1 of 3"
    expect(
      screen.getByText(/1.*3|1 of 3/i)
    ).toBeInTheDocument();
  });

  it('shows a progress bar', () => {
    const { container } = renderQuizPlayer();
    // Should have a progress bar element
    expect(
      screen.queryByRole('progressbar') ||
      container.querySelector('[class*="progress"]') ||
      container.querySelector('[role="progressbar"]')
    ).toBeTruthy();
  });

  it('shows submit button on last question', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();

    // Navigate to last question
    await user.click(screen.getByText('2'));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('4'));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // On last question, should see submit
    expect(
      screen.getByRole('button', { name: /submit/i })
    ).toBeInTheDocument();
  });

  it('calls submit_quiz_attempt RPC on submit', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();

    // Navigate to last question and submit
    await user.click(screen.getByText('2'));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('4'));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByText('6'));
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith(
        'submit_quiz_attempt',
        expect.objectContaining({
          p_quiz_id: 'quiz-1',
        })
      );
    });
  });

  it('auto-submits when timer reaches 0', async () => {
    vi.useFakeTimers();
    renderQuizPlayer();

    // Fast-forward past the time limit
    act(() => {
      vi.advanceTimersByTime(300_000); // 300 seconds
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith(
        'submit_quiz_attempt',
        expect.objectContaining({
          p_quiz_id: 'quiz-1',
        })
      );
    });

    vi.useRealTimers();
  });

  it('shows loading state while quiz is fetching', () => {
    mockUseQuiz.mockReturnValue({
      data: undefined,
      answers: undefined,
      isLoading: true,
      isSuccess: false,
      isError: false,
    });

    const { container } = renderQuizPlayer();
    expect(
      container.querySelector('[class*="animate-pulse"]') ||
      container.querySelector('[class*="animate-spin"]') ||
      screen.queryByText(/loading/i)
    ).toBeTruthy();
  });
});
