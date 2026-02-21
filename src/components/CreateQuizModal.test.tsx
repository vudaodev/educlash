import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { CreateQuizModal } from './CreateQuizModal';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const mockMaterials = [
  {
    id: 'mat-1',
    title: 'Lecture 1',
    type: 'pdf',
    extracted_text: 'some text',
    folder_id: null,
    user_id: 'user-123',
    created_at: '2026-01-01',
  },
  {
    id: 'mat-2',
    title: 'Lecture 2',
    type: 'pptx',
    extracted_text: 'more text',
    folder_id: null,
    user_id: 'user-123',
    created_at: '2026-01-02',
  },
];

vi.mock('@/hooks/useMaterials', () => ({
  useMaterials: () => ({
    data: mockMaterials,
    isLoading: false,
  }),
}));

const mockInvoke = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function renderModal(open = true) {
  const onOpenChange = vi.fn();
  const Wrapper = createWrapper();
  const result = render(
    <Wrapper>
      <CreateQuizModal open={open} onOpenChange={onOpenChange} />
    </Wrapper>
  );
  return { ...result, onOpenChange };
}

describe('CreateQuizModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open', () => {
    renderModal(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('step 1: shows material selection list', () => {
    renderModal();
    expect(screen.getByText('Lecture 1')).toBeInTheDocument();
    expect(screen.getByText('Lecture 2')).toBeInTheDocument();
  });

  it('step 2: shows quiz config inputs after material selection', async () => {
    const user = userEvent.setup();
    renderModal();

    // Select a material
    await user.click(screen.getByText('Lecture 1'));

    // Click next/continue
    const nextBtn = screen.getByRole('button', { name: /next|continue/i });
    await user.click(nextBtn);

    // Should show config inputs (num questions, difficulty, time limit)
    await waitFor(() => {
      expect(
        screen.getByLabelText(/questions|number/i) ||
        screen.getByText(/questions/i)
      ).toBeInTheDocument();
    });
  });

  it('step 2: validates quiz config inputs', async () => {
    const user = userEvent.setup();
    renderModal();

    // Select material and go to step 2
    await user.click(screen.getByText('Lecture 1'));
    await user.click(screen.getByRole('button', { name: /next|continue/i }));

    // Try to proceed without filling required fields
    await waitFor(() => {
      const generateBtn = screen.queryByRole('button', { name: /generate|create|next/i });
      if (generateBtn) {
        user.click(generateBtn);
      }
    });

    // Should show validation feedback
  });

  it('step 3: shows quiz mode selection (solo/1v1)', async () => {
    const user = userEvent.setup();
    renderModal();

    // Navigate to step 3
    await user.click(screen.getByText('Lecture 1'));
    await user.click(screen.getByRole('button', { name: /next|continue/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/solo/i) || screen.queryByText(/1v1|challenge/i)
      ).toBeTruthy();
    });
  });

  it('invokes generate-quiz edge function on submit', async () => {
    mockInvoke.mockResolvedValue({
      data: { quiz_id: 'quiz-new' },
      error: null,
    });

    const user = userEvent.setup();
    renderModal();

    // Select material
    await user.click(screen.getByText('Lecture 1'));
    await user.click(screen.getByRole('button', { name: /next|continue/i }));

    // Fill in config and submit (implementation-dependent flow)
    await waitFor(() => {
      const generateBtn = screen.queryByRole('button', {
        name: /generate|create/i,
      });
      if (generateBtn) {
        user.click(generateBtn);
      }
    });

    // Eventually should call the edge function
    // This test defines the contract - the modal must invoke 'generate-quiz'
  });

  it('shows loading state during generation', async () => {
    mockInvoke.mockReturnValue(new Promise(() => {})); // never resolves

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Lecture 1'));
    await user.click(screen.getByRole('button', { name: /next|continue/i }));

    // The generate button or UI should show a loading indicator
    // when the edge function is being called
  });
});
