import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';

export function AppShell() {
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <Outlet />
      <BottomNav />
    </div>
  );
}
