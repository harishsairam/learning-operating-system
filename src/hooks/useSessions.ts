import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getSessions,
  getActiveSession,
  getSession,
  createSession,
  pauseSession,
  resumeSession,
  extendSession,
  completeSession,
  cancelSession,
} from '../api/sessions';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';
import type { MemoryMode } from '../types';

/**
 * Fetch all sessions (for history)
 */
export function useSessions() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['sessions'], user?.id), [user?.id]);

  return useQuery({
    queryKey,
    queryFn: () => getSessions(user!.id),
    enabled: !!user?.id,
  });
}

/**
 * Fetch active or paused session
 */
export function useActiveSession() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'active'], user?.id), [user?.id]);

  return useQuery({
    queryKey,
    queryFn: () => getActiveSession(user!.id),
    staleTime: 0, // Always fresh for accurate timer
    gcTime: 5 * 60 * 1000, // Keep 5 min in memory
    enabled: !!user?.id,
  });
}

/**
 * Fetch a specific session
 */
export function useSession(sessionId: string) {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'current', sessionId], user?.id), [sessionId, user?.id]);

  return useQuery({
    queryKey,
    queryFn: () => getSession(user!.id, sessionId),
    staleTime: 0, // Always fresh for accurate timer
    gcTime: 5 * 60 * 1000,
    enabled: !!sessionId && !!user?.id,
  });
}

/**
 * Create a new session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const sessionsKey = useMemo(() => buildUserScopedQueryKey(['sessions'], user?.id), [user?.id]);
  const activeKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'active'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({
      project_id,
      category_id,
      topic_id,
      memory_mode,
      activity_type,
      planned_duration_minutes,
    }: {
      project_id: string;
      category_id: string;
      topic_id: string;
      memory_mode: MemoryMode;
      activity_type: string;
      planned_duration_minutes: number;
    }) =>
      createSession(user!.id, {
        project_id,
        category_id,
        topic_id,
        memory_mode,
        activity_type,
        planned_duration_minutes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activeKey });
      queryClient.invalidateQueries({ queryKey: sessionsKey });
    },
  });
}

/**
 * Pause a session
 */
export function usePauseSession() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const currentKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'current'], user?.id), [user?.id]);
  const activeKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'active'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (sessionId: string) => pauseSession(user!.id, sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        [...currentKey, data.id],
        data
      );
      queryClient.setQueryData(activeKey, data);
    },
  });
}

/**
 * Resume a session
 */
export function useResumeSession() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const currentKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'current'], user?.id), [user?.id]);
  const activeKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'active'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (sessionId: string) => resumeSession(user!.id, sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        [...currentKey, data.id],
        data
      );
      queryClient.setQueryData(activeKey, data);
    },
  });
}

/**
 * Extend a session
 */
export function useExtendSession() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const currentKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'current'], user?.id), [user?.id]);
  const activeKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'active'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({
      sessionId,
      additionalMinutes,
    }: {
      sessionId: string;
      additionalMinutes: number;
    }) => extendSession(user!.id, sessionId, additionalMinutes),
    onSuccess: (data) => {
      queryClient.setQueryData(
        [...currentKey, data.id],
        data
      );
      queryClient.setQueryData(activeKey, data);
    },
  });
}

/**
 * Complete a session (save reflection/notes)
 */
export function useCompleteSession() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const sessionsKey = useMemo(() => buildUserScopedQueryKey(['sessions'], user?.id), [user?.id]);
  const activeKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'active'], user?.id), [user?.id]);
  const currentKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'current'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({
      sessionId,
      reflection,
      notes,
    }: {
      sessionId: string;
      reflection?: string;
      notes?: string;
    }) => completeSession(user!.id, sessionId, reflection, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: sessionsKey });
      queryClient.setQueryData(
        [...currentKey, data.id],
        data
      );
      queryClient.setQueryData(activeKey, null);
    },
  });
}

/**
 * Cancel a session
 */
export function useCancelSession() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const sessionsKey = useMemo(() => buildUserScopedQueryKey(['sessions'], user?.id), [user?.id]);
  const activeKey = useMemo(() => buildUserScopedQueryKey(['sessions', 'active'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (sessionId: string) => cancelSession(user!.id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKey });
      queryClient.setQueryData(activeKey, null);
    },
  });
}
