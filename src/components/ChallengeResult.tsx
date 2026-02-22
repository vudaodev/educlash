import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Frown, Minus } from 'lucide-react';

interface ChallengeResultProps {
  winnerId: string | null;
  currentUserId: string;
  myScore: number;
  opponentScore: number;
  myTime: number;
  opponentTime: number;
  opponentName: string;
  xpEarned: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ChallengeResult({
  winnerId,
  currentUserId,
  myScore,
  opponentScore,
  myTime,
  opponentTime,
  opponentName,
  xpEarned,
}: ChallengeResultProps) {
  const navigate = useNavigate();
  const isWinner = winnerId === currentUserId;
  const isDraw = winnerId === null;

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Winner/Loser banner */}
      <div className="flex flex-col items-center gap-2">
        {isWinner ? (
          <>
            <Trophy className="size-12 text-yellow-500" />
            <h1 className="text-2xl font-bold">You Won!</h1>
            <Badge className="bg-green-600 text-lg">+{xpEarned} XP</Badge>
          </>
        ) : isDraw ? (
          <>
            <Minus className="text-muted-foreground size-12" />
            <h1 className="text-2xl font-bold">Draw!</h1>
            <Badge variant="secondary" className="text-lg">
              +{xpEarned} XP
            </Badge>
          </>
        ) : (
          <>
            <Frown className="text-muted-foreground size-12" />
            <h1 className="text-2xl font-bold">You Lost</h1>
            <Badge variant="secondary" className="text-lg">
              +{xpEarned} XP
            </Badge>
          </>
        )}
      </div>

      {/* Score comparison */}
      <div className="w-full max-w-sm rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground text-sm">You</span>
            <span className="text-3xl font-bold">{myScore}%</span>
            <span className="text-muted-foreground text-sm">
              {formatTime(myTime)}
            </span>
          </div>
          <span className="text-muted-foreground text-lg font-bold">vs</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground text-sm">
              {opponentName}
            </span>
            <span className="text-3xl font-bold">{opponentScore}%</span>
            <span className="text-muted-foreground text-sm">
              {formatTime(opponentTime)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/play')}>
          Back to Play
        </Button>
      </div>
    </div>
  );
}
