export function buildUserScopedQueryKey(parts: readonly string[], userId: string | null | undefined) {
  return [...parts, userId ?? 'anonymous'] as const;
}
