import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities, useCreateActivity } from '../hooks/useActivities';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useCategories, useCreateCategory } from '../hooks/useCategories';
import { useTopics, useCreateTopic } from '../hooks/useTopics';
import { useCreateSession } from '../hooks/useSessions';
import { BookOpen, Clock, Link as LinkIcon, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { InlineCreateModal } from '../components/ui/InlineCreateModal';
import type { MemoryMode } from '../types';

export default function LearningLog() {
  const navigate = useNavigate();
  const { data: activities, isLoading: loadingActivities } = useActivities();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: topics, isLoading: loadingTopics } = useTopics();
  
  const createActivity = useCreateActivity();
  const createProject = useCreateProject();
  const createCategory = useCreateCategory();
  const createTopic = useCreateTopic();
  const createSession = useCreateSession();

  // Form state
  const [projectId, setProjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [activityType, setActivityType] = useState('Study');
  const [memoryMode, setMemoryMode] = useState<MemoryMode>('MEMORIZE');
  
  // Log Activity mode (existing)
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [studyDate, setStudyDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(format(new Date(), 'HH:mm'));
  const [duration, setDuration] = useState('30');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');

  // Start Session mode (new)
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [plannedDuration, setPlannedDuration] = useState('30');

  // Modals state
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createProjectInitialValue, setCreateProjectInitialValue] = useState('');
  
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [createCategoryInitialValue, setCreateCategoryInitialValue] = useState('');
  
  const [createTopicModalOpen, setCreateTopicModalOpen] = useState(false);
  const [createTopicInitialValue, setCreateTopicInitialValue] = useState('');

  const filteredCategories = useMemo(() => {
    return categories?.filter(c => c.project_id === projectId) || [];
  }, [categories, projectId]);

  const filteredTopics = useMemo(() => {
    return topics?.filter(t => t.category_id === categoryId) || [];
  }, [topics, categoryId]);

  const resetFormFields = () => {
    setProjectId('');
    setCategoryId('');
    setTopicId('');
    setActivityType('Study');
    setMemoryMode('MEMORIZE');
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !categoryId || !topicId || !studyDate || !startTime || !duration) return;

    createActivity.mutate(
      {
        project_id: projectId,
        category_id: categoryId,
        topic_id: topicId,
        activity_type: activityType,
        memory_mode: memoryMode,
        study_date: studyDate,
        start_time: startTime,
        duration_minutes: parseInt(duration),
        source: source.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsLoggingActivity(false);
          resetFormFields();
          setStudyDate(format(new Date(), 'yyyy-MM-dd'));
          setStartTime(format(new Date(), 'HH:mm'));
          setDuration('30');
          setSource('');
          setNotes('');
        },
      }
    );
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !categoryId || !topicId || !plannedDuration) return;
    const payload = {
      project_id: projectId,
      category_id: categoryId,
      topic_id: topicId,
      memory_mode: memoryMode,
      activity_type: activityType,
      planned_duration_minutes: parseInt(plannedDuration),
    };

    console.debug('Creating session with payload:', payload);

    try {
      const session = await createSession.mutateAsync(payload);
      console.debug('Create session response:', session);

      if (!session || !session.id) {
        console.error('Create session returned no id:', session);
        return;
      }

      // Navigate to active session
      navigate(`/sessions/${session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleCreateProject = (name: string) => {
    createProject.mutate(name, {
      onSuccess: (data: any) => {
        setProjectId(data.id);
        setCategoryId('');
        setTopicId('');
        setCreateProjectModalOpen(false);
      }
    });
  };

  const handleCreateCategory = (name: string) => {
    createCategory.mutate({ name, project_id: projectId }, {
      onSuccess: (data: any) => {
        setCategoryId(data.id);
        setTopicId('');
        setCreateCategoryModalOpen(false);
      }
    });
  };

  const handleCreateTopic = (name: string) => {
    createTopic.mutate({ name, category_id: categoryId }, {
      onSuccess: (data: any) => {
        setTopicId(data.id);
        setCreateTopicModalOpen(false);
      }
    });
  };

  if (loadingActivities || loadingProjects || loadingCategories || loadingTopics) {
    return <div className="animate-pulse">Loading learning log...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          {(isLoggingActivity || isStartingSession) && (
            <button 
              onClick={() => {
                setIsLoggingActivity(false);
                setIsStartingSession(false);
                resetFormFields();
              }}
              className="text-secondary hover:text-primary transition-colors text-sm font-semibold flex items-center gap-1 mb-2"
            >
              ← Back to Log
            </button>
          )}
          <h1 className="font-display text-4xl font-bold text-on-surface mb-2 tracking-tight">
            {isLoggingActivity ? 'Log Learning' : isStartingSession ? 'Start Session' : 'Learning Log'}
          </h1>
          <p className="text-lg text-secondary">
            {isLoggingActivity 
              ? 'Record a past learning activity to track progress and schedule intelligent revisions.' 
              : isStartingSession
              ? 'Start an active learning session with real-time focus tracking.'
              : 'Review your past learning activities.'}
          </p>
        </div>
        {!isLoggingActivity && !isStartingSession && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsLoggingActivity(true);
                resetFormFields();
              }}
              className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-sm font-semibold hover:bg-outline-variant/30 transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Log Learning
            </button>
            <button
              onClick={() => {
                setIsStartingSession(true);
                resetFormFields();
              }}
              className="px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Zap className="h-4 w-4" />
              Start Session
            </button>
          </div>
        )}
      </div>

      {isLoggingActivity ? (
        <div className="max-w-3xl bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-10 shadow-sm">
          <form onSubmit={handleCreateActivity} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Project *</label>
                <div className="relative">
                  <SearchableSelect
                    value={projectId}
                    onChange={(val) => {
                      setProjectId(val);
                      setCategoryId('');
                      setTopicId('');
                    }}
                    options={projects?.map(p => ({ id: p.id, name: p.name })) || []}
                    placeholder="Select a project"
                    onCreate={(val) => {
                      setCreateProjectInitialValue(val);
                      setCreateProjectModalOpen(true);
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Category *</label>
                <div className="relative">
                  <SearchableSelect
                    value={categoryId}
                    onChange={(val) => {
                      setCategoryId(val);
                      setTopicId('');
                    }}
                    options={filteredCategories.map(c => ({ id: c.id, name: c.name })) || []}
                    placeholder="Select a category"
                    disabled={!projectId}
                    onCreate={projectId ? (val) => {
                      setCreateCategoryInitialValue(val);
                      setCreateCategoryModalOpen(true);
                    } : undefined}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Topic *</label>
                <div className="relative">
                  <SearchableSelect
                    value={topicId}
                    onChange={(val) => setTopicId(val)}
                    options={filteredTopics.map(t => ({ id: t.id, name: t.name })) || []}
                    placeholder="Select a topic"
                    disabled={!categoryId}
                    onCreate={categoryId ? (val) => {
                      setCreateTopicInitialValue(val);
                      setCreateTopicModalOpen(true);
                    } : undefined}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Activity Type *</label>
                <div className="relative">
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                    required
                  >
                    <option value="Study">Study</option>
                    <option value="Revision">Revision</option>
                    <option value="PYQ Practice">PYQ Practice</option>
                    <option value="Mock Test">Mock Test</option>
                    <option value="Video Lecture">Video Lecture</option>
                    <option value="Reading">Reading</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Memory Mode *</label>
                <div className="relative">
                  <select
                    value={memoryMode}
                    onChange={(e) => setMemoryMode(e.target.value as MemoryMode)}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                    required
                  >
                    <option value="REFERENCE">Reference (no revisions)</option>
                    <option value="LEARN_ONCE">Learn Once (1 day)</option>
                    <option value="MEMORIZE">Memorize (1, 3, 7, 15, 30 days)</option>
                    <option value="MASTER">Master (1, 3, 7, 15, 30, 60, 90, 180, 365 days)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={studyDate}
                    onChange={(e) => setStudyDate(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Start Time *</label>
                <div className="relative">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Duration (Minutes) *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                    required
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary w-5 h-5 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Source Material <span className="text-secondary font-normal">(Optional)</span></label>
                <div className="relative">
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Link, book title, or reference..."
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                  />
                  <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary w-5 h-5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-on-surface">Notes</label>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Capture key insights, questions, or concepts you want to remember..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant/50">
              <button
                type="button"
                onClick={() => {
                  setIsLoggingActivity(false);
                  resetFormFields();
                }}
                className="px-6 py-3 rounded-lg text-sm font-semibold text-primary bg-transparent border border-transparent hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createActivity.isPending}
                className="px-6 py-3 rounded-lg text-sm font-semibold text-on-primary bg-primary-container hover:bg-primary-fixed-dim hover:text-on-primary-fixed-variant transition-colors shadow-sm disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      ) : isStartingSession ? (
        <div className="max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-10 shadow-sm">
          <form onSubmit={handleStartSession} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Project *</label>
                <div className="relative">
                  <SearchableSelect
                    value={projectId}
                    onChange={(val) => {
                      setProjectId(val);
                      setCategoryId('');
                      setTopicId('');
                    }}
                    options={projects?.map(p => ({ id: p.id, name: p.name })) || []}
                    placeholder="Select a project"
                    onCreate={(val) => {
                      setCreateProjectInitialValue(val);
                      setCreateProjectModalOpen(true);
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Category *</label>
                <div className="relative">
                  <SearchableSelect
                    value={categoryId}
                    onChange={(val) => {
                      setCategoryId(val);
                      setTopicId('');
                    }}
                    options={filteredCategories.map(c => ({ id: c.id, name: c.name })) || []}
                    placeholder="Select a category"
                    disabled={!projectId}
                    onCreate={projectId ? (val) => {
                      setCreateCategoryInitialValue(val);
                      setCreateCategoryModalOpen(true);
                    } : undefined}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Topic *</label>
                <div className="relative">
                  <SearchableSelect
                    value={topicId}
                    onChange={(val) => setTopicId(val)}
                    options={filteredTopics.map(t => ({ id: t.id, name: t.name })) || []}
                    placeholder="Select a topic"
                    disabled={!categoryId}
                    onCreate={categoryId ? (val) => {
                      setCreateTopicInitialValue(val);
                      setCreateTopicModalOpen(true);
                    } : undefined}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Activity Type *</label>
                <div className="relative">
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                    required
                  >
                    <option value="Study">Study</option>
                    <option value="Revision">Revision</option>
                    <option value="PYQ Practice">PYQ Practice</option>
                    <option value="Mock Test">Mock Test</option>
                    <option value="Video Lecture">Video Lecture</option>
                    <option value="Reading">Reading</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Memory Mode *</label>
                <div className="relative">
                  <select
                    value={memoryMode}
                    onChange={(e) => setMemoryMode(e.target.value as MemoryMode)}
                    className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                    required
                  >
                    <option value="REFERENCE">Reference (no revisions)</option>
                    <option value="LEARN_ONCE">Learn Once (1 day)</option>
                    <option value="MEMORIZE">Memorize (1, 3, 7, 15, 30 days)</option>
                    <option value="MASTER">Master (1, 3, 7, 15, 30, 60, 90, 180, 365 days)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Planned Duration *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45, 60, 90, 120].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setPlannedDuration(min.toString())}
                      className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                        plannedDuration === min.toString()
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-high text-on-surface hover:bg-outline-variant/30'
                      }`}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={plannedDuration}
                    onChange={(e) => setPlannedDuration(e.target.value)}
                    placeholder="Custom (minutes)"
                    className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant/50">
              <button
                type="button"
                onClick={() => {
                  setIsStartingSession(false);
                  resetFormFields();
                }}
                className="px-6 py-3 rounded-lg text-sm font-semibold text-primary bg-transparent border border-transparent hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSession.isPending}
                className="px-6 py-3 rounded-lg text-sm font-semibold text-on-primary bg-primary-container hover:bg-primary transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {createSession.isPending ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activities?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-secondary bg-surface-container-lowest border border-outline-variant rounded-xl">
              No activities found. Log your first learning activity to get started.
            </div>
          ) : (
            activities?.map((activity: any) => (
              <div key={activity.id} className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl anti-gravity-hover flex flex-col justify-between group cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-container/10 rounded-lg flex items-center justify-center text-primary-container shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-on-surface mb-1">{activity.topics?.name || 'Topic'}</h4>
                    <p className="text-sm text-secondary">{activity.duration_minutes} mins • {activity.activity_type || 'Study'}</p>
                  </div>
                </div>
                <div className="text-xs text-secondary mt-auto border-t border-outline-variant/50 pt-4 flex justify-between items-center">
                  <span>{format(new Date(activity.study_date), 'MMMM d, yyyy')} {activity.start_time ? `at ${activity.start_time}` : ''}</span>
                  <span className="bg-surface-container-low px-2 py-1 rounded text-[10px] uppercase font-semibold">
                    {activity.topics?.categories?.name || 'Category'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
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
    </div>
  );
}
