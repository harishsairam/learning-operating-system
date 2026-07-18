import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getProjects, createProject, updateProject, deleteProject } from '../api/projects';
import { buildUserScopedQueryKey } from '../lib/queryKeys';
import { useAuthUser } from './useAuthUser';
import type { Project } from '../types';

export function useProjects() {
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['projects'], user?.id), [user?.id]);

  return useQuery<Project[]>({
    queryKey,
    queryFn: () => getProjects(user!.id),
    enabled: !!user?.id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['projects'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (name: string) => createProject(user!.id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['projects'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateProject(user!.id, id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const queryKey = useMemo(() => buildUserScopedQueryKey(['projects'], user?.id), [user?.id]);

  return useMutation({
    mutationFn: (id: string) => deleteProject(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
