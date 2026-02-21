import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadMaterialModal } from '@/components/UploadMaterialModal';
import { FolderView } from '@/components/FolderView';

export default function PlayPage() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Play</h1>
        <Button onClick={() => setUploadOpen(true)}>Upload</Button>
      </div>
      <p className="text-muted-foreground">
        Upload materials, generate quizzes, and challenge friends.
      </p>
      <FolderView />
      <UploadMaterialModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
