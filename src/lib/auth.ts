import { supabase } from './supabase';

export function withUserScope<T extends Record<string, unknown>>(payload: T, userId: string | undefined) {
  if (!userId) {
    return payload;
  }

  return {
    ...payload,
    user_id: userId,
  } as T & { user_id: string };
}

export async function getCurrentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user?.id;
}

export async function ensureAuthenticated() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
