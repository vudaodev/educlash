import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, Swords, Loader2 } from 'lucide-react';

interface UserSearchResultProps {
  user: { id: string; username: string; avatar_url: string | null; xp: number };
  friendshipStatus: 'none' | 'pending' | 'accepted';
  onAddFriend: (userId: string) => void;
  onChallenge: (userId: string) => void;
  isPending?: boolean;
}

export function UserSearchResult({
  user,
  friendshipStatus,
  onAddFriend,
  onChallenge,
  isPending,
}: UserSearchResultProps) {
  return (
    <div className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">
            {user.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.username}</p>
          <p className="text-muted-foreground text-xs">{user.xp} XP</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {friendshipStatus === 'none' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddFriend(user.id)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <UserPlus className="mr-1 size-3" />
            )}
            Add
          </Button>
        )}
        {friendshipStatus === 'pending' && (
          <Badge variant="secondary">Pending</Badge>
        )}
        {friendshipStatus === 'accepted' && (
          <Badge variant="default">Friends</Badge>
        )}
        <Button size="sm" onClick={() => onChallenge(user.id)}>
          <Swords className="mr-1 size-3" />
          Challenge
        </Button>
      </div>
    </div>
  );
}
