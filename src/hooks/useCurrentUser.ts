import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  xp: number;
  current_streak: number;
  streak_last_date: string | null;
  wins: number;
  losses: number;
  created_at: string;
}

export function useCurrentUser() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['currentUser', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user,
  });
}
