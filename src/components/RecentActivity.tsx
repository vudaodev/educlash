import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentAttempt {
  id: string;
  score: number;
  challenge_id: string | null;
  quiz: { question_count: number }[];
}

export function RecentActivity() {
  const { user } = useAuth();

  const { data: attempts, isLoading } = useQuery({
    queryKey: ['recent_activity', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('id, score, challenge_id, quiz:quizzes(question_count)')
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
        <h3 className="text-sm font-semibold">Last 5 Games</h3>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!attempts || attempts.length === 0) return null;

  const total = attempts.length;
  const challenges = attempts.filter((a) => a.challenge_id);
  const solo = total - challenges.length;
  const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
  const totalQuestions = attempts.reduce(
    (sum, a) => sum + (a.quiz[0]?.question_count ?? 0),
    0
  );
  const pct = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Last {total} Games</h3>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex flex-col">
          <span className="text-lg font-bold">{pct}%</span>
          <span className="text-xs text-muted-foreground">Avg score</span>
        </div>
        <div className="flex gap-4 text-center">
          <div className="flex flex-col">
            <span className="text-sm font-bold">{solo}</span>
            <span className="text-xs text-muted-foreground">Solo</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">{challenges.length}</span>
            <span className="text-xs text-muted-foreground">1v1</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold">{totalScore}/{totalQuestions}</span>
            <span className="text-xs text-muted-foreground">Correct</span>
          </div>
        </div>
      </div>
    </div>
  );
}
