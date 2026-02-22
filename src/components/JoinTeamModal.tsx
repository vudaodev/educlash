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
import { useJoinTeam } from '@/hooks/useTeams';

interface JoinTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const schema = z.object({
  code: z
    .string()
    .length(6, 'Invite code must be 6 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Letters and numbers only'),
});

type FormValues = z.infer<typeof schema>;

export function JoinTeamModal({ open, onOpenChange }: JoinTeamModalProps) {
  const joinTeam = useJoinTeam();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { code: '' },
  });

  function handleClose(val: boolean) {
    onOpenChange(val);
    if (!val) form.reset();
  }

  function onSubmit(values: FormValues) {
    joinTeam.mutate(values.code, {
      onSuccess: () => {
        toast.success('Joined team!');
        handleClose(false);
      },
      onError: () => toast.error('Invalid invite code'),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Team</DialogTitle>
          <DialogDescription>
            Enter the 6-character invite code.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="ABC123"
              maxLength={6}
              className="font-mono text-center text-lg tracking-widest uppercase"
              {...form.register('code')}
              autoFocus
            />
            {form.formState.errors.code && (
              <p className="text-destructive text-sm">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={joinTeam.isPending}>
            {joinTeam.isPending ? 'Joining...' : 'Join'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
