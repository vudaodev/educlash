import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface RawQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
}

interface RawQuiz {
  id: string;
  creator_id: string;
  question_count: number;
  time_limit_minutes: number;
  mode: string;
  created_at: string;
  questions: RawQuestion[];
  // Fields from test mocks (may or may not exist in DB)
  title?: string;
  num_questions?: number;
  time_limit_seconds?: number;
  difficulty?: string;
  created_by?: string;
}

export interface Quiz {
  id: string;
  title?: string;
  num_questions: number;
  difficulty?: string;
  time_limit_seconds: number;
  created_by?: string;
  created_at: string;
  questions: Question[];
  [key: string]: unknown;
}

export function useQuiz(quizId: string) {
  const answersRef = useRef<Record<string, number>>({});

  const query = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*, questions(*)')
        .eq('id', quizId)
        .single();
      if (error) throw error;
      return data as RawQuiz;
    },
    enabled: !!quizId,
  });

  const processed = useMemo(() => {
    if (!query.data) return undefined;

    const rawQuestions = query.data.questions as RawQuestion[];
    const answers: Record<string, number> = {};
    const strippedQuestions: Question[] = rawQuestions.map((q) => {
      answers[q.id] = q.correct_option_index;
      const { correct_option_index: _, ...rest } = q;
      return rest;
    });

    answersRef.current = answers;

    const raw = query.data;
    return {
      ...raw,
      // Normalize DB fields to match interface (tests may provide either form)
      num_questions: raw.num_questions ?? raw.question_count,
      time_limit_seconds: raw.time_limit_seconds ?? raw.time_limit_minutes * 60,
      questions: strippedQuestions,
    } as Quiz;
  }, [query.data]);

  return {
    data: processed,
    answers: query.data ? answersRef.current : undefined,
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
    isError: query.isError,
  };
}
