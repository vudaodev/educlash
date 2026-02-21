import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Folder {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export function useFolders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['folders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at');
      if (error) throw error;
      return data as Folder[];
    },
    enabled: !!user,
  });
}

export function useCreateFolder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data, error } = await supabase
        .from('folders')
        .insert({ name: input.name, owner_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}
