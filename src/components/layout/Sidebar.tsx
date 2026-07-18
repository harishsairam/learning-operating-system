import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { UserMenu } from '../auth/UserMenu';
import {
  LayoutDashboard,
  Book,
  Timer,
  Repeat,
  BookOpen
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Learning Log', href: '/activities', icon: Book },
  { name: 'Start Session', href: '/activities', icon: Timer },
  { name: 'Revisions', href: '/revisions', icon: Repeat },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant/30 z-50">
      <div className="px-6 py-8 flex flex-col items-center gap-2 border-b border-transparent">
        <div className="flex items-center gap-3 self-start mb-6">
          <div className="w-10 h-10 rounded bg-primary-container text-on-primary-container flex items-center justify-center font-display font-bold shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-on-surface tracking-tight">Learning OS</h1>
            <p className="text-[10px] font-bold text-secondary mt-0.5 uppercase tracking-widest">Precision Learning</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 py-4">
        {navigation.map((item) => {
          // Adjust active state matching based on actual routes, default to simple string match
          const isActive = location.pathname === item.href || (item.name === 'Home' && location.pathname === '/');
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                isActive
                  ? 'bg-primary-container text-on-primary font-medium'
                  : 'text-secondary hover:bg-surface-container-highest hover:text-on-surface font-medium',
                'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-on-primary' : 'text-secondary group-hover:text-on-surface',
                  'h-5 w-5 shrink-0 transition-colors'
                )}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 space-y-3">
        <UserMenu />
      </div>
    </div>
  );
}
