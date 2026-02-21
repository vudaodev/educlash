import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FolderView } from './FolderView';

const mockUseMaterials = vi.fn();
const mockUseFolders = vi.fn();

vi.mock('@/hooks/useMaterials', () => ({
  useMaterials: () => mockUseMaterials(),
}));

vi.mock('@/hooks/useFolders', () => ({
  useFolders: () => mockUseFolders(),
}));

function renderView() {
  return render(
    <MemoryRouter>
      <FolderView />
    </MemoryRouter>
  );
}

describe('FolderView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('groups materials by folder', () => {
    mockUseFolders.mockReturnValue({
      data: [
        { id: 'folder-1', name: 'CS101', user_id: 'user-123', created_at: '2026-01-01' },
      ],
      isLoading: false,
    });
    mockUseMaterials.mockReturnValue({
      data: [
        {
          id: 'mat-1',
          title: 'Lecture 1',
          type: 'pdf',
          folder_id: 'folder-1',
          extracted_text: 'text',
          user_id: 'user-123',
          created_at: '2026-01-01',
        },
        {
          id: 'mat-2',
          title: 'Lecture 2',
          type: 'pptx',
          folder_id: 'folder-1',
          extracted_text: 'text',
          user_id: 'user-123',
          created_at: '2026-01-02',
        },
      ],
      isLoading: false,
    });

    renderView();
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('Lecture 1')).toBeInTheDocument();
    expect(screen.getByText('Lecture 2')).toBeInTheDocument();
  });

  it('shows uncategorised section for materials without a folder', () => {
    mockUseFolders.mockReturnValue({ data: [], isLoading: false });
    mockUseMaterials.mockReturnValue({
      data: [
        {
          id: 'mat-3',
          title: 'Loose Notes',
          type: 'text',
          folder_id: null,
          extracted_text: 'notes',
          user_id: 'user-123',
          created_at: '2026-01-01',
        },
      ],
      isLoading: false,
    });

    renderView();
    expect(screen.getByText(/uncategorised/i)).toBeInTheDocument();
    expect(screen.getByText('Loose Notes')).toBeInTheDocument();
  });

  it('shows loading skeleton while fetching', () => {
    mockUseFolders.mockReturnValue({ data: undefined, isLoading: true });
    mockUseMaterials.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = renderView();
    expect(
      container.querySelector('[class*="animate-pulse"]')
    ).toBeInTheDocument();
  });
});
