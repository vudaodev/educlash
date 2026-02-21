import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useMaterials, useCreateMaterial } from './useMaterials';

const mockUser = { id: 'user-123' };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
      insert: mockInsert,
    }),
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

describe('useMaterials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches materials for the current user', async () => {
    const materials = [
      {
        id: 'mat-1',
        user_id: 'user-123',
        title: 'Lecture 1',
        type: 'pdf',
        extracted_text: 'some text',
        folder_id: null,
        created_at: '2026-01-01',
      },
    ];
    mockSelect.mockReturnValue({
      eq: () => ({
        order: () => Promise.resolve({ data: materials, error: null }),
      }),
    });

    const { result } = renderHook(() => useMaterials(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(materials);
  });

  it('returns empty array when user has no materials', async () => {
    mockSelect.mockReturnValue({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    });

    const { result } = renderHook(() => useMaterials(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([]);
  });

  it('handles supabase error', async () => {
    mockSelect.mockReturnValue({
      eq: () => ({
        order: () =>
          Promise.resolve({ data: null, error: { message: 'DB error' } }),
      }),
    });

    const { result } = renderHook(() => useMaterials(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateMaterial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts a new material via mutation', async () => {
    mockInsert.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              id: 'mat-new',
              user_id: 'user-123',
              title: 'New Material',
              type: 'text',
              extracted_text: 'pasted text',
              folder_id: null,
              created_at: '2026-02-01',
            },
            error: null,
          }),
      }),
    });

    const { result } = renderHook(() => useCreateMaterial(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      title: 'New Material',
      type: 'text',
      extracted_text: 'pasted text',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockInsert).toHaveBeenCalled();
  });
});
