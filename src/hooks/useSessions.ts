import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import type { MemoryMode } from '../types';

/**
 * Fetch all sessions (for history)
 */
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });
}

/**
 * Fetch active or paused session
 */
export function useActiveSession() {
  return useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: getActiveSession,
    staleTime: 0, // Always fresh for accurate timer
    gcTime: 5 * 60 * 1000, // Keep 5 min in memory
  });
}

/**
 * Fetch a specific session
 */
export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['sessions', 'current', sessionId],
    queryFn: () => getSession(sessionId),
    staleTime: 0, // Always fresh for accurate timer
    gcTime: 5 * 60 * 1000,
    enabled: !!sessionId,
  });
}

/**
 * Create a new session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

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
      createSession({
        project_id,
        category_id,
        topic_id,
        memory_mode,
        activity_type,
        planned_duration_minutes,
      }),
    onSuccess: () => {
      // Invalidate active session query to refetch
      queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

/**
 * Pause a session
 */
export function usePauseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseSession,
    onSuccess: (data) => {
      // Update the session in cache
      queryClient.setQueryData(
        ['sessions', 'current', data.id],
        data
      );
      queryClient.setQueryData(['sessions', 'active'], data);
    },
  });
}

/**
 * Resume a session
 */
export function useResumeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeSession,
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['sessions', 'current', data.id],
        data
      );
      queryClient.setQueryData(['sessions', 'active'], data);
    },
  });
}

/**
 * Extend a session
 */
export function useExtendSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      additionalMinutes,
    }: {
      sessionId: string;
      additionalMinutes: number;
    }) => extendSession(sessionId, additionalMinutes),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['sessions', 'current', data.id],
        data
      );
      queryClient.setQueryData(['sessions', 'active'], data);
    },
  });
}

/**
 * Complete a session (save reflection/notes)
 */
export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      reflection,
      notes,
    }: {
      sessionId: string;
      reflection?: string;
      notes?: string;
    }) => completeSession(sessionId, reflection, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.setQueryData(
        ['sessions', 'current', data.id],
        data
      );
      // Clear active session
      queryClient.setQueryData(['sessions', 'active'], null);
    },
  });
}

/**
 * Cancel a session
 */
export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.setQueryData(['sessions', 'active'], null);
    },
  });
}
