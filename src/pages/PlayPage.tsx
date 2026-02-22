import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UploadMaterialModal } from '@/components/UploadMaterialModal';
import { CreateQuizModal } from '@/components/CreateQuizModal';
import { FolderView } from '@/components/FolderView';

export default function PlayPage() {
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Play</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQuizOpen(true)}>Create Quiz</Button>
          <Button onClick={() => setUploadOpen(true)}>Upload</Button>
        </div>
      </div>
      <p className="text-muted-foreground">
        Upload materials, generate quizzes, and challenge friends.
      </p>
      <FolderView />
      <UploadMaterialModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <CreateQuizModal open={quizOpen} onOpenChange={setQuizOpen} onQuizCreated={(id) => navigate(`/quiz/${id}`)} />
    </div>
  );
}
