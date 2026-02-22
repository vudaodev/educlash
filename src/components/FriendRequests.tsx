import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFriends, useAcceptFriendRequest } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function FriendRequests() {
  const { user } = useAuth();
  const { data: friendships, isLoading } = useFriends();
  const acceptMutation = useAcceptFriendRequest();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!friendships || !user) return null;

  const incoming = friendships.filter(
    (f) => f.status === 'pending' && f.friend_id === user.id
  );

  if (incoming.length === 0) return null;

  function handleAccept(friendshipId: string) {
    acceptMutation.mutate(friendshipId, {
      onSuccess: () => toast.success('Friend request accepted!'),
      onError: () => toast.error('Failed to accept request'),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Friend Requests</h3>
      {incoming.map((f) => (
        <div
          key={f.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={f.user.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {f.user.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{f.user.username}</span>
          </div>
          <Button
            size="sm"
            onClick={() => handleAccept(f.id)}
            disabled={acceptMutation.isPending}
          >
            Accept
          </Button>
        </div>
      ))}
    </div>
  );
}
