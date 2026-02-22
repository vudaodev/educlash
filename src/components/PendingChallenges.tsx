import { Skeleton } from '@/components/ui/skeleton';
import { ChallengeCard } from '@/components/ChallengeCard';
import {
  useChallenges,
  useAcceptChallenge,
  type Challenge,
} from '@/hooks/useChallenges';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function categorize(challenges: Challenge[], userId: string) {
  const now = Date.now();
  const pending: Challenge[] = [];
  const active: Challenge[] = [];
  const waiting: Challenge[] = [];
  const completed: Challenge[] = [];

  for (const c of challenges) {
    if (c.status === 'pending') {
      if (new Date(c.expires_at).getTime() < now) continue; // expired
      pending.push(c);
    } else if (c.status === 'accepted') {
      const myAttempt = c.quiz_attempts.find((a) => a.user_id === userId);
      if (!myAttempt) active.push(c);
      else waiting.push(c);
    } else if (c.status === 'completed') {
      completed.push(c);
    }
  }

  return { pending, active, waiting, completed };
}

export function PendingChallenges({ filter }: { filter?: 'active' | 'completed' } = {}) {
  const { user } = useAuth();
  const { data: challenges, isLoading } = useChallenges();
  const acceptMutation = useAcceptChallenge();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!challenges || !user) return null;

  const { pending, active, waiting, completed } = categorize(
    challenges,
    user.id
  );

  const showActive = filter !== 'completed';
  const showCompleted = filter !== 'active';

  const hasAny = showActive
    ? pending.length > 0 || active.length > 0 || waiting.length > 0
    : completed.length > 0;

  if (!hasAny) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        {showActive ? 'No challenges yet. Send one to a friend!' : 'No results yet.'}
      </p>
    );
  }

  function handleAccept(challengeId: string) {
    acceptMutation.mutate(challengeId, {
      onSuccess: () => toast.success('Challenge accepted!'),
      onError: () => toast.error('Failed to accept challenge'),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {showActive && pending.length > 0 && (
        <Section title="Challenges">
          {pending.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              currentUserId={user.id}
              onAccept={handleAccept}
              accepting={acceptMutation.isPending}
            />
          ))}
        </Section>
      )}

      {showActive && active.length > 0 && (
        <Section title="Your Turn">
          {active.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              currentUserId={user.id}
            />
          ))}
        </Section>
      )}

      {showActive && waiting.length > 0 && (
        <Section title="Waiting for Opponent">
          {waiting.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              currentUserId={user.id}
            />
          ))}
        </Section>
      )}

      {showCompleted && completed.length > 0 && (
        <Section title="Recent Results">
          {completed.slice(0, 5).map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              currentUserId={user.id}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}
