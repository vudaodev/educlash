describe('supabase client', () => {
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    vi.resetModules();
    Object.assign(import.meta.env, originalEnv);
  });

  it('throws when VITE_SUPABASE_URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
    await expect(() => import('./supabase')).rejects.toThrow(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars'
    );
  });

  it('throws when VITE_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    await expect(() => import('./supabase')).rejects.toThrow(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars'
    );
  });

  it('exports client when env vars are present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
    const mod = await import('./supabase');
    expect(mod.supabase).toBeDefined();
  });
});
