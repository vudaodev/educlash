import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Swords, CheckCircle2 } from 'lucide-react';
import {
  useUserSearch,
  useSendChallenge,
  type ChallengeUser,
} from '@/hooks/useChallenges';
import { useMaterials } from '@/hooks/useMaterials';
import { supabase } from '@/lib/supabase';

interface SendChallengeFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUser?: ChallengeUser;
}

const configSchema = z.object({
  question_count: z.coerce.number().min(1).max(50),
  time_limit_minutes: z.coerce.number().min(1).max(120),
});

type ConfigValues = z.output<typeof configSchema>;

export function SendChallengeFlow({ open, onOpenChange, initialUser }: SendChallengeFlowProps) {
  const [step, setStep] = useState<'search' | 'materials' | 'config' | 'generating'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ChallengeUser | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  const { data: searchResults, isLoading: searching } =
    useUserSearch(debouncedQuery);
  const { data: materials, isLoading: materialsLoading } = useMaterials();
  const sendChallenge = useSendChallenge();

  const form = useForm<ConfigValues>({
    resolver: zodResolver(configSchema) as never,
    defaultValues: {
      question_count: 10,
      time_limit_minutes: 5,
    },
  });

  // Skip to materials step when an initial user is provided
  useEffect(() => {
    if (open && initialUser) {
      setSelectedUser(initialUser);
      setStep('materials');
    }
  }, [open, initialUser]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSelectUser(user: ChallengeUser) {
    setSelectedUser(user);
    setStep('materials');
  }

  function toggleMaterial(id: string) {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function handleGenerate(values: ConfigValues) {
    if (!selectedUser) return;
    setStep('generating');

    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        material_ids: selectedMaterials,
        question_count: values.question_count,
        time_limit_minutes: values.time_limit_minutes,
        mode: 'competitive',
      },
    });

    if (error || !data?.quiz_id) {
      setStep('config');
      toast.error('Failed to generate quiz. Please try again.');
      return;
    }

    sendChallenge.mutate(
      { quizId: data.quiz_id, challengedId: selectedUser.id },
      {
        onSuccess: () => {
          toast.success(`Challenge sent to ${selectedUser.username}!`);
          handleClose();
        },
        onError: () => {
          toast.error('Failed to send challenge');
          handleClose();
        },
      }
    );
  }

  function handleClose() {
    onOpenChange(false);
    setStep('search');
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedUser(null);
    setSelectedMaterials([]);
    form.reset();
  }

  const stepDescription = {
    search: 'Search for a player to challenge.',
    materials: `Select materials to generate a quiz for ${selectedUser?.username}.`,
    config: 'Configure your quiz settings.',
    generating: 'Generating quiz and sending challenge...',
  };

  return (
    <Dialog open={open} onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Swords className="mr-2 inline size-5" />
            Send Challenge
          </DialogTitle>
          <DialogDescription>{stepDescription[step]}</DialogDescription>
        </DialogHeader>

        {step === 'search' && (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {searching && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {searchResults && searchResults.length === 0 && debouncedQuery.length >= 2 && (
              <p className="text-muted-foreground text-center text-sm">
                No users found
              </p>
            )}

            {searchResults?.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectUser(u)}
                className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 text-left transition-colors"
              >
                <div>
                  <p className="font-medium">{u.username}</p>
                  <p className="text-muted-foreground text-sm">{u.xp} XP</p>
                </div>
                <Badge variant="outline">Challenge</Badge>
              </button>
            ))}
          </div>
        )}

        {step === 'materials' && (
          <div className="flex flex-col gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => setStep('search')}
            >
              &larr; Back
            </Button>

            {materialsLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {materials?.map((mat) => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => toggleMaterial(mat.id)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      selectedMaterials.includes(mat.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span>{mat.title}</span>
                    {selectedMaterials.includes(mat.id) && (
                      <CheckCircle2 className="text-primary size-5" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={() => setStep('config')}
              disabled={selectedMaterials.length === 0}
            >
              Next
            </Button>
          </div>
        )}

        {step === 'config' && (
          <form
            onSubmit={form.handleSubmit(handleGenerate)}
            className="flex flex-col gap-4"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => setStep('materials')}
            >
              &larr; Back
            </Button>

            <div className="flex flex-col gap-2">
              <Label htmlFor="question_count">Number of Questions</Label>
              <Input
                id="question_count"
                type="number"
                {...form.register('question_count')}
              />
              {form.formState.errors.question_count && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.question_count.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="time_limit_minutes">Time Limit (minutes)</Label>
              <Input
                id="time_limit_minutes"
                type="number"
                {...form.register('time_limit_minutes')}
              />
              {form.formState.errors.time_limit_minutes && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.time_limit_minutes.message}
                </p>
              )}
            </div>

            <Button type="submit">Generate & Send Challenge</Button>
          </form>
        )}

        {step === 'generating' && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
