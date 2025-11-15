// =============================================
// TODAY TASKS VIEW CONTAINER HOOK
// =============================================
// Container logic for Today Tasks view with filtering and task management

import { useState, useMemo, useCallback } from 'react';
import { useInfiniteTaskList } from '@/components/InfiniteTaskList/useInfiniteTaskList';
import { useRouter } from '@/hooks/useRouter';
import type { Task, TaskStatus, TaskFilters, User } from '@/types';

// =============================================
// TYPES
// =============================================

export interface TodayTasksViewProps {
  workspaceId?: string;
  users?: User[];
  className?: string;
  onTaskClick?: (task: Task) => void;
  showEmptyState?: boolean;
}

interface TodayTasksViewState {
  tasks: Task[];
  filteredTasks: Task[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  hasOverdueTasks: boolean;
  hasDueSoonTasks: boolean;
  totalTasksCount: number;
  completedTasksCount: number;
  selectedPriorities: string[];
  selectedStatuses: TaskStatus[];
  showCompletedTasks: boolean;
}

interface TaskCounts {
  overdue: number;
  dueToday: number;
  dueSoon: number;
  completed: number;
  total: number;
}

export interface UseTodayTasksViewReturn {
  state: TodayTasksViewState;
  actions: {
    refreshTasks: () => Promise<void>;
    toggleTaskComplete: (task: Task) => Promise<void>;
    updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
    togglePriorityFilter: (priority: string) => void;
    toggleStatusFilter: (status: TaskStatus) => void;
    toggleShowCompleted: () => void;
    clearFilters: () => void;
  };
  computed: {
    taskCounts: TaskCounts;
    urgencyGroups: {
      overdue: Task[];
      dueToday: Task[];
      dueSoon: Task[];
      upcoming: Task[];
    };
    isFiltered: boolean;
    isEmpty: boolean;
  };
  infinite: {
    hasNextPage: boolean;
    fetchNextPage: () => void;
    loadingMore: boolean;
    loadMoreRef: React.RefCallback<Element>;
  };
}

// =============================================
// HELPER FUNCTIONS
// =============================================

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const isTaskDueToday = (task: Task): boolean => {
  if (!task.due_date) return false;
  const today = getTodayDateString();
  return task.due_date === today;
};

const isTaskOverdue = (task: Task): boolean => {
  if (!task.due_date || task.status === 'completed') return false;
  const today = getTodayDateString();
  return task.due_date < today;
};

const isTaskDueSoon = (task: Task): boolean => {
  if (!task.due_date || task.status === 'completed') return false;
  const today = new Date();
  const dueDate = new Date(task.due_date);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 3; // Due within next 3 days
};

const isTaskRelevantForToday = (task: Task): boolean => {
  // Task is relevant if:
  // 1. Due today
  // 2. Overdue
  // 3. Due soon (within 3 days)
  // 4. Started today (start_date is today and status is in_progress)
  // 5. Has no due date but is in progress or high/urgent priority
  
  if (isTaskDueToday(task) || isTaskOverdue(task) || isTaskDueSoon(task)) {
    return true;
  }
  
  // Check if started today
  const today = getTodayDateString();
  if (task.start_date === today && task.status === 'in_progress') {
    return true;
  }
  
  // Include high priority or urgent tasks without due dates that are active
  if (!task.due_date && 
      (task.priority === 'high' || task.priority === 'urgent') &&
      (task.status === 'in_progress' || task.status === 'todo')) {
    return true;
  }
  
  return false;
};

// =============================================
// MAIN HOOK
// =============================================

export const useTodayTasksView = (props: TodayTasksViewProps): UseTodayTasksViewReturn => {
  const { workspaceId } = props;
  const { getSearchParam, updateSearchParams } = useRouter();
  
  // URL state management
  const prioritiesParam = getSearchParam('priorities');
  const statusesParam = getSearchParam('statuses');
  const showCompletedParam = getSearchParam('showCompleted');
  const searchQueryParam = getSearchParam('search');

  // State from URL or defaults
  const [isRefreshing, setIsRefreshing] = useState(false);
  const selectedPriorities = useMemo(() => 
    prioritiesParam ? prioritiesParam.split(',') : []
  , [prioritiesParam]);
  const selectedStatuses = useMemo(() => 
    statusesParam ? statusesParam.split(',') as TaskStatus[] : []
  , [statusesParam]);
  const showCompletedTasks = showCompletedParam === 'true';
  const searchQuery = searchQueryParam || '';

  // Build filters for infinite task list
  const taskFilters = useMemo((): TaskFilters => ({
    dueToday: true,
    status: showCompletedTasks ? undefined : 'pending',
    priority: selectedPriorities.length > 0 ? selectedPriorities[0] as any : undefined,
    workspaceId: workspaceId,
  }), [showCompletedTasks, selectedPriorities, workspaceId]);

  // Use infinite task list
  const {
    tasks: allTasks,
    totalCount,
    loading,
    loadingMore,
    hasNextPage,
    fetchNextPage,
    error,
    loadMoreRef,
    refetch,
    toggleTaskCompletion,
    updateTask,
  } = useInfiniteTaskList({
    filters: taskFilters,
    searchQuery,
    pageSize: 20,
  });
  
  // Tasks come pre-filtered from infinite scroll
  const todayTasks = allTasks;
  const filteredTasks = allTasks;
  
  // Compute task counts
  const taskCounts = useMemo((): TaskCounts => {
    const overdue = todayTasks.filter(isTaskOverdue).length;
    const dueToday = todayTasks.filter(isTaskDueToday).length;
    const dueSoon = todayTasks.filter(isTaskDueSoon).length;
    const completed = todayTasks.filter(task => task.status === 'completed').length;
    
    return {
      overdue,
      dueToday,
      dueSoon,
      completed,
      total: todayTasks.length,
    };
  }, [todayTasks]);
  
  // Group tasks by urgency
  const urgencyGroups = useMemo(() => {
    return {
      overdue: filteredTasks.filter(isTaskOverdue),
      dueToday: filteredTasks.filter(task => isTaskDueToday(task) && !isTaskOverdue(task)),
      dueSoon: filteredTasks.filter(task => isTaskDueSoon(task) && !isTaskDueToday(task) && !isTaskOverdue(task)),
      upcoming: filteredTasks.filter(task => 
        !isTaskOverdue(task) && 
        !isTaskDueToday(task) && 
        !isTaskDueSoon(task)
      ),
    };
  }, [filteredTasks]);
  
  // Actions
  const refreshTasks = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Failed to refresh tasks:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);
  
  const toggleTaskComplete = useCallback(async (task: Task) => {
    try {
      await toggleTaskCompletion(task.id);
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
      throw err;
    }
  }, [toggleTaskCompletion]);
  
  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    const updatedTask: Partial<Task> = {
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined,
    };
    
    try {
      await updateTask(taskId, updatedTask);
    } catch (err) {
      console.error('Failed to update task status:', err);
      throw err;
    }
  }, [updateTask]);
  
  const togglePriorityFilter = useCallback((priority: string) => {
    const newPriorities = selectedPriorities.includes(priority) 
      ? selectedPriorities.filter(p => p !== priority)
      : [...selectedPriorities, priority];
    
    updateSearchParams({
      priorities: newPriorities.length > 0 ? newPriorities.join(',') : undefined,
    });
  }, [selectedPriorities, updateSearchParams]);
  
  const toggleStatusFilter = useCallback((status: TaskStatus) => {
    const newStatuses = selectedStatuses.includes(status) 
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    
    updateSearchParams({
      statuses: newStatuses.length > 0 ? newStatuses.join(',') : undefined,
    });
  }, [selectedStatuses, updateSearchParams]);
  
  const toggleShowCompleted = useCallback(() => {
    updateSearchParams({
      showCompleted: showCompletedTasks ? undefined : 'true',
    });
  }, [showCompletedTasks, updateSearchParams]);
  
  const clearFilters = useCallback(() => {
    updateSearchParams({
      priorities: undefined,
      statuses: undefined,
      showCompleted: undefined,
      search: undefined,
    });
  }, [updateSearchParams]);
  
  // Computed properties
  const isFiltered = selectedPriorities.length > 0 || selectedStatuses.length > 0;
  const isEmpty = filteredTasks.length === 0;
  const hasOverdueTasks = taskCounts.overdue > 0;
  const hasDueSoonTasks = taskCounts.dueSoon > 0;
  
  // State object
  const state: TodayTasksViewState = {
    tasks: todayTasks,
    filteredTasks,
    loading: loading || loadingMore,
    error: error?.message || null,
    isRefreshing,
    hasOverdueTasks,
    hasDueSoonTasks,
    totalTasksCount: totalCount,
    completedTasksCount: taskCounts.completed,
    selectedPriorities,
    selectedStatuses,
    showCompletedTasks,
  };
  
  return {
    state,
    actions: {
      refreshTasks,
      toggleTaskComplete,
      updateTaskStatus,
      togglePriorityFilter,
      toggleStatusFilter,
      toggleShowCompleted,
      clearFilters,
    },
    computed: {
      taskCounts,
      urgencyGroups,
      isFiltered,
      isEmpty,
    },
    infinite: {
      hasNextPage,
      fetchNextPage,
      loadingMore,
      loadMoreRef,
    },
  };
};