import { NavLink } from 'react-router-dom';
import { User, Swords, Users, Trophy } from 'lucide-react';

const tabs = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/play', icon: Swords, label: 'Play' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => window.scrollTo(0, 0)}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-4 text-xs transition-colors border-r border-border last:border-r-0 ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
