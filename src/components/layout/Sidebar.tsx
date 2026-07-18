import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { UserMenu } from '../auth/UserMenu';
import {
  LayoutDashboard,
  FolderOpen,
  Book,
  BookOpen,
  Timer,
  Repeat
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Categories', href: '/categories', icon: Book },
  { name: 'Topics', href: '/topics', icon: BookOpen },
  { name: 'Learning Log', href: '/activities', icon: Timer },
  { name: "Today's Revisions", href: '/revisions', icon: Repeat },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant z-50">
      <div className="px-6 mt-12 mb-12 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-display font-bold shrink-0">
          SB
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-primary tracking-tight">Learning OS</h1>
          <p className="text-xs font-semibold text-secondary mt-0.5 uppercase tracking-wider">Precision Learning</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                isActive
                  ? 'text-primary border-l-4 border-primary bg-surface-container-low font-semibold'
                  : 'text-secondary hover:bg-surface-container-lowest font-medium',
                'group flex items-center gap-3 px-4 py-3 rounded-r-lg transition-colors duration-200 text-sm'
              )}
            >
              <item.icon
                className={cn(
                  isActive ? 'text-primary' : 'text-secondary group-hover:text-primary',
                  'h-5 w-5 shrink-0 transition-colors'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 space-y-3">
        <Link
          to="/activities"
          className="w-full bg-primary-container text-on-primary py-3 px-4 rounded-lg text-sm font-semibold hover:bg-primary-fixed-dim hover:text-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          New Session
        </Link>
        <UserMenu />
      </div>
    </div>
  );
}
