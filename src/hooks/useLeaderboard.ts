import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from './useFriends';

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  current_streak: number;
  wins: number;
  losses: number;
}

export interface HeadToHeadRecord {
  wins: number;
  losses: number;
}

export function useLeaderboard() {
  const { user } = useAuth();
  const { data: friendships } = useFriends();

  // Extract accepted friend IDs
  const friendIds = friendships
    ?.filter((f) => f.status === 'accepted')
    .map((f) => (f.user_id === user?.id ? f.friend_id : f.user_id)) ?? [];

  const allIds = user ? [...new Set([...friendIds, user.id])] : [];

  return useQuery({
    queryKey: ['leaderboard', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, xp, current_streak, wins, losses')
        .in('id', allIds);
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    enabled: !!user && !!friendships && allIds.length > 0,
  });
}

interface ChallengeRow {
  challenger_id: string;
  challenged_id: string;
  quiz_attempts: { user_id: string; score: number; time_taken_seconds: number }[];
}

export function useHeadToHead() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['head-to-head', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('challenger_id, challenged_id, quiz_attempts(user_id, score, time_taken_seconds)')
        .or(`challenger_id.eq.${user!.id},challenged_id.eq.${user!.id}`)
        .eq('status', 'completed');
      if (error) throw error;

      const records: Record<string, HeadToHeadRecord> = {};

      for (const challenge of data as ChallengeRow[]) {
        const opponentId = challenge.challenger_id === user!.id
          ? challenge.challenged_id
          : challenge.challenger_id;

        const myAttempt = challenge.quiz_attempts.find((a) => a.user_id === user!.id);
        const theirAttempt = challenge.quiz_attempts.find((a) => a.user_id === opponentId);

        if (!myAttempt || !theirAttempt) continue;

        if (!records[opponentId]) records[opponentId] = { wins: 0, losses: 0 };

        // Same logic as complete_challenge: higher score wins, faster time breaks ties
        const iWin =
          myAttempt.score > theirAttempt.score ||
          (myAttempt.score === theirAttempt.score &&
            myAttempt.time_taken_seconds <= theirAttempt.time_taken_seconds);

        if (iWin) {
          records[opponentId].wins++;
        } else {
          records[opponentId].losses++;
        }
      }

      return records;
    },
    enabled: !!user,
  });
}
