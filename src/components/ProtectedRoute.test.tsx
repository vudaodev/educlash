import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock useAuth
const mockAuth = {
  user: null as { id: string } | null,
  loading: false,
  hasProfile: null as boolean | null,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

function renderProtected(route = '/play') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/setup-username" element={
          <ProtectedRoute><div>Setup Username Content</div></ProtectedRoute>
        } />
        <Route path="/play" element={
          <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
        } />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuth.user = null;
    mockAuth.loading = false;
    mockAuth.hasProfile = null;
  });

  it('shows loading spinner while auth is loading', () => {
    mockAuth.loading = true;
    const { container } = renderProtected();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /login when no user', () => {
    renderProtected();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /setup-username when user has no profile', () => {
    mockAuth.user = { id: 'user-123' };
    mockAuth.hasProfile = false;
    renderProtected();
    expect(screen.getByText('Setup Username Content')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('does not redirect from /setup-username when hasProfile is false', () => {
    mockAuth.user = { id: 'user-123' };
    mockAuth.hasProfile = false;
    renderProtected('/setup-username');
    expect(screen.getByText('Setup Username Content')).toBeInTheDocument();
  });

  it('renders children when user is authenticated with profile', () => {
    mockAuth.user = { id: 'user-123' };
    mockAuth.hasProfile = true;
    renderProtected();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
