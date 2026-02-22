import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeams } from '@/hooks/useTeams';
import type { TeamMembership } from '@/hooks/useTeams';
import { CreateTeamModal } from '@/components/CreateTeamModal';
import { JoinTeamModal } from '@/components/JoinTeamModal';
import { TeamDetailView } from '@/components/TeamDetailView';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function TeamsSection() {
  const { data: memberships, isLoading } = useTeams();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  function toggleExpand(teamId: string) {
    setExpandedTeamId((prev) => (prev === teamId ? null : teamId));
  }

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
        <div className="flex flex-col gap-2">
          {memberships.map((m: TeamMembership) => (
            <div key={m.team_id} className="flex flex-col">
              <button
                type="button"
                onClick={() => toggleExpand(m.team.id)}
                className="flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <span className="font-medium">{m.team.name}</span>
                {expandedTeamId === m.team.id ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </button>
              {expandedTeamId === m.team.id && (
                <div className="mt-1">
                  <TeamDetailView team={m.team} />
                </div>
              )}
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
