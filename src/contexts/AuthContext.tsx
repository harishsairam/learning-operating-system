import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  status: AuthStatus;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapSessionToUser(session: Session | null): AuthUser | null {
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(session);
      setStatus(session ? 'authenticated' : 'unauthenticated');
    }

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setStatus(session ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = useMemo(() => mapSessionToUser(session), [session]);

  return (
    <AuthContext.Provider value={{ user, session, status }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

export function useAuthUser() {
  return useAuthContext().user;
}

export function useAuthStatus() {
  return useAuthContext().status;
}

export function useAuthSession() {
  return useAuthContext().session;
}
