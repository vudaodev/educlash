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
