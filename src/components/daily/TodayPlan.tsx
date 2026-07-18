import React, { useEffect, useMemo, useState } from 'react';
import { useProjects, useCreateProject } from '../../hooks/useProjects';
import { useCategories, useCreateCategory } from '../../hooks/useCategories';
import { useTopics, useCreateTopic } from '../../hooks/useTopics';
import { useDailyPlan, useCreateDailyPlan, useDeleteDailyPlan, useUpdateDailyPlan } from '../../hooks/useDailyPlan';
import { useCreateSession } from '../../hooks/useSessions';
import { SearchableSelect } from '../ui/SearchableSelect';
import { InlineCreateModal } from '../ui/InlineCreateModal';
import { format } from 'date-fns';
import { Play, Trash2, X, Check, Circle, Calendar, Clock3, Sparkles } from 'lucide-react';
import type { Category, Project, Topic, DailyPlanWithRelations } from '../../types';

function PlanItem({
  item,
  onStart,
  onRemove,
  onToggle,
}: {
  item: DailyPlanWithRelations;
  onStart: () => void | Promise<void>;
  onRemove: () => void | Promise<void>;
  onToggle: () => void | Promise<void>;
  key?: string;
}) {
  const isCompleted = item.status === 'COMPLETED';

  return (
    <div className={`group flex items-start gap-3 border-b border-outline-variant/30 px-4 py-3 last:border-0 transition-colors ${isCompleted ? 'bg-emerald-50/40' : 'hover:bg-surface-container-lowest'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle task"
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-outline-variant/70 transition-all duration-200 hover:scale-105"
      >
        {isCompleted ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition-all duration-200">
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-transparent transition-all duration-200">
            <Circle className="h-4 w-4 text-outline-variant" />
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className={`text-sm font-semibold transition-all duration-200 ${isCompleted ? 'text-on-surface/70 line-through opacity-70' : 'text-on-surface'}`}>
              {item.topics?.name || 'Untitled task'}
            </h4>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-secondary">
              <span>{item.projects?.name || 'Project'}</span>
              <span>•</span>
              <span>{item.categories?.name || 'Category'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-outline-variant/70 bg-surface-container-low px-2.5 py-1 text-xs font-medium text-secondary">
              <Clock3 className="h-3.5 w-3.5" />
              <span>{item.estimated_duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={onStart}
                className="rounded bg-primary-container p-1.5 text-on-primary transition-colors hover:bg-primary"
                title="Start Session"
              >
                <Play className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="rounded border border-outline-variant p-1.5 text-secondary transition-colors hover:border-danger hover:text-danger"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({
  isOpen,
  onClose,
  children,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-on-surface">{title}</h3>
          <button onClick={onClose} className="text-secondary transition-colors hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ValidationMessage({ message }: { message: string }) {
  return <p className="text-sm text-danger">{message}</p>;
}

export function TodayPlan() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: topics = [], isLoading: loadingTopics } = useTopics();
  const { data: items = [], isLoading: loadingTodayPlan } = useDailyPlan(today);
  const createDailyPlan = useCreateDailyPlan();
  const updateDailyPlan = useUpdateDailyPlan();
  const deleteDailyPlan = useDeleteDailyPlan();
  const createSession = useCreateSession();
  const createProject = useCreateProject();
  const createCategory = useCreateCategory();
  const createTopic = useCreateTopic();

  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [duration, setDuration] = useState('30');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [createTopicModalOpen, setCreateTopicModalOpen] = useState(false);
  const [createProjectInitialValue, setCreateProjectInitialValue] = useState('');
  const [createCategoryInitialValue, setCreateCategoryInitialValue] = useState('');
  const [createTopicInitialValue, setCreateTopicInitialValue] = useState('');
  const [localItems, setLocalItems] = useState<DailyPlanWithRelations[]>([]);

  const filteredCategories = useMemo<Category[]>(
    () => categories.filter((category) => category.project_id === projectId),
    [categories, projectId]
  );

  const filteredTopics = useMemo<Topic[]>(
    () => topics.filter((topic) => topic.category_id === categoryId),
    [topics, categoryId]
  );

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const resetForm = () => {
    setProjectId('');
    setCategoryId('');
    setTopicId('');
    setDuration('30');
    setError('');
  };

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleProjectChange = (value: string) => {
    setProjectId(value);
    setCategoryId('');
    setTopicId('');
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setTopicId('');
  };

  const handleCreateProject = (name: string) => {
    createProject.mutate(name, {
      onSuccess: (data) => {
        setProjectId(data.id);
        setCategoryId('');
        setTopicId('');
        setCreateProjectModalOpen(false);
      },
    });
  };

  const handleCreateCategory = (name: string) => {
    if (!projectId) return;
    createCategory.mutate({ name, project_id: projectId }, {
      onSuccess: (data) => {
        setCategoryId(data.id);
        setTopicId('');
        setCreateCategoryModalOpen(false);
      },
    });
  };

  const handleCreateTopic = (name: string) => {
    if (!categoryId) return;
    createTopic.mutate({ name, category_id: categoryId }, {
      onSuccess: (data) => {
        setTopicId(data.id);
        setCreateTopicModalOpen(false);
      },
    });
  };

  const handleSubmit = async () => {
    if (!projectId || !categoryId || !topicId || !duration) {
      setError('Project, category, topic, and duration are required.');
      return;
    }

    const minutes = parseInt(duration, 10);
    if (Number.isNaN(minutes) || minutes <= 0) {
      setError('Estimated duration must be a positive number.');
      return;
    }

    setError('');

    try {
      const payload = {
        date: today,
        project_id: projectId,
        category_id: categoryId,
        topic_id: topicId,
        estimated_duration_minutes: minutes,
      };
      
      await createDailyPlan.mutateAsync(payload);
      setSuccessMessage('Topic added to Today’s Plan.');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsOpen(false);
      resetForm();
    } catch (error) {
      const supabaseError = error as {
        code?: string;
        message?: string;
        details?: string | null;
        hint?: string | null;
      };
      
      const messageParts = [supabaseError.message, supabaseError.details, supabaseError.hint].filter(Boolean);
      setError(messageParts.join(' — ') || 'Failed to add topic to Today’s Plan.');
    }
  };

  const canSave = Boolean(projectId && categoryId && topicId && duration);

  const handleStart = async (item: DailyPlanWithRelations) => {
    try {
      await createSession.mutateAsync({
        project_id: item.project_id,
        category_id: item.category_id,
        topic_id: item.topic_id,
        memory_mode: item.memory_mode,
        activity_type: item.activity_type,
        planned_duration_minutes: item.estimated_duration_minutes,
      });
    } catch (error) {
      setError('Failed to start session.');
    }
  };

  const handleToggle = async (item: DailyPlanWithRelations) => {
    const nextStatus = item.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    const previousItems = localItems;

    setLocalItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id ? { ...currentItem, status: nextStatus } : currentItem
      )
    );

    try {
      await updateDailyPlan.mutateAsync({
        id: item.id,
        updates: { status: nextStatus },
      });
    } catch (error) {
      setLocalItems(previousItems);
      setError('Failed to update status.');
    }
  };

  const handleRemove = async (item: DailyPlanWithRelations) => {
    if (!window.confirm('Remove this planned topic from Today’s Plan?')) return;
    setRemovingId(item.id);

    try {
      await deleteDailyPlan.mutateAsync(item.id);
      setRemovingId(null);
    } catch (error) {
      setRemovingId(null);
      setError('Failed to remove planned topic.');
    }
  };

  const noProjects = !loadingProjects && projects.length === 0;
  const noCategoriesForProject = Boolean(projectId && filteredCategories.length === 0);
  const noTopicsForCategory = Boolean(categoryId && filteredTopics.length === 0);

  const completedCount = localItems.filter((item) => item.status === 'COMPLETED').length;
  const totalCount = localItems.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const isAllComplete = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between p-5 border-b border-outline-variant/30 bg-surface-container-lowest">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-container/10 rounded-lg text-primary-container">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-on-surface font-display">Today's Plan</h3>
        </div>
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary"
        >
          <span className="text-sm">+</span>
          <span>Add Item</span>
        </button>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto bg-surface">
        {loadingTodayPlan ? (
          <div className="p-8 text-center text-sm text-secondary">Loading Today's Plan...</div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center p-8 text-center text-sm text-secondary">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
              <Sparkles className="h-6 w-6 text-outline" />
            </div>
            <p className="text-base font-semibold text-on-surface">Nothing planned yet</p>
            <p className="mt-1 max-w-xs text-sm text-secondary">Add your first task and build a focused plan for today.</p>
            <button
              onClick={handleOpen}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-container px-3 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary"
            >
              <span className="text-base">+</span>
              <span>Add Item</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {localItems.map((item) => (
              <PlanItem
                key={item.id}
                item={item}
                onStart={() => handleStart(item)}
                onRemove={() => handleRemove(item)}
                onToggle={() => handleToggle(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Progress Footer */}
      {totalCount > 0 && (
        <div className="border-t border-outline-variant/30 bg-surface-container-lowest p-5">
          <div className={`mb-3 h-2 w-full overflow-hidden rounded-full ${isAllComplete ? 'bg-emerald-100' : 'bg-surface-container-high'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ease-in-out ${isAllComplete ? 'bg-emerald-500' : 'bg-primary-container'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={isAllComplete ? 'text-emerald-700' : 'text-secondary'}>
              {isAllComplete ? "🎉 Great work! Today's plan completed." : `${completedCount} of ${totalCount} completed`}
            </span>
            <span className={isAllComplete ? 'text-emerald-700' : 'text-secondary'}>{progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Modals remain the same */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Topic to Today’s Plan">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <SearchableSelect
                value={projectId}
                onChange={handleProjectChange}
                options={projects.map((project) => ({ id: project.id, name: project.name }))}
                placeholder="Select project"
                createLabel="+ Create New Project"
                onCreate={(name) => {
                  setCreateProjectInitialValue(name);
                  setCreateProjectModalOpen(true);
                }}
                disabled={loadingProjects}
              />
              {noProjects && (
                <div className="flex flex-col gap-2">
                  <ValidationMessage message="No projects found. Please create a Project first." />
                  <button
                    type="button"
                    onClick={() => setCreateProjectModalOpen(true)}
                    className="text-sm font-semibold text-primary hover:text-primary-container transition-colors"
                  >
                    + Create Project
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <SearchableSelect
                value={categoryId}
                onChange={handleCategoryChange}
                options={filteredCategories.map((category) => ({ id: category.id, name: category.name }))}
                placeholder="Select category"
                createLabel="+ Create New Category"
                onCreate={projectId ? (name) => {
                  setCreateCategoryInitialValue(name);
                  setCreateCategoryModalOpen(true);
                } : undefined}
                disabled={!projectId || loadingCategories}
              />
              {projectId && noCategoriesForProject && (
                <div className="flex flex-col gap-2">
                  <ValidationMessage message="No categories found for this Project." />
                  <button
                    type="button"
                    onClick={() => setCreateCategoryModalOpen(true)}
                    className="text-sm font-semibold text-primary hover:text-primary-container transition-colors"
                  >
                    + Create Category
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <SearchableSelect
                value={topicId}
                onChange={setTopicId}
                options={filteredTopics.map((topic) => ({ id: topic.id, name: topic.name }))}
                placeholder="Select topic"
                createLabel="+ Create New Topic"
                onCreate={categoryId ? (name) => {
                  setCreateTopicInitialValue(name);
                  setCreateTopicModalOpen(true);
                } : undefined}
                disabled={!categoryId || loadingTopics}
              />
              {categoryId && noTopicsForCategory && (
                <div className="flex flex-col gap-2">
                  <ValidationMessage message="No topics found for this Category." />
                  <button
                    type="button"
                    onClick={() => setCreateTopicModalOpen(true)}
                    className="text-sm font-semibold text-primary hover:text-primary-container transition-colors"
                  >
                    + Create Topic
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Estimated Duration</label>
              <input
                type="number"
                value={duration}
                min="1"
                onChange={(event) => setDuration(event.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
              />
            </div>
          </div>

          {error && <ValidationMessage message={error} />}

          <InlineCreateModal
            isOpen={createProjectModalOpen}
            onClose={() => setCreateProjectModalOpen(false)}
            title="Create New Project"
            initialValue={createProjectInitialValue}
            onSubmit={handleCreateProject}
            isLoading={createProject.isPending}
          />

          <InlineCreateModal
            isOpen={createCategoryModalOpen}
            onClose={() => setCreateCategoryModalOpen(false)}
            title="Create New Category"
            initialValue={createCategoryInitialValue}
            onSubmit={handleCreateCategory}
            isLoading={createCategory.isPending}
          />

          <InlineCreateModal
            isOpen={createTopicModalOpen}
            onClose={() => setCreateTopicModalOpen(false)}
            title="Create New Topic"
            initialValue={createTopicInitialValue}
            onSubmit={handleCreateTopic}
            isLoading={createTopic.isPending}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSave || createDailyPlan.isPending}
              className="rounded-xl bg-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary disabled:opacity-50"
            >
              Add to Today’s Plan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
