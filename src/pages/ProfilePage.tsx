import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';
import { FriendRequests } from '@/components/FriendRequests';
import { RecentActivity } from '@/components/RecentActivity';
import { TeamsSection } from '@/components/TeamsSection';

export default function ProfilePage() {
  const { data: profile, isLoading } = useCurrentUser();
  const { signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  const level = Math.floor(profile.xp / 100);
  const xpInLevel = profile.xp % 100;

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg">
              {profile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold">{profile.username}</h2>
          <div className="flex gap-2">
            <Badge variant="secondary">Level {level}</Badge>
            <Badge variant="outline">{profile.xp} XP</Badge>
          </div>
          <div className="w-full">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{xpInLevel} / 100 XP</span>
              <span>Level {level + 1}</span>
            </div>
            <Progress value={xpInLevel} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="flex flex-col items-center pt-4 pb-4">
            <Flame
              className={`h-6 w-6 ${profile.current_streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}
            />
            <span className="text-lg font-bold">{profile.current_streak}</span>
            <span className="text-xs text-muted-foreground">Streak</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center pt-4 pb-4">
            <span className="text-lg font-bold text-green-600">{profile.wins}</span>
            <span className="text-xs text-muted-foreground">Wins</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center pt-4 pb-4">
            <span className="text-lg font-bold text-destructive">{profile.losses}</span>
            <span className="text-xs text-muted-foreground">Losses</span>
          </CardContent>
        </Card>
      </div>

      <RecentActivity />

      <FriendRequests />

      <TeamsSection />

      <Button variant="outline" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
