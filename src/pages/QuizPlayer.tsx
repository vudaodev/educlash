import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/contexts/AuthContext';
import { QuizResult } from '@/components/QuizResult';
import { ChallengeResult } from '@/components/ChallengeResult';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface ChallengeResultData {
  winner_id: string;
  my_score: number;
  opponent_score: number;
  my_time: number;
  opponent_time: number;
  opponent_name: string;
}

export default function QuizPlayer() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challenge_id');
  const { user } = useAuth();
  const { data: quiz, answers: correctAnswers, isLoading, isSuccess } = useQuiz(quizId!);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [challengeResultData, setChallengeResultData] = useState<ChallengeResultData | null>(null);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    time_taken_seconds: number;
    xp_earned: number;
  } | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);
  const deadlineRef = useRef<number | null>(null);

  // Initialize timer and display countdown
  useEffect(() => {
    if (!quiz?.time_limit_seconds || submitted) return;

    const now = Date.now();
    startTimeRef.current = now;
    const deadline = now + quiz.time_limit_seconds * 1000;
    deadlineRef.current = deadline;
    setTimeLeft(quiz.time_limit_seconds);

    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(id);
  }, [quiz?.time_limit_seconds, submitted]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || !quiz || !correctAnswers) return;
    submittedRef.current = true;
    setSubmitted(true);

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    // SQL RPC expects int[] — flat array of selected indexes in question order
    const answersArray = quiz.questions.map((q) => selectedAnswers[q.id] ?? -1);

    const { data, error } = await supabase.rpc('submit_quiz_attempt', {
      p_quiz_id: quiz.id,
      p_answers: answersArray,
      p_time_taken: timeTaken,
      p_challenge_id: challengeId || null,
    });

    if (!error && data) {
      const correct = data.correct_count ?? data.score;
      const total = quiz.questions.length;
      setResult({
        score: correct,
        total,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        time_taken_seconds: timeTaken,
        xp_earned: data.xp_earned,
      });

      if (data.xp_earned > 0) {
        toast.success(`+${data.xp_earned} XP earned!`);
      }

      // If challenge completed (both players done), capture result
      if (data.challenge_result?.winner_id) {
        const cr = data.challenge_result;
        // Fetch opponent name and determine roles
        const challengeData = await supabase
          .from('challenges')
          .select('challenger:users!challenger_id(username), challenged:users!challenged_id(username), challenger_id')
          .eq('id', challengeId!)
          .single();

        const isChallenger = challengeData.data?.challenger_id === user?.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = challengeData.data as any;
        const opponentName = isChallenger
          ? d?.challenged?.username ?? 'Opponent'
          : d?.challenger?.username ?? 'Opponent';

        setChallengeResultData({
          winner_id: cr.winner_id,
          my_score: isChallenger ? cr.challenger_score : cr.challenged_score,
          opponent_score: isChallenger ? cr.challenged_score : cr.challenger_score,
          my_time: isChallenger ? cr.challenger_time : cr.challenged_time,
          opponent_time: isChallenger ? cr.challenged_time : cr.challenger_time,
          opponent_name: opponentName,
        });
      }
    }
  }, [quiz, correctAnswers, selectedAnswers, challengeId, user?.id]);

  // Auto-submit when time expires
  useEffect(() => {
    if (deadlineRef.current === null || submitted) return;

    const msLeft = deadlineRef.current - Date.now();
    const autoSubmitTimer = setTimeout(() => {
      setTimeLeft(0);
      handleSubmit();
    }, Math.max(0, msLeft));

    return () => clearTimeout(autoSubmitTimer);
  }, [submitted, handleSubmit]);


  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!isSuccess || !quiz) {
    return (
      <div className="p-4 text-center">
        <p>Failed to load quiz.</p>
      </div>
    );
  }

  if (submitted && result && correctAnswers) {
    // Show challenge result if both players completed
    if (challengeResultData && user) {
      return (
        <ChallengeResult
          winnerId={challengeResultData.winner_id}
          currentUserId={user.id}
          myScore={challengeResultData.my_score}
          opponentScore={challengeResultData.opponent_score}
          myTime={challengeResultData.my_time}
          opponentTime={challengeResultData.opponent_time}
          opponentName={challengeResultData.opponent_name}
          xpEarned={result.xp_earned}
        />
      );
    }

    const answerBreakdown: Record<string, { selected: number; correct: number }> = {};
    quiz.questions.forEach((q) => {
      answerBreakdown[q.id] = {
        selected: selectedAnswers[q.id] ?? -1,
        correct: correctAnswers[q.id],
      };
    });

    return (
      <div>
        {challengeId && !challengeResultData && (
          <div className="bg-muted mx-4 mt-4 rounded-lg p-3 text-center text-sm">
            Waiting for your opponent to complete the quiz...
          </div>
        )}
        <QuizResult
          result={result}
          questions={quiz.questions}
          answers={answerBreakdown}
        />
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;
  const progressValue = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          Question {currentIndex + 1} of {quiz.questions.length}
        </span>
        {timeLeft !== null && (
          <span className="font-mono text-sm font-medium">
            {formatTime(timeLeft)}
          </span>
        )}
      </div>

      <Progress value={progressValue} role="progressbar" />

      <div className="mt-2">
        <h2 className="text-lg font-semibold">{question.question_text}</h2>
      </div>

      <div className="flex flex-col gap-2">
        {question.options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() =>
              setSelectedAnswers((prev) => ({ ...prev, [question.id]: idx }))
            }
            className={`rounded-lg border p-3 text-left transition-colors ${
              selectedAnswers[question.id] === idx
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        {isLast ? (
          <Button onClick={handleSubmit}>Submit</Button>
        ) : (
          <Button
            onClick={() => setCurrentIndex((i) => i + 1)}
            disabled={selectedAnswers[question.id] === undefined}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
