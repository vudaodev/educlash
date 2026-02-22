import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuizResult } from './QuizResult';

const mockResult = {
  score: 7,
  total: 10,
  percentage: 70,
  time_taken_seconds: 185,
  xp_earned: 10,
};

const mockQuestions = [
  { id: 'q-1', question_text: 'Q1?', options: ['A', 'B', 'C', 'D'] },
  { id: 'q-2', question_text: 'Q2?', options: ['A', 'B', 'C', 'D'] },
  { id: 'q-3', question_text: 'Q3?', options: ['A', 'B', 'C', 'D'] },
];

const mockAnswers = {
  'q-1': { selected: 0, correct: 0 },
  'q-2': { selected: 1, correct: 2 },
  'q-3': { selected: 3, correct: 3 },
};

function renderResult() {
  return render(
    <MemoryRouter>
      <QuizResult
        result={mockResult}
        questions={mockQuestions}
        answers={mockAnswers}
      />
    </MemoryRouter>
  );
}

describe('QuizResult', () => {
  it('displays the score', () => {
    renderResult();
    expect(screen.getByText(/7.*10|7\/10|70%/)).toBeInTheDocument();
  });

  it('displays the time taken', () => {
    renderResult();
    // 185 seconds = 3:05
    expect(
      screen.getByText(/3:05|3m.*5s|185/)
    ).toBeInTheDocument();
  });

  it('displays XP earned', () => {
    renderResult();
    expect(screen.getByText(/10.*xp|\+10/i)).toBeInTheDocument();
  });

  it('shows per-question breakdown', () => {
    renderResult();
    // Should show each question with correct/incorrect indicator
    expect(screen.getByText('Q1?')).toBeInTheDocument();
    expect(screen.getByText('Q2?')).toBeInTheDocument();
    expect(screen.getByText('Q3?')).toBeInTheDocument();
  });

  it('shows call-to-action buttons', () => {
    renderResult();
    // Should have at least one CTA (play again, back to play, challenge friend, etc.)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
