import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Swords, Trophy, Hourglass } from 'lucide-react';
import type { Challenge } from '@/hooks/useChallenges';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  onAccept?: (challengeId: string) => void;
  accepting?: boolean;
}

function timeRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">Pending</Badge>;
    case 'accepted':
      return <Badge variant="secondary">In Progress</Badge>;
    case 'completed':
      return <Badge>Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ChallengeCard({
  challenge,
  currentUserId,
  onAccept,
  accepting,
}: ChallengeCardProps) {
  const navigate = useNavigate();
  const isChallenger = challenge.challenger_id === currentUserId;
  const opponent = isChallenger ? challenge.challenged : challenge.challenger;
  const myAttempt = challenge.quiz_attempts.find(
    (a) => a.user_id === currentUserId
  );
  const opponentAttempt = challenge.quiz_attempts.find(
    (a) => a.user_id !== currentUserId
  );

  function handlePlay() {
    navigate(`/quiz/${challenge.quiz_id}?challenge_id=${challenge.id}`);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="text-primary size-4" />
          <span className="font-medium">{opponent.username}</span>
        </div>
        {statusBadge(challenge.status)}
      </div>

      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        <span>{challenge.quiz.question_count} questions</span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {challenge.quiz.time_limit_minutes}m
        </span>
      </div>

      {/* Pending: show accept or waiting */}
      {challenge.status === 'pending' && !isChallenger && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {timeRemaining(challenge.expires_at)}
          </span>
          <Button
            size="sm"
            onClick={() => onAccept?.(challenge.id)}
            disabled={accepting}
          >
            Accept
          </Button>
        </div>
      )}

      {challenge.status === 'pending' && isChallenger && (
        <p className="text-muted-foreground flex items-center gap-1 text-sm">
          <Hourglass className="size-3" />
          Waiting for {opponent.username} to accept
        </p>
      )}

      {/* Accepted: play or waiting for opponent */}
      {challenge.status === 'accepted' && !myAttempt && (
        <Button size="sm" onClick={handlePlay}>
          Play Now
        </Button>
      )}

      {challenge.status === 'accepted' && myAttempt && !opponentAttempt && (
        <p className="text-muted-foreground flex items-center gap-1 text-sm">
          <Hourglass className="size-3" />
          Waiting for {opponent.username} to play
        </p>
      )}

      {/* Completed: show results */}
      {challenge.status === 'completed' && myAttempt && opponentAttempt && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>
              You: {myAttempt.score}% — {opponent.username}:{' '}
              {opponentAttempt.score}%
            </span>
          </div>
          {myAttempt.score > opponentAttempt.score ||
          (myAttempt.score === opponentAttempt.score &&
            myAttempt.time_taken_seconds < opponentAttempt.time_taken_seconds) ? (
            <Badge className="bg-green-600">
              <Trophy className="mr-1 size-3" />
              Won
            </Badge>
          ) : myAttempt.score === opponentAttempt.score &&
            myAttempt.time_taken_seconds ===
              opponentAttempt.time_taken_seconds ? (
            <Badge variant="secondary">Draw</Badge>
          ) : (
            <Badge variant="destructive">Lost</Badge>
          )}
        </div>
      )}
    </div>
  );
}
