import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MaterialList } from './MaterialList';

const mockMaterials = [
  {
    id: 'mat-1',
    user_id: 'user-123',
    title: 'Lecture 1 - Intro to CS',
    type: 'pdf' as const,
    extracted_text: 'some text',
    folder_id: null,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'mat-2',
    user_id: 'user-123',
    title: 'Week 2 Slides',
    type: 'pptx' as const,
    extracted_text: 'more text',
    folder_id: 'folder-1',
    created_at: '2026-01-20T10:00:00Z',
  },
];

function renderList(materials = mockMaterials) {
  return render(
    <MemoryRouter>
      <MaterialList materials={materials} />
    </MemoryRouter>
  );
}

describe('MaterialList', () => {
  it('renders a card for each material', () => {
    renderList();
    expect(screen.getByText('Lecture 1 - Intro to CS')).toBeInTheDocument();
    expect(screen.getByText('Week 2 Slides')).toBeInTheDocument();
  });

  it('shows title, type badge, and date for each material', () => {
    renderList();
    // Title
    expect(screen.getByText('Lecture 1 - Intro to CS')).toBeInTheDocument();
    // Type badge (pdf/pptx)
    expect(screen.getByText(/pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/pptx/i)).toBeInTheDocument();
  });

  it('shows empty state when no materials', () => {
    renderList([]);
    expect(
      screen.getByText(/no materials/i)
    ).toBeInTheDocument();
  });
});
