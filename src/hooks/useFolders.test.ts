import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useFolders, useCreateFolder } from './useFolders';

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

describe('useFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches folders for the current user', async () => {
    const folders = [
      { id: 'folder-1', user_id: 'user-123', name: 'CS101', created_at: '2026-01-01' },
      { id: 'folder-2', user_id: 'user-123', name: 'MATH200', created_at: '2026-01-02' },
    ];
    mockSelect.mockReturnValue({
      eq: () => ({
        order: () => Promise.resolve({ data: folders, error: null }),
      }),
    });

    const { result } = renderHook(() => useFolders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(folders);
  });

  it('handles supabase error', async () => {
    mockSelect.mockReturnValue({
      eq: () => ({
        order: () =>
          Promise.resolve({ data: null, error: { message: 'DB error' } }),
      }),
    });

    const { result } = renderHook(() => useFolders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts a new folder via mutation', async () => {
    mockInsert.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: { id: 'folder-new', user_id: 'user-123', name: 'New Folder', created_at: '2026-02-01' },
            error: null,
          }),
      }),
    });

    const { result } = renderHook(() => useCreateFolder(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'New Folder' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockInsert).toHaveBeenCalled();
  });
});
