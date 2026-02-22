import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadMaterialModal } from '@/components/UploadMaterialModal';
import { CreateQuizModal } from '@/components/CreateQuizModal';
import { FolderView } from '@/components/FolderView';
import { PendingChallenges } from '@/components/PendingChallenges';
import { SendChallengeFlow } from '@/components/SendChallengeFlow';
import { UserSearchResult } from '@/components/UserSearchResult';
import { useUserSearch } from '@/hooks/useChallenges';
import { useFriends, useSendFriendRequest, type Friendship } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Swords, Search } from 'lucide-react';

function getFriendshipStatus(
  userId: string,
  friendships: Friendship[],
  currentUserId: string
): 'none' | 'pending' | 'accepted' {
  const match = friendships.find(
    (f) =>
      (f.user_id === currentUserId && f.friend_id === userId) ||
      (f.friend_id === currentUserId && f.user_id === userId)
  );
  if (!match) return 'none';
  return match.status;
}

export default function PlayPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data: searchResults, isLoading: searching } = useUserSearch(debouncedQuery);
  const { data: friendships } = useFriends();
  const sendFriendRequest = useSendFriendRequest();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleAddFriend(userId: string) {
    sendFriendRequest.mutate(userId, {
      onSuccess: () => toast.success('Friend request sent!'),
      onError: () => toast.error('Failed to send friend request'),
    });
  }

  function handleChallenge(_userId: string) {
    setChallengeOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Play</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQuizOpen(true)}>Create Quiz</Button>
          <Button onClick={() => setUploadOpen(true)}>Upload</Button>
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => setChallengeOpen(true)}
      >
        <Swords className="mr-2 size-4" />
        Challenge a Friend
      </Button>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
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
          <UserSearchResult
            key={u.id}
            user={u}
            friendshipStatus={getFriendshipStatus(u.id, friendships ?? [], user?.id ?? '')}
            onAddFriend={handleAddFriend}
            onChallenge={handleChallenge}
            isPending={sendFriendRequest.isPending}
          />
        ))}
      </div>

      <PendingChallenges />

      <h2 className="mt-2 text-lg font-semibold">Your Materials</h2>
      <FolderView />

      <UploadMaterialModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <CreateQuizModal open={quizOpen} onOpenChange={setQuizOpen} onQuizCreated={(id) => navigate(`/quiz/${id}`)} />
      <SendChallengeFlow open={challengeOpen} onOpenChange={setChallengeOpen} />
    </div>
  );
}
