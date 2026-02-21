import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Material {
  id: string;
  owner_id: string;
  title: string;
  type: 'pdf' | 'pptx' | 'text';
  extracted_text: string;
  folder_id: string | null;
  file_url?: string | null;
  created_at: string;
}

export function useMaterials() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['materials', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Material[];
    },
    enabled: !!user,
  });
}

interface CreateMaterialInput {
  title: string;
  type: 'pdf' | 'pptx' | 'text';
  extracted_text: string;
  folder_id?: string | null;
  file_url?: string | null;
}

export function useCreateMaterial() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMaterialInput) => {
      const { data, error } = await supabase
        .from('materials')
        .insert({ ...input, owner_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}
