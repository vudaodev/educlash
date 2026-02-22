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
import { useCreateTeam } from '@/hooks/useTeams';
import type { Team } from '@/hooks/useTeams';
import { Copy, Check } from 'lucide-react';

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const schema = z.object({
  name: z.string().min(1, 'Team name is required').max(50, 'Max 50 characters'),
});

type FormValues = z.infer<typeof schema>;

export function CreateTeamModal({ open, onOpenChange }: CreateTeamModalProps) {
  const [createdTeam, setCreatedTeam] = useState<Team | null>(null);
  const [copied, setCopied] = useState(false);
  const createTeam = useCreateTeam();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { name: '' },
  });

  function handleClose(val: boolean) {
    onOpenChange(val);
    if (!val) {
      setCreatedTeam(null);
      setCopied(false);
      form.reset();
    }
  }

  function onSubmit(values: FormValues) {
    createTeam.mutate(values.name, {
      onSuccess: (team) => {
        setCreatedTeam(team);
        toast.success('Team created!');
      },
      onError: () => toast.error('Failed to create team'),
    });
  }

  async function copyCode() {
    if (!createdTeam) return;
    await navigator.clipboard.writeText(createdTeam.invite_code);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            {createdTeam
              ? 'Share this invite code with your friends.'
              : 'Give your team a name.'}
          </DialogDescription>
        </DialogHeader>

        {createdTeam ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-sm">Invite Code</p>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border bg-muted px-4 py-2 font-mono text-2xl tracking-widest">
                {createdTeam.invite_code}
              </span>
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            <Button onClick={() => handleClose(false)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g. Study Squad"
                {...form.register('name')}
                autoFocus
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending ? 'Creating...' : 'Create'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
