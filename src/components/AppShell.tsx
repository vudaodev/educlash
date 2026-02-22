import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';

export function AppShell() {
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <header className="sticky top-0 z-40 flex h-12 items-center border-b bg-background px-4">
        <span className="text-lg font-bold tracking-tight">
          <span className="text-primary">Edu</span>Clash
        </span>
      </header>
      <Outlet />
      <BottomNav />
    </div>
  );
}
