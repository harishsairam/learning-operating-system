import React, { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '../hooks/useCategories';
import { useProjects } from '../hooks/useProjects';
import { Plus, Pencil, Trash2, X, Check, Book } from 'lucide-react';

export default function Categories() {
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editProjectId, setEditProjectId] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newProjectId) return;
    
    createCategory.mutate(
      { name: newName.trim(), project_id: newProjectId },
      {
        onSuccess: () => {
          setIsCreating(false);
          setNewName('');
          setNewProjectId('');
        }
      }
    );
  };

  const startEdit = (category: any) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditProjectId(category.project_id);
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim() || !editProjectId) return;
    updateCategory.mutate(
      { id, name: editName.trim(), project_id: editProjectId },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditName('');
          setEditProjectId('');
        }
      }
    );
  };

  if (loadingCategories || loadingProjects) {
    return <div className="animate-pulse">Loading categories...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-on-surface mb-2 tracking-tight">Categories</h1>
          <p className="text-lg text-secondary">Manage categories within your projects.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Category
        </button>
      </div>

      {isCreating && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row items-center gap-4">
            <select
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
              className="w-full sm:w-64 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
              required
            >
              <option value="" disabled>Select Project</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category Name"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
              required
            />
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                type="submit"
                disabled={createCategory.isPending}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-semibold text-on-primary bg-primary-container hover:bg-primary-fixed-dim hover:text-on-primary-fixed-variant transition-colors shadow-sm disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-semibold text-primary bg-transparent border border-outline-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-secondary bg-surface-container-lowest border border-outline-variant rounded-xl">
            No categories found.
          </div>
        ) : (
          categories?.map((category: any) => (
            <article key={category.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 anti-gravity-hover flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-surface-container-low px-3 py-1 rounded-full text-xs font-semibold text-secondary inline-flex items-center gap-1 border border-outline-variant/50">
                  <Book className="w-3 h-3" />
                  {category.projects?.name || 'Unknown Project'}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(category)}
                    className="p-1.5 text-secondary hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this category? All associated topics will be deleted.')) {
                        deleteCategory.mutate(category.id);
                      }
                    }}
                    className="p-1.5 text-secondary hover:text-error transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {editingId === category.id ? (
                <div className="flex flex-col gap-2 mt-2">
                  <select
                    value={editProjectId}
                    onChange={(e) => setEditProjectId(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded px-2 py-1 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                  >
                    {projects?.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(category.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full bg-surface border border-outline-variant rounded px-2 py-1 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                    />
                    <button onClick={() => handleUpdate(category.id)} className="text-primary-container p-1">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-secondary p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-xl font-bold text-on-background mb-2">{category.name}</h3>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-outline-variant text-xs text-secondary">
                    <span>Created {new Date(category.created_at).toLocaleDateString()}</span>
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
