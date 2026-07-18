export function withUserScope<T extends Record<string, unknown>>(payload: T, userId: string | undefined) {
  if (!userId) {
    return payload;
  }

  return {
    ...payload,
    user_id: userId,
  } as T & { user_id: string };
}
