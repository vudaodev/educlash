import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface RecentAttempt {
  id: string;
  score: number;
  time_taken_seconds: number;
  completed_at: string;
  challenge_id: string | null;
  quiz: { id: string; question_count: number }[];
}

export function RecentActivity() {
  const { user } = useAuth();

  const { data: attempts, isLoading } = useQuery({
    queryKey: ['recent_activity', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('id, score, time_taken_seconds, completed_at, challenge_id, quiz:quizzes(id, question_count)')
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as RecentAttempt[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!attempts || attempts.length === 0) return null;

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Yesterday';
    if (diffD < 7) return `${diffD}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Recent Activity</h3>
      {attempts.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {a.score}/{a.quiz[0]?.question_count ?? '?'}
              </span>
              {a.challenge_id && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  1v1
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatTime(a.time_taken_seconds)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(a.completed_at)}
          </span>
        </div>
      ))}
    </div>
  );
}
