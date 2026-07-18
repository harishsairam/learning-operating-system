import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setStatus(session ? 'authenticated' : 'unauthenticated');
      }
    }

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setStatus(session ? 'authenticated' : 'unauthenticated');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-secondary">
        <p className="text-sm font-medium">Checking your session…</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setStatus(session ? 'authenticated' : 'unauthenticated');
      }
    }

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setStatus(session ? 'authenticated' : 'unauthenticated');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-secondary">
        <p className="text-sm font-medium">Preparing the experience…</p>
      </div>
    );
  }

  if (status === 'authenticated') {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
