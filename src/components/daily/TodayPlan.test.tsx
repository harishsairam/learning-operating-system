import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TodayPlan } from './TodayPlan';

const mockUseDailyPlan = vi.fn();
const mockUseCreateDailyPlan = vi.fn();
const mockUseDeleteDailyPlan = vi.fn();
const mockUseUpdateDailyPlan = vi.fn();
const mockUseProjects = vi.fn();
const mockUseCategories = vi.fn();
const mockUseTopics = vi.fn();
const mockUseCreateProject = vi.fn();
const mockUseCreateCategory = vi.fn();
const mockUseCreateTopic = vi.fn();
const mockUseCreateSession = vi.fn();

vi.mock('../../hooks/useDailyPlan', () => ({
  useDailyPlan: () => mockUseDailyPlan(),
  useCreateDailyPlan: () => mockUseCreateDailyPlan(),
  useDeleteDailyPlan: () => mockUseDeleteDailyPlan(),
  useUpdateDailyPlan: () => mockUseUpdateDailyPlan(),
}));

vi.mock('../../hooks/useProjects', () => ({
  useProjects: () => mockUseProjects(),
  useCreateProject: () => mockUseCreateProject(),
}));

vi.mock('../../hooks/useCategories', () => ({
  useCategories: () => mockUseCategories(),
  useCreateCategory: () => mockUseCreateCategory(),
}));

vi.mock('../../hooks/useTopics', () => ({
  useTopics: () => mockUseTopics(),
  useCreateTopic: () => mockUseCreateTopic(),
}));

vi.mock('../../hooks/useSessions', () => ({
  useCreateSession: () => mockUseCreateSession(),
}));

vi.mock('../ui/SearchableSelect', () => ({
  SearchableSelect: () => <div data-testid="searchable-select" />,
}));

vi.mock('../ui/InlineCreateModal', () => ({
  InlineCreateModal: () => null,
}));

describe('TodayPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseProjects.mockReturnValue({ data: [], isLoading: false });
    mockUseCategories.mockReturnValue({ data: [], isLoading: false });
    mockUseTopics.mockReturnValue({ data: [], isLoading: false });
    mockUseCreateProject.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseCreateCategory.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseCreateTopic.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseCreateSession.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(undefined) });
    mockUseCreateDailyPlan.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false });
    mockUseDeleteDailyPlan.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false });
    mockUseUpdateDailyPlan.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false });
  });

  it('toggles a plan item to completed and updates the progress summary', async () => {
    const updateMutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseUpdateDailyPlan.mockReturnValue({ mutateAsync: updateMutateAsync, isPending: false });
    mockUseDailyPlan.mockReturnValue({
      data: [
        {
          id: 'plan-1',
          date: '2026-07-18',
          project_id: 'project-1',
          category_id: 'category-1',
          topic_id: 'topic-1',
          estimated_duration_minutes: 30,
          priority: 'MEDIUM',
          status: 'NOT_STARTED',
          position: 0,
          memory_mode: 'ACTIVE',
          activity_type: 'study',
          created_at: '2026-07-18T00:00:00.000Z',
          updated_at: '2026-07-18T00:00:00.000Z',
          projects: { name: 'Work' },
          categories: { name: 'Study' },
          topics: { name: 'Read React' },
        },
      ],
      isLoading: false,
    });

    render(<TodayPlan />);

    fireEvent.click(screen.getByRole('button', { name: /toggle task/i }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: 'plan-1',
        updates: { status: 'COMPLETED' },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Great work! Today's plan completed/i)).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});
