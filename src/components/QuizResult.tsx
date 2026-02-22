import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ResultData {
  score: number;
  total: number;
  percentage: number;
  time_taken_seconds: number;
  xp_earned: number;
}

interface QuestionData {
  id: string;
  question_text: string;
  options: string[];
}

interface AnswerData {
  selected: number;
  correct: number;
}

interface QuizResultProps {
  result: ResultData;
  questions: QuestionData[];
  answers: Record<string, AnswerData>;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function QuizResult({ result, questions, answers }: QuizResultProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="text-center">
        <p className="text-4xl font-bold">{result.score}/{result.total} ({result.percentage}%)</p>
        <p className="text-muted-foreground mt-1">{formatTime(result.time_taken_seconds)}</p>
        <p className="text-primary mt-1 font-semibold">+{result.xp_earned} XP</p>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((q) => {
          const answer = answers[q.id];
          const isCorrect = answer && answer.selected === answer.correct;

          return (
            <div key={q.id} className="rounded-lg border p-3">
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="text-green-500 mt-0.5 size-5 shrink-0" />
                ) : (
                  <XCircle className="text-red-500 mt-0.5 size-5 shrink-0" />
                )}
                <div>
                  <p className="font-medium">{q.question_text}</p>
                  {answer && (
                    <p className="text-muted-foreground text-sm">
                      {isCorrect
                        ? `Correct: ${q.options[answer.correct]}`
                        : `Your answer: ${q.options[answer.selected]} — Correct: ${q.options[answer.correct]}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/play')}>
          Back to Play
        </Button>
        <Button onClick={() => window.location.reload()}>
          Play Again
        </Button>
      </div>
    </div>
  );
}
