import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuiz } from '@/hooks/useQuiz';
import { QuizResult } from '@/components/QuizResult';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function QuizPlayer() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challenge_id');
  const { data: quiz, answers: correctAnswers, isLoading, isSuccess } = useQuiz(quizId!);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    time_taken_seconds: number;
    xp_earned: number;
  } | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (quiz?.time_limit_seconds) {
      const now = Date.now();
      startTimeRef.current = now;
      deadlineRef.current = now + quiz.time_limit_seconds * 1000;
      setTimeLeft(quiz.time_limit_seconds);
    }
  }, [quiz?.time_limit_seconds]);

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
      setResult({
        score: data.correct_count,
        total: quiz.questions.length,
        time_taken_seconds: timeTaken,
        xp_earned: data.xp_earned,
      });
    }
  }, [quiz, correctAnswers, selectedAnswers, challengeId]);

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

  // Display countdown
  useEffect(() => {
    if (deadlineRef.current === null || submitted) return;

    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current! - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(id);
  }, [submitted]);

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
    const answerBreakdown: Record<string, { selected: number; correct: number }> = {};
    quiz.questions.forEach((q) => {
      answerBreakdown[q.id] = {
        selected: selectedAnswers[q.id] ?? -1,
        correct: correctAnswers[q.id],
      };
    });

    return (
      <QuizResult
        result={result}
        questions={quiz.questions}
        answers={answerBreakdown}
      />
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
