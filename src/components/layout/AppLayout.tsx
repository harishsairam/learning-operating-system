import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SessionRecoveryModal } from '../ui/SessionRecoveryModal';
import { UserMenu } from '../auth/UserMenu';
import { useActiveSession, useCompleteSession } from '../../hooks/useSessions';
import { LayoutDashboard } from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: activeSession, isLoading } = useActiveSession();
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const completeMutation = useCompleteSession();

  // Show recovery modal on mount if active session exists
  useEffect(() => {
    if (activeSession && !isLoading) {
      setShowRecoveryModal(true);
    }
  }, [activeSession, isLoading]);

  const handleResumeSession = (sessionId: string) => {
    setShowRecoveryModal(false);
    navigate(`/sessions/${sessionId}`);
  };

  const handleFinishSession = async (sessionId: string) => {
    try {
      await completeMutation.mutateAsync({ sessionId });
      setShowRecoveryModal(false);
      navigate('/activities');
    } catch (error) {
      console.error('Failed to finish session:', error);
    }
  };

  const handleDiscardSession = async (sessionId: string) => {
    try {
      await completeMutation.mutateAsync({ sessionId });
      setShowRecoveryModal(false);
    } catch (error) {
      console.error('Failed to discard session:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background text-on-background font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-64">
        <header className="md:hidden flex justify-between items-center h-16 px-4 border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-40">
          <Link to="/" className="font-display text-lg font-bold text-primary tracking-tight hover:text-primary/80 transition-colors">
            Learning OS
          </Link>
          <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto px-4 md:px-16 pt-8 pb-24">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Session Recovery Modal */}
      {showRecoveryModal && activeSession && (
        <SessionRecoveryModal
          session={activeSession}
          onResume={handleResumeSession}
          onFinish={handleFinishSession}
          onDiscard={handleDiscardSession}
          isLoading={completeMutation.isPending}
        />
      )}
    </div>
  );
}
