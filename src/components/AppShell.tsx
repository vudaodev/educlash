import { Outlet } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';

export function AppShell() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden">
      <header className="shrink-0 flex h-12 items-center justify-between border-b bg-background px-4">
        <span className="text-lg font-bold tracking-tight">
          <span className="text-primary">Edu</span>Clash
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>
      <main id="main-scroll" className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
