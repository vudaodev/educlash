import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateMaterial } from '@/hooks/useMaterials';
import { extractPdfText } from '@/lib/extractPdf';
import { extractPptxText } from '@/lib/extractPptx';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadMaterialModal({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'pptx' | 'text'>('text');
  const [extracting, setExtracting] = useState(false);
  const createMaterial = useCreateMaterial();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let extracted: string;
      if (ext === 'pdf') {
        extracted = await extractPdfText(file);
        setFileType('pdf');
      } else {
        extracted = await extractPptxText(file);
        setFileType('pptx');
      }
      setText(extracted);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !text.trim()) return;
    await createMaterial.mutateAsync({
      title: title.trim(),
      source_type: fileType,
      extracted_text: text.trim(),
    });
    setTitle('');
    setText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Material</DialogTitle>
          <DialogDescription>Upload a PDF, PPTX, or paste text to create study material.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="file">
          <TabsList className="w-full">
            <TabsTrigger value="file" className="flex-1">Upload File</TabsTrigger>
            <TabsTrigger value="text" className="flex-1">Paste Text</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <input
              type="file"
              accept=".pdf,.pptx"
              onChange={handleFileChange}
            />
            {extracting && <p className="text-sm text-muted-foreground">Extracting text...</p>}
            {text && !extracting && (
              <p className="text-sm text-muted-foreground">
                Extracted {text.length} characters
              </p>
            )}
            <Button onClick={handleSubmit} disabled={!title.trim() || !text.trim() || createMaterial.isPending}>
              Save
            </Button>
          </TabsContent>
          <TabsContent value="text" className="space-y-4">
            <Textarea
              placeholder="Paste your lecture notes here..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setFileType('text');
              }}
              rows={6}
            />
            {text && (
              <div>
                <Label htmlFor="title-text">Title</Label>
                <Input
                  id="title-text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            )}
            <Button onClick={handleSubmit} disabled={!title.trim() || !text.trim() || createMaterial.isPending}>
              Save
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
