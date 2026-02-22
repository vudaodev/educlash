import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useMaterials } from '@/hooks/useMaterials';
import { supabase } from '@/lib/supabase';
import { CheckCircle2 } from 'lucide-react';

interface CreateQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuizCreated?: (quizId: string) => void;
}

const configSchema = z.object({
  question_count: z.coerce.number().min(1).max(50),
  time_limit_minutes: z.coerce.number().min(1).max(120),
  mode: z.enum(['solo', 'competitive']),
});

type ConfigValues = z.output<typeof configSchema>;

export function CreateQuizModal({ open, onOpenChange, onQuizCreated }: CreateQuizModalProps) {
  const [step, setStep] = useState(1);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: materials, isLoading: materialsLoading } = useMaterials();

  const form = useForm<ConfigValues>({
    resolver: zodResolver(configSchema) as never,
    defaultValues: {
      question_count: 10,
      time_limit_minutes: 5,
      mode: 'solo',
    },
  });

  function toggleMaterial(id: string) {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function handleNext() {
    setStep(2);
  }

  async function handleGenerate(values: ConfigValues) {
    setIsGenerating(true);
    setStep(3);

    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        material_ids: selectedMaterials,
        question_count: values.question_count,
        time_limit_minutes: values.time_limit_minutes,
        mode: values.mode,
      },
    });

    if (error || !data?.quiz_id) {
      setIsGenerating(false);
      setStep(2);
      toast.error('Failed to generate quiz. Please try again.');
      return;
    }

    setIsGenerating(false);
    toast.success('Quiz ready!');
    onOpenChange(false);
    resetState();
    onQuizCreated?.(data.quiz_id);
  }

  function resetState() {
    setStep(1);
    setSelectedMaterials([]);
    setIsGenerating(false);
    form.reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) resetState();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Quiz</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Select materials to generate a quiz from.'}
            {step === 2 && 'Configure your quiz settings.'}
            {step === 3 && 'Generating your quiz...'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="flex flex-col gap-3">
            {materialsLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {materials?.map((mat) => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => toggleMaterial(mat.id)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      selectedMaterials.includes(mat.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span>{mat.title}</span>
                    {selectedMaterials.includes(mat.id) && (
                      <CheckCircle2 className="text-primary size-5" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <Button
              onClick={handleNext}
              disabled={selectedMaterials.length === 0}
            >
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <form
            onSubmit={form.handleSubmit(handleGenerate)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="question_count">Number of Questions</Label>
              <Input
                id="question_count"
                type="number"
                {...form.register('question_count')}
              />
              {form.formState.errors.question_count && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.question_count.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="time_limit_minutes">Time Limit (minutes)</Label>
              <Input
                id="time_limit_minutes"
                type="number"
                {...form.register('time_limit_minutes')}
              />
              {form.formState.errors.time_limit_minutes && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.time_limit_minutes.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Mode</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={form.watch('mode') === 'solo' ? 'default' : 'outline'}
                  onClick={() => form.setValue('mode', 'solo')}
                  className="flex-1"
                >
                  Solo
                </Button>
                <Button
                  type="button"
                  variant={form.watch('mode') === 'competitive' ? 'default' : 'outline'}
                  onClick={() => form.setValue('mode', 'competitive')}
                  className="flex-1"
                >
                  1v1 Challenge
                </Button>
              </div>
            </div>

            <Button type="submit">Generate</Button>
          </form>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            {isGenerating ? (
              <>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-2/3" />
              </>
            ) : (
              <p className="text-center font-medium">Quiz generated!</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
