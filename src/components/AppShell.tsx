import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import logoImg from '@/assets/educlashlogo.png';

export function AppShell() {
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <header className="sticky top-0 z-40 flex h-12 items-center border-b bg-background px-4">
        <img src={logoImg} alt="EduClash" className="h-12 object-contain" />
      </header>
      <Outlet />
      <BottomNav />
    </div>
  );
}
