import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Clock, Swords } from 'lucide-react';
import {
  useUserSearch,
  useMyQuizzes,
  useSendChallenge,
  type ChallengeUser,
} from '@/hooks/useChallenges';

interface SendChallengeFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendChallengeFlow({ open, onOpenChange }: SendChallengeFlowProps) {
  const [step, setStep] = useState<'search' | 'pick-quiz'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ChallengeUser | null>(null);

  const { data: searchResults, isLoading: searching } =
    useUserSearch(debouncedQuery);
  const { data: quizzes, isLoading: loadingQuizzes } = useMyQuizzes();
  const sendChallenge = useSendChallenge();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSelectUser(user: ChallengeUser) {
    setSelectedUser(user);
    setStep('pick-quiz');
  }

  function handleSend(quizId: string) {
    if (!selectedUser) return;
    sendChallenge.mutate(
      { quizId, challengedId: selectedUser.id },
      {
        onSuccess: () => {
          toast.success(`Challenge sent to ${selectedUser.username}!`);
          handleClose();
        },
        onError: () => toast.error('Failed to send challenge'),
      }
    );
  }

  function handleClose() {
    onOpenChange(false);
    setStep('search');
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedUser(null);
  }

  return (
    <Dialog open={open} onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Swords className="mr-2 inline size-5" />
            Send Challenge
          </DialogTitle>
          <DialogDescription>
            {step === 'search'
              ? 'Search for a player to challenge.'
              : `Pick a quiz to challenge ${selectedUser?.username}.`}
          </DialogDescription>
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

        {step === 'pick-quiz' && (
          <div className="flex flex-col gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => setStep('search')}
            >
              &larr; Back
            </Button>

            {loadingQuizzes && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}

            {quizzes && quizzes.length === 0 && (
              <p className="text-muted-foreground text-center text-sm">
                No quizzes yet. Create one first!
              </p>
            )}

            {quizzes?.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSend(q.id)}
                disabled={sendChallenge.isPending}
                className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 text-left transition-colors disabled:opacity-50"
              >
                <div>
                  <p className="font-medium">
                    {q.question_count} questions
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Clock className="size-3" />
                    {q.time_limit_minutes} min
                  </p>
                </div>
                <Badge>{q.mode}</Badge>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
