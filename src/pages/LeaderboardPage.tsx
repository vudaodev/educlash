import { useMemo, useState } from 'react';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

type SortKey = 'xp' | 'streak' | 'wins';

function getRankDisplay(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function getStatValue(entry: LeaderboardEntry, sortKey: SortKey) {
  switch (sortKey) {
    case 'xp':
      return `${entry.xp} XP`;
    case 'streak':
      return `${entry.current_streak}d`;
    case 'wins':
      return `${entry.wins}W`;
  }
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { data: entries, isLoading } = useLeaderboard();
  const [sortKey, setSortKey] = useState<SortKey>('xp');

  const sorted = useMemo(() => {
    if (!entries) return [];
    return [...entries].sort((a, b) => {
      switch (sortKey) {
        case 'xp':
          return b.xp - a.xp;
        case 'streak':
          return b.current_streak - a.current_streak;
        case 'wins':
          return b.wins - a.wins;
      }
    });
  }, [entries, sortKey]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold">Leaderboard</h1>

      <Tabs
        defaultValue="xp"
        onValueChange={(v) => setSortKey(v as SortKey)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="xp">XP</TabsTrigger>
          <TabsTrigger value="streak">Streak</TabsTrigger>
          <TabsTrigger value="wins">Wins</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Add friends to see how you rank against them!
        </p>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="flex flex-col gap-2">
          {sorted.map((entry, i) => {
            const isCurrentUser = entry.id === user?.id;
            const rank = i + 1;

            return (
              <Card
                key={entry.id}
                className={
                  isCurrentUser
                    ? 'border-primary bg-primary/5'
                    : undefined
                }
              >
                <CardContent className="flex items-center gap-3 py-3">
                  <span className="w-8 text-center text-sm font-bold">
                    {getRankDisplay(rank)}
                  </span>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={entry.avatar_url ?? undefined} />
                    <AvatarFallback className="text-sm">
                      {entry.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {entry.username}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.wins}W / {entry.losses}L
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {getStatValue(entry, sortKey)}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
