import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useQuiz } from './useQuiz';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const mockSingle = vi.fn();
const mockSelect = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
    }),
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

describe('useQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches quiz with questions by quizId', async () => {
    const quiz = {
      id: 'quiz-1',
      title: 'CS101 Quiz',
      num_questions: 5,
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
          correct_option_index: 1,
        },
      ],
    };
    mockSelect.mockReturnValue({
      eq: () => ({
        single: () => Promise.resolve({ data: quiz, error: null }),
      }),
    });

    const { result } = renderHook(() => useQuiz('quiz-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe('quiz-1');
  });

  it('does not expose correct_option_index to the component', async () => {
    const quiz = {
      id: 'quiz-1',
      title: 'Quiz',
      num_questions: 1,
      difficulty: 'easy',
      time_limit_seconds: 60,
      created_by: 'user-123',
      created_at: '2026-01-01',
      questions: [
        {
          id: 'q-1',
          quiz_id: 'quiz-1',
          question_text: 'Q?',
          options: ['A', 'B'],
          correct_option_index: 0,
        },
      ],
    };
    mockSelect.mockReturnValue({
      eq: () => ({
        single: () => Promise.resolve({ data: quiz, error: null }),
      }),
    });

    const { result } = renderHook(() => useQuiz('quiz-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The hook should strip correct_option_index from questions
    // so the quiz player UI cannot cheat
    const questions = result.current.data?.questions ?? [];
    for (const q of questions) {
      expect(q).not.toHaveProperty('correct_option_index');
    }
  });

  it('stores correct answers separately for submission', async () => {
    const quiz = {
      id: 'quiz-1',
      title: 'Quiz',
      num_questions: 2,
      difficulty: 'easy',
      time_limit_seconds: 60,
      created_by: 'user-123',
      created_at: '2026-01-01',
      questions: [
        { id: 'q-1', quiz_id: 'quiz-1', question_text: 'Q1?', options: ['A', 'B'], correct_option_index: 0 },
        { id: 'q-2', quiz_id: 'quiz-1', question_text: 'Q2?', options: ['C', 'D'], correct_option_index: 1 },
      ],
    };
    mockSelect.mockReturnValue({
      eq: () => ({
        single: () => Promise.resolve({ data: quiz, error: null }),
      }),
    });

    const { result } = renderHook(() => useQuiz('quiz-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The hook should provide answers separately
    expect(result.current.answers).toBeDefined();
    expect(result.current.answers).toEqual({ 'q-1': 0, 'q-2': 1 });
  });

  it('handles supabase error', async () => {
    mockSelect.mockReturnValue({
      eq: () => ({
        single: () =>
          Promise.resolve({ data: null, error: { message: 'Not found' } }),
      }),
    });

    const { result } = renderHook(() => useQuiz('nonexistent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
