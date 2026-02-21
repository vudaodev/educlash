import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { UploadMaterialModal } from './UploadMaterialModal';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const mockMutate = vi.fn();
vi.mock('@/hooks/useMaterials', () => ({
  useCreateMaterial: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutate,
    isPending: false,
  }),
}));

const mockExtractPdfText = vi.fn();
vi.mock('@/lib/extractPdf', () => ({
  extractPdfText: (...args: unknown[]) => mockExtractPdfText(...args),
}));

const mockExtractPptxText = vi.fn();
vi.mock('@/lib/extractPptx', () => ({
  extractPptxText: (...args: unknown[]) => mockExtractPptxText(...args),
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
      <UploadMaterialModal open={open} onOpenChange={onOpenChange} />
    </Wrapper>
  );
  return { ...result, onOpenChange };
}

describe('UploadMaterialModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open is true', () => {
    renderModal(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render dialog when open is false', () => {
    renderModal(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows tabs for upload methods (file upload and paste text)', () => {
    renderModal();
    // Should have tab-like options for file vs text
    expect(
      screen.getByText(/file/i) || screen.getByText(/upload/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/text/i) || screen.getByText(/paste/i)
    ).toBeInTheDocument();
  });

  it('file input accepts PDF and PPTX files', () => {
    renderModal();
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput?.getAttribute('accept')).toMatch(/\.pdf/);
    expect(fileInput?.getAttribute('accept')).toMatch(/\.pptx/);
  });

  it('calls extractPdfText when a PDF file is uploaded', async () => {
    const user = userEvent.setup();
    mockExtractPdfText.mockResolvedValue('extracted pdf text');
    renderModal();

    const file = new File(['%PDF-1.4'], 'test.pdf', {
      type: 'application/pdf',
    });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockExtractPdfText).toHaveBeenCalledWith(file);
    });
  });

  it('calls extractPptxText when a PPTX file is uploaded', async () => {
    const user = userEvent.setup();
    mockExtractPptxText.mockResolvedValue('extracted pptx text');
    renderModal();

    const file = new File(['PK\x03\x04'], 'test.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockExtractPptxText).toHaveBeenCalledWith(file);
    });
  });

  it('shows a text area for pasting text', async () => {
    const user = userEvent.setup();
    renderModal();

    // Switch to text/paste tab
    const textTab = screen.getByText(/text|paste/i);
    await user.click(textTab);

    expect(
      screen.getByRole('textbox') ||
      document.querySelector('textarea')
    ).toBeInTheDocument();
  });

  it('calls createMaterial mutation on submit', async () => {
    const user = userEvent.setup();
    mockMutate.mockResolvedValue(undefined);
    renderModal();

    // Switch to text tab and enter text
    const textTab = screen.getByText(/text|paste/i);
    await user.click(textTab);

    const textarea = screen.getByRole('textbox') || document.querySelector('textarea')!;
    await user.type(textarea, 'My lecture notes');

    // Fill in title
    const titleInput = screen.getByLabelText(/title/i) || screen.getByPlaceholderText(/title/i);
    await user.type(titleInput, 'Test Material');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /save|upload|submit|add/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});
