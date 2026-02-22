import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface FriendshipUser {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  user: FriendshipUser;
  friend: FriendshipUser;
}

export function useFriends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friendships', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friendships')
        .select(
          '*, user:users!user_id(id, username, avatar_url, xp), friend:users!friend_id(id, username, avatar_url, xp)'
        )
        .or(`user_id.eq.${user!.id},friend_id.eq.${user!.id}`);
      if (error) throw error;
      return data as Friendship[];
    },
    enabled: !!user,
  });
}

export function useSendFriendRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId: string) => {
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          user_id: user!.id,
          friend_id: friendId,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });
}
