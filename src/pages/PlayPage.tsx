import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UploadMaterialModal } from '@/components/UploadMaterialModal';
import { CreateQuizModal } from '@/components/CreateQuizModal';
import { FolderView } from '@/components/FolderView';
import { PendingChallenges } from '@/components/PendingChallenges';
import { SendChallengeFlow } from '@/components/SendChallengeFlow';
import { Swords } from 'lucide-react';

export default function PlayPage() {
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);

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

      <PendingChallenges />

      <h2 className="mt-2 text-lg font-semibold">Your Materials</h2>
      <FolderView />

      <UploadMaterialModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <CreateQuizModal open={quizOpen} onOpenChange={setQuizOpen} onQuizCreated={(id) => navigate(`/quiz/${id}`)} />
      <SendChallengeFlow open={challengeOpen} onOpenChange={setChallengeOpen} />
    </div>
  );
}
