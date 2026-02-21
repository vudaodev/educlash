import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders BottomNav', () => {
    render(
      <MemoryRouter initialEntries={['/play']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/play" element={<div>Play Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Play', { selector: 'span' })).toBeInTheDocument();
  });

  it('renders child route content via Outlet', () => {
    render(
      <MemoryRouter initialEntries={['/play']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/play" element={<div>Child Content Here</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Child Content Here')).toBeInTheDocument();
  });
});
