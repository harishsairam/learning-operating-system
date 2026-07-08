import React, { useState } from 'react';
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from '../hooks/useProjects';
import { Plus, Pencil, Trash2, X, Check, FolderOpen } from 'lucide-react';
import type { Project } from '../types';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    createProject.mutate(newProjectName.trim(), {
      onSuccess: () => {
        setIsCreating(false);
        setNewProjectName('');
      }
    });
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    updateProject.mutate({ id, name: editName.trim() }, {
      onSuccess: () => {
        setEditingId(null);
        setEditName('');
      }
    });
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading projects...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-on-surface mb-2 tracking-tight">Active Projects</h1>
          <p className="text-lg text-secondary">Manage and track your cognitive domains.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {isCreating && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <form onSubmit={handleCreate} className="flex items-center gap-4">
            <input
              type="text"
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project Name"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={createProject.isPending}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-on-primary bg-primary-container hover:bg-primary-fixed-dim hover:text-on-primary-fixed-variant transition-colors shadow-sm disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-primary bg-transparent border border-outline-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-secondary bg-surface-container-lowest border border-outline-variant rounded-xl">
            No projects found. Create your first project to get started.
          </div>
        ) : (
          projects?.map((project) => (
            <article key={project.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 anti-gravity-hover flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-surface-container-low px-3 py-1 rounded-full text-xs font-semibold text-secondary inline-flex items-center gap-1 border border-outline-variant/50">
                  <FolderOpen className="w-3 h-3" />
                  Project
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(project)}
                    className="p-1.5 text-secondary hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this project? All associated subjects and topics will be deleted.')) {
                        deleteProject.mutate(project.id);
                      }
                    }}
                    className="p-1.5 text-secondary hover:text-error transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {editingId === project.id ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(project.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full bg-surface border border-outline-variant rounded px-2 py-1 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                  <button onClick={() => handleUpdate(project.id)} className="text-primary-container p-1">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-secondary p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-xl font-bold text-on-background mb-2">{project.name}</h3>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-outline-variant text-xs text-secondary">
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
