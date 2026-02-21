import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(20, 'Max 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
});

type UsernameForm = z.infer<typeof usernameSchema>;

export default function SetupUsernamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
  });

  async function onSubmit({ username }: UsernameForm) {
    setServerError('');

    // Check availability
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      setServerError('Username is already taken');
      return;
    }

    const { error } = await supabase.from('users').insert({
      id: user!.id,
      username,
      email: user!.email!,
      avatar_url: user!.user_metadata?.avatar_url ?? null,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    navigate('/play', { replace: true });
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Choose your username</h1>
        <p className="text-muted-foreground">This is how other players will find you</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-xs flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="e.g. quizmaster99"
            {...register('username')}
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Setting up...' : "Let's go"}
        </Button>
      </form>
    </div>
  );
}
