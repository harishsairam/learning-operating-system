import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function UserMenu() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted) {
        setEmail(user?.email ?? null);
      }
    }

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setEmail(session?.user.email ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await queryClient.clear();
    await supabase.auth.signOut();
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm">
      <span className="truncate text-secondary">{email ?? 'Signed in'}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md bg-surface px-2 py-1 text-xs font-semibold text-primary"
      >
        Logout
      </button>
    </div>
  );
}
