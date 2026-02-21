import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderPicker } from './FolderPicker';

vi.mock('@/hooks/useFolders', () => ({
  useFolders: () => ({
    data: [
      { id: 'folder-1', name: 'CS101', user_id: 'user-123', created_at: '2026-01-01' },
      { id: 'folder-2', name: 'MATH200', user_id: 'user-123', created_at: '2026-01-02' },
    ],
    isLoading: false,
  }),
}));

describe('FolderPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a trigger button', () => {
    render(
      <FolderPicker
        materialId="mat-1"
        currentFolderId={null}
        onSelect={vi.fn()}
      />
    );
    // Should have a clickable trigger element
    expect(
      screen.getByRole('button') || screen.getByRole('combobox')
    ).toBeInTheDocument();
  });

  it('shows folder options when opened', async () => {
    const user = userEvent.setup();
    render(
      <FolderPicker
        materialId="mat-1"
        currentFolderId={null}
        onSelect={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button') || screen.getByRole('combobox');
    await user.click(trigger);

    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('MATH200')).toBeInTheDocument();
  });

  it('calls onSelect with folder id when option is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <FolderPicker
        materialId="mat-1"
        currentFolderId={null}
        onSelect={onSelect}
      />
    );

    const trigger = screen.getByRole('button') || screen.getByRole('combobox');
    await user.click(trigger);
    await user.click(screen.getByText('CS101'));

    expect(onSelect).toHaveBeenCalledWith('folder-1');
  });

  it('includes an uncategorised option', async () => {
    const user = userEvent.setup();
    render(
      <FolderPicker
        materialId="mat-1"
        currentFolderId="folder-1"
        onSelect={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button') || screen.getByRole('combobox');
    await user.click(trigger);

    expect(screen.getByText(/uncategorised/i)).toBeInTheDocument();
  });
});
