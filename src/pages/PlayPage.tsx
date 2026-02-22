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
import { useUserSearch, type ChallengeUser } from '@/hooks/useChallenges';
import { useFriends, useSendFriendRequest, type Friendship } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [challengeUser, setChallengeUser] = useState<ChallengeUser | null>(null);
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

  function handleChallenge(userId: string) {
    const match = searchResults?.find((u) => u.id === userId) ?? null;
    setChallengeUser(match);
    setChallengeOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
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

      <Tabs defaultValue="challenges">
        <TabsList className="w-full">
          <TabsTrigger value="challenges" className="flex-1">Challenges</TabsTrigger>
          <TabsTrigger value="results" className="flex-1">Recent Results</TabsTrigger>
          <TabsTrigger value="materials" className="flex-1">Your Material</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="flex flex-col gap-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setChallengeOpen(true)}
          >
            <Swords className="mr-2 size-4" />
            Challenge a Friend
          </Button>
          <PendingChallenges filter="active" />
        </TabsContent>

        <TabsContent value="results">
          <PendingChallenges filter="completed" />
        </TabsContent>

        <TabsContent value="materials" className="flex flex-col gap-3">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuizOpen(true)}>Create Quiz</Button>
            <Button size="sm" onClick={() => setUploadOpen(true)}>Upload</Button>
          </div>
          <FolderView />
        </TabsContent>
      </Tabs>

      <UploadMaterialModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <CreateQuizModal open={quizOpen} onOpenChange={setQuizOpen} onQuizCreated={(id) => navigate(`/quiz/${id}`)} />
      <SendChallengeFlow
        open={challengeOpen}
        onOpenChange={(val) => {
          setChallengeOpen(val);
          if (!val) setChallengeUser(null);
        }}
        initialUser={challengeUser ?? undefined}
      />
    </div>
  );
}
