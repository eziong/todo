// =============================================
// COMPLETED TASKS VIEW CONTAINER HOOK
// =============================================
// Container logic for Completed Tasks view with filtering and reopen functionality

import { useState, useMemo, useCallback } from 'react';
import { useTask } from '@/hooks/useTask';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import type { Task, TaskPriority, User } from '@/types/database';

// =============================================
// TYPES
// =============================================

export interface CompletedTasksViewProps {
  workspaceId?: string;
  users?: User[];
  className?: string;
  onTaskClick?: (task: Task) => void;
  showEmptyState?: boolean;
}

type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type SortField = 'completed_at' | 'title' | 'priority' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface CompletedTasksViewState {
  tasks: Task[];
  filteredTasks: Task[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  selectedPriorities: TaskPriority[];
  selectedAssignees: string[];
  dateRangeFilter: DateRangeFilter;
  customDateRange: {
    start: string | null;
    end: string | null;
  };
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
}

interface CompletionStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byPriority: Record<TaskPriority, number>;
  byAssignee: Record<string, number>;
}

export interface UseCompletedTasksViewReturn {
  state: CompletedTasksViewState;
  actions: {
    refreshTasks: () => Promise<void>;
    reopenTask: (task: Task) => Promise<void>;
    permanentlyDeleteTask: (taskId: string) => Promise<void>;
    archiveTask: (taskId: string) => Promise<void>;
    togglePriorityFilter: (priority: TaskPriority) => void;
    toggleAssigneeFilter: (userId: string) => void;
    setDateRangeFilter: (range: DateRangeFilter) => void;
    setCustomDateRange: (start: string | null, end: string | null) => void;
    setSorting: (field: SortField, direction: SortDirection) => void;
    setSearchQuery: (query: string) => void;
    clearFilters: () => void;
  };
  computed: {
    completionStats: CompletionStats;
    isFiltered: boolean;
    isEmpty: boolean;
    groupedTasks: {
      today: Task[];
      yesterday: Task[];
      thisWeek: Task[];
      thisMonth: Task[];
      older: Task[];
    };
  };
}

// =============================================
// HELPER FUNCTIONS
// =============================================

const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getTodayString = (): string => getDateString(new Date());

const getYesterdayString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
};

const getWeekStartString = (): string => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  return getDateString(startOfWeek);
};

const getMonthStartString = (): string => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return getDateString(startOfMonth);
};

const isCompletedToday = (task: Task): boolean => {
  if (!task.completed_at) return false;
  const completedDate = new Date(task.completed_at).toISOString().split('T')[0];
  return completedDate === getTodayString();
};

const isCompletedYesterday = (task: Task): boolean => {
  if (!task.completed_at) return false;
  const completedDate = new Date(task.completed_at).toISOString().split('T')[0];
  return completedDate === getYesterdayString();
};

const isCompletedThisWeek = (task: Task): boolean => {
  if (!task.completed_at) return false;
  const completedDate = new Date(task.completed_at).toISOString().split('T')[0];
  return completedDate >= getWeekStartString() && completedDate <= getTodayString();
};

const isCompletedThisMonth = (task: Task): boolean => {
  if (!task.completed_at) return false;
  const completedDate = new Date(task.completed_at).toISOString().split('T')[0];
  return completedDate >= getMonthStartString() && completedDate <= getTodayString();
};

const sortTasks = (tasks: Task[], field: SortField, direction: SortDirection): Task[] => {
  return [...tasks].sort((a, b) => {
    let aValue: string | number | undefined;
    let bValue: string | number | undefined;

    switch (field) {
      case 'completed_at':
        aValue = a.completed_at || '';
        bValue = b.completed_at || '';
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'created_at':
        aValue = a.created_at;
        bValue = b.created_at;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

// =============================================
// MAIN HOOK
// =============================================

export const useCompletedTasksView = (props: CompletedTasksViewProps): UseCompletedTasksViewReturn => {
  const { workspaceId } = props;
  
  // Hooks
  const { task: tasks, loading, error, refetch } = useTask(null);
  const { updateTask, deleteTask } = useTaskMutations();
  
  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });
  const [sortField, setSortField] = useState<SortField>('completed_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter to completed tasks only
  const completedTasks = useMemo(() => {
    // TODO: Replace with actual task fetching logic
    return [] as Task[];
  }, []);
  
  // Apply filters
  const filteredTasks = useMemo(() => {
    let filtered = completedTasks;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(task => selectedPriorities.includes(task.priority));
    }
    
    // Assignee filter
    if (selectedAssignees.length > 0) {
      filtered = filtered.filter(task => 
        task.assigned_to_user_id && selectedAssignees.includes(task.assigned_to_user_id)
      );
    }
    
    // Date range filter
    if (dateRangeFilter !== 'all' && dateRangeFilter !== 'custom') {
      const today = getTodayString();
      const weekStart = getWeekStartString();
      const monthStart = getMonthStartString();
      
      filtered = filtered.filter(task => {
        if (!task.completed_at) return false;
        const completedDate = new Date(task.completed_at).toISOString().split('T')[0];
        
        switch (dateRangeFilter) {
          case 'today':
            return completedDate === today;
          case 'week':
            return completedDate >= weekStart;
          case 'month':
            return completedDate >= monthStart;
          default:
            return true;
        }
      });
    } else if (dateRangeFilter === 'custom' && customDateRange.start && customDateRange.end) {
      filtered = filtered.filter(task => {
        if (!task.completed_at) return false;
        const completedDate = new Date(task.completed_at).toISOString().split('T')[0];
        return customDateRange.start && customDateRange.end && 
               completedDate >= customDateRange.start && completedDate <= customDateRange.end;
      });
    }
    
    // Sort
    return sortTasks(filtered, sortField, sortDirection);
  }, [completedTasks, searchQuery, selectedPriorities, selectedAssignees, dateRangeFilter, customDateRange, sortField, sortDirection]);
  
  // Group tasks by completion period
  const groupedTasks = useMemo(() => {
    return {
      today: filteredTasks.filter(isCompletedToday),
      yesterday: filteredTasks.filter(isCompletedYesterday),
      thisWeek: filteredTasks.filter(task => 
        isCompletedThisWeek(task) && !isCompletedToday(task) && !isCompletedYesterday(task)
      ),
      thisMonth: filteredTasks.filter(task => 
        isCompletedThisMonth(task) && !isCompletedThisWeek(task)
      ),
      older: filteredTasks.filter(task => !isCompletedThisMonth(task)),
    };
  }, [filteredTasks]);
  
  // Compute completion stats
  const completionStats = useMemo((): CompletionStats => {
    const byPriority: Record<TaskPriority, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
    const byAssignee: Record<string, number> = {};
    
    completedTasks.forEach(task => {
      byPriority[task.priority]++;
      
      if (task.assigned_to_user_id) {
        byAssignee[task.assigned_to_user_id] = (byAssignee[task.assigned_to_user_id] || 0) + 1;
      }
    });
    
    return {
      total: completedTasks.length,
      today: completedTasks.filter(isCompletedToday).length,
      thisWeek: completedTasks.filter(isCompletedThisWeek).length,
      thisMonth: completedTasks.filter(isCompletedThisMonth).length,
      byPriority,
      byAssignee,
    };
  }, [completedTasks]);
  
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
  
  const reopenTask = useCallback(async (task: Task) => {
    const updatedTask: Partial<Task> = {
      status: 'todo',
      completed_at: undefined,
    };
    
    try {
      await updateTask(task.id, updatedTask);
    } catch (err) {
      console.error('Failed to reopen task:', err);
      throw err;
    }
  }, [updateTask]);
  
  const permanentlyDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  }, [deleteTask]);
  
  const archiveTask = useCallback(async (taskId: string) => {
    // Note: This would need to be implemented based on your archive system
    // For now, we'll just update the task status
    const updatedTask: Partial<Task> = {
      status: 'cancelled', // Using cancelled as archived status
    };
    
    try {
      await updateTask(taskId, updatedTask);
    } catch (err) {
      console.error('Failed to archive task:', err);
      throw err;
    }
  }, [updateTask]);
  
  const togglePriorityFilter = useCallback((priority: TaskPriority) => {
    setSelectedPriorities(prev => 
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  }, []);
  
  const toggleAssigneeFilter = useCallback((userId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);
  
  const handleSetDateRangeFilter = useCallback((range: DateRangeFilter) => {
    setDateRangeFilter(range);
    if (range !== 'custom') {
      setCustomDateRange({ start: null, end: null });
    }
  }, []);
  
  const handleSetCustomDateRange = useCallback((start: string | null, end: string | null) => {
    setCustomDateRange({ start, end });
    if (start && end) {
      setDateRangeFilter('custom');
    }
  }, []);
  
  const setSorting = useCallback((field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);
  
  const clearFilters = useCallback(() => {
    setSelectedPriorities([]);
    setSelectedAssignees([]);
    setDateRangeFilter('all');
    setCustomDateRange({ start: null, end: null });
    setSearchQuery('');
  }, []);
  
  // Computed properties
  const isFiltered = selectedPriorities.length > 0 || 
                    selectedAssignees.length > 0 || 
                    dateRangeFilter !== 'all' || 
                    searchQuery.trim() !== '';
  const isEmpty = filteredTasks.length === 0;
  
  // State object
  const state: CompletedTasksViewState = {
    tasks: completedTasks,
    filteredTasks,
    loading,
    error,
    isRefreshing,
    selectedPriorities,
    selectedAssignees,
    dateRangeFilter,
    customDateRange,
    sortField,
    sortDirection,
    searchQuery,
  };
  
  return {
    state,
    actions: {
      refreshTasks,
      reopenTask,
      permanentlyDeleteTask,
      archiveTask,
      togglePriorityFilter,
      toggleAssigneeFilter,
      setDateRangeFilter: handleSetDateRangeFilter,
      setCustomDateRange: handleSetCustomDateRange,
      setSorting,
      setSearchQuery,
      clearFilters,
    },
    computed: {
      completionStats,
      isFiltered,
      isEmpty,
      groupedTasks,
    },
  };
};