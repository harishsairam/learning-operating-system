import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background text-on-background font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-64">
        <header className="md:hidden flex justify-between items-center h-16 px-4 border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-40">
          <h1 className="font-display text-lg font-bold text-primary tracking-tight">Learning OS</h1>
        </header>
        <main className="flex-1 overflow-y-auto px-4 md:px-16 pt-8 pb-24">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
