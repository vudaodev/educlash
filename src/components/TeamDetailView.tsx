import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamMembers } from '@/hooks/useTeams';
import type { Team } from '@/hooks/useTeams';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TeamDetailViewProps {
  team: Team;
}

export function TeamDetailView({ team }: TeamDetailViewProps) {
  const { data: members, isLoading } = useTeamMembers(team.id);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(team.invite_code);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          Code: <span className="font-mono">{team.invite_code}</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={copyCode}
        >
          {copied ? (
            <Check className="size-3" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={m.user.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {m.user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{m.user.username}</span>
              {m.user_id === team.owner_id && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Owner
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
