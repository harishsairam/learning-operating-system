import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuthUser() {
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted) {
        setUser(user ? { id: user.id } : null);
      }
    }

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ? { id: session.user.id } : null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return user;
}
