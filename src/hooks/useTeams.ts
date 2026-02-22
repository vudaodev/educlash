import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Team {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  team: Team;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export function useTeams() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teams', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*, team:teams(*)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data as TeamMembership[];
    },
    enabled: !!user,
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['team_members', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*, user:users(id, username, avatar_url)')
        .eq('team_id', teamId!);
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: codeData, error: codeError } = await supabase.rpc(
        'generate_invite_code'
      );
      if (codeError) throw codeError;
      const invite_code = codeData as string;

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ name, owner_id: user!.id, invite_code })
        .select()
        .single();
      if (teamError) throw teamError;

      const { error: memberError } = await supabase
        .from('team_members')
        .insert({ team_id: team.id, user_id: user!.id });
      if (memberError) throw memberError;

      return team as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useJoinTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: team, error: lookupError } = await supabase
        .from('teams')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();
      if (lookupError) throw new Error('Invalid invite code');

      const { error: joinError } = await supabase
        .from('team_members')
        .insert({ team_id: team.id, user_id: user!.id });
      if (joinError) throw joinError;

      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
