import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ChallengeUser {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
}

export interface ChallengeQuiz {
  id: string;
  question_count: number;
  time_limit_minutes: number;
  mode: string;
  created_at: string;
}

export interface ChallengeAttempt {
  id: string;
  user_id: string;
  score: number;
  time_taken_seconds: number;
}

export interface Challenge {
  id: string;
  quiz_id: string;
  challenger_id: string;
  challenged_id: string;
  status: 'pending' | 'accepted' | 'expired' | 'completed';
  expires_at: string;
  created_at: string;
  challenger: ChallengeUser;
  challenged: ChallengeUser;
  quiz: ChallengeQuiz;
  quiz_attempts: ChallengeAttempt[];
}

export function useChallenges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['challenges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select(
          '*, challenger:users!challenger_id(id, username, avatar_url, xp), challenged:users!challenged_id(id, username, avatar_url, xp), quiz:quizzes!quiz_id(id, question_count, time_limit_minutes, mode, created_at), quiz_attempts(id, user_id, score, time_taken_seconds)'
        )
        .or(`challenger_id.eq.${user!.id},challenged_id.eq.${user!.id}`)
        .neq('status', 'expired')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Challenge[];
    },
    enabled: !!user,
  });
}

export function useSendChallenge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quizId,
      challengedId,
    }: {
      quizId: string;
      challengedId: string;
    }) => {
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          quiz_id: quizId,
          challenger_id: user!.id,
          challenged_id: challengedId,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useAcceptChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const { data, error } = await supabase
        .from('challenges')
        .update({ status: 'accepted' })
        .eq('id', challengeId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useUserSearch(query: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, xp')
        .ilike('username', `%${query}%`)
        .neq('id', user!.id)
        .limit(10);
      if (error) throw error;
      return data as ChallengeUser[];
    },
    enabled: !!user && query.length >= 2,
  });
}

export function useMyQuizzes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-quizzes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, question_count, time_limit_minutes, mode, created_at')
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ChallengeQuiz[];
    },
    enabled: !!user,
  });
}
