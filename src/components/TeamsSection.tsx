import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeams } from '@/hooks/useTeams';
import type { TeamMembership } from '@/hooks/useTeams';
import { CreateTeamModal } from '@/components/CreateTeamModal';
import { JoinTeamModal } from '@/components/JoinTeamModal';
import { TeamDetailView } from '@/components/TeamDetailView';

export function TeamsSection() {
  const { data: memberships, isLoading } = useTeams();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Teams</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setJoinOpen(true)}>
            Join
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            Create
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
        </div>
      ) : memberships && memberships.length > 0 ? (
        <div className="flex flex-col gap-3">
          {memberships.map((m: TeamMembership) => (
            <div key={m.team_id} className="flex flex-col gap-1">
              <h4 className="font-medium">{m.team.name}</h4>
              <TeamDetailView team={m.team} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center text-sm py-2">
          No teams yet
        </p>
      )}

      <CreateTeamModal open={createOpen} onOpenChange={setCreateOpen} />
      <JoinTeamModal open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}
