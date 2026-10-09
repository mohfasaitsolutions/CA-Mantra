import { useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getApiBaseUrl } from '@/lib/utils';

export interface Schedule {
  id: string;
  title: string;
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  readableFileSize: string;
  mimeType: string;
  examType: string;
  examSession: string;
  examYear: number;
  isActive: boolean;
  downloadCount: number;
  uploadedBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  tags: string[];
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulesResponse {
  schedules: Schedule[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ScheduleFilters {
  examType?: string;
  examSession?: string;
  examYear?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateScheduleData {
  title: string;
  description?: string;
  examType: string;
  examSession: string;
  examYear: number;
  tags?: string[];
  priority?: number;
  file: File;
}

export interface UpdateScheduleData {
  title?: string;
  description?: string;
  examType?: string;
  examSession?: string;
  examYear?: number;
  isActive?: boolean;
  tags?: string[];
  priority?: number;
}

export const useScheduleManagement = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [pagination, setPagination] = useState<SchedulesResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchSchedules = useCallback(async (filters: ScheduleFilters = {}) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query string
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${getApiBaseUrl()}/admin/schedules?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: SchedulesResponse = await response.json();
      
      setSchedules(data.schedules);
      setPagination(data.pagination);

    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
      setSchedules([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createSchedule = useCallback(async (data: CreateScheduleData) => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      formData.append('examType', data.examType);
      formData.append('examSession', data.examSession);
      formData.append('examYear', data.examYear.toString());
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      if (data.priority !== undefined) formData.append('priority', data.priority.toString());
      formData.append('file', data.file);

      const response = await fetch(`${getApiBaseUrl()}/admin/schedules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Add to local state
      setSchedules(prev => [result.schedule, ...prev]);
      
      return result.schedule;

    } catch (err) {
      console.error('Error creating schedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create schedule';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateSchedule = useCallback(async (id: string, data: UpdateScheduleData) => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiBaseUrl()}/admin/schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local state
      setSchedules(prev => prev.map(schedule => 
        schedule.id === id ? result.schedule : schedule
      ));
      
      return result.schedule;

    } catch (err) {
      console.error('Error updating schedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteSchedule = useCallback(async (id: string) => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiBaseUrl()}/admin/schedules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Remove from local state
      setSchedules(prev => prev.filter(schedule => schedule.id !== id));

    } catch (err) {
      console.error('Error deleting schedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getScheduleDetails = useCallback(async (id: string) => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiBaseUrl()}/admin/schedules/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const schedule = await response.json();
      return schedule;

    } catch (err) {
      console.error('Error getting schedule details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get schedule details';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refetch = useCallback((filters?: ScheduleFilters) => {
    return fetchSchedules(filters);
  }, [fetchSchedules]);

  return {
    schedules,
    pagination,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleDetails,
    refetch
  };
};
