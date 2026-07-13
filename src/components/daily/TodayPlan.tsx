import React, { useMemo, useState } from 'react';
import { useProjects, useCreateProject } from '../../hooks/useProjects';
import { useCategories, useCreateCategory } from '../../hooks/useCategories';
import { useTopics, useCreateTopic } from '../../hooks/useTopics';
import { useDailyPlan, useCreateDailyPlan, useDeleteDailyPlan } from '../../hooks/useDailyPlan';
import { useCreateSession } from '../../hooks/useSessions';
import { SearchableSelect } from '../ui/SearchableSelect';
import { InlineCreateModal } from '../ui/InlineCreateModal';
import { format } from 'date-fns';
import { Plus, Play, Trash2, X } from 'lucide-react';
import type { Category, Project, Topic, DailyPlanWithRelations } from '../../types';

function PlanItem({
  item,
  onStart,
  onRemove,
}: {
  item: DailyPlanWithRelations;
  onStart: () => void | Promise<void>;
  onRemove: () => void | Promise<void>;
  key?: string;
}) {
  return (
    <div className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-secondary">{item.projects?.name || 'Project'}</p>
          <h4 className="font-semibold text-on-surface">{item.topics?.name || 'Topic'}</h4>
          <p className="text-sm text-secondary">{item.categories?.name || 'Category'}</p>
        </div>
        <div className="text-sm font-semibold text-on-surface">{item.estimated_duration_minutes} min</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary"
        >
          <Play className="w-4 h-4" />
          Start
        </button>
        <button
          onClick={onRemove}
          className="inline-flex items-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-danger/80 hover:text-danger"
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </button>
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
      <div className="w-full max-w-xl rounded-[28px] border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
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

  const filteredCategories = useMemo<Category[]>(
    () => categories.filter((category) => category.project_id === projectId),
    [categories, projectId]
  );

  const filteredTopics = useMemo<Topic[]>(
    () => topics.filter((topic) => topic.category_id === categoryId),
    [topics, categoryId]
  );

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
      console.debug('Creating Today’s Plan item', payload);

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
      console.error('TodayPlan createDailyPlan failed', {
        projectId,
        categoryId,
        topicId,
        estimated_duration_minutes: minutes,
        date: today,
        error: supabaseError,
      });

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

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-on-surface">Today’s Plan</h3>
            <p className="text-sm text-secondary">Quickly add topics to study today.</p>
          </div>
          <button
            onClick={handleOpen}
            className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary"
          >
            <Plus className="w-4 h-4" />
            Add Topic
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-2xl border border-primary-container/30 bg-primary-container/10 px-4 py-3 text-sm text-primary-container">
            {successMessage}
          </div>
        )}

        {loadingTodayPlan ? (
          <div className="text-sm text-secondary">Loading Today’s Plan...</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-outline-variant bg-surface-container p-10 text-center text-sm text-secondary">
            No topics planned for today.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <PlanItem
                key={item.id}
                item={item}
                onStart={() => handleStart(item)}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </div>
        )}
      </div>

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
                className="w-full rounded-3xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
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

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-3xl border border-outline-variant px-5 py-3 text-sm font-semibold text-secondary transition-colors hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSave || createDailyPlan.isPending}
              className="rounded-3xl bg-primary-container px-5 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary disabled:opacity-50"
            >
              Add to Today’s Plan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
