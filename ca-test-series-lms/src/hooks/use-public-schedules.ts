import { useState, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/utils';

export interface PublicSchedule {
  id: string;
  title: string;
  description: string;
  fileName: string;
  readableFileSize: string;
  examType: string;
  examSession: string;
  examYear: number;
  tags: string[];
  priority: number;
}

export interface PublicSchedulesResponse {
  schedules: PublicSchedule[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalSchedules: number;
    foundationSchedules: number;
    intermediateSchedules: number;
    finalSchedules: number;
    allLevelSchedules: number;
  };
}

export interface ScheduleFilters {
  examType?: string;
  examSession?: string;
  examYear?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const usePublicSchedules = () => {
  const [schedules, setSchedules] = useState<PublicSchedule[]>([]);
  const [pagination, setPagination] = useState<PublicSchedulesResponse['pagination'] | null>(null);
  const [summary, setSummary] = useState<PublicSchedulesResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async (filters: ScheduleFilters = {}) => {
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
        `${getApiBaseUrl()}/schedules/public?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: PublicSchedulesResponse = await response.json();
      
      setSchedules(data.schedules);
      setPagination(data.pagination);
      setSummary(data.summary);

    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
      setSchedules([]);
      setPagination(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadSchedule = useCallback(async (scheduleId: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/schedules/${scheduleId}/download`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download schedule');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'schedule.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.error('Error downloading schedule:', err);
      throw err instanceof Error ? err : new Error('Failed to download schedule');
    }
  }, []);

  const refetch = useCallback((filters?: ScheduleFilters) => {
    return fetchSchedules(filters);
  }, [fetchSchedules]);

  return {
    schedules,
    pagination,
    summary,
    loading,
    error,
    fetchSchedules,
    downloadSchedule,
    refetch
  };
};
