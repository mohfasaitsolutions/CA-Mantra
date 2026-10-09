import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { getApiBaseUrl } from '@/lib/utils';

interface AnalyticsData {
  userGrowth: Array<{
    date: string;
    students: number;
    evaluators: number;
  }>;
  submissionsByStatus: Array<{
    status: string;
    count: number;
    totalMarks: number;
    awardedMarks: number;
  }>;
  subjectPerformance: Array<{
    subject: string;
    totalSubmissions: number;
    averageMarks: number;
    averagePercentage: number;
  }>;
  evaluatorPerformance: Array<{
    evaluator: {
      fullName: string;
      email: string;
    };
    totalEvaluations: number;
    averageRating: number;
    totalRatings: number;
    averageTimeToEvaluate: number;
  }>;
  submissionTrends: Array<{
    date: string;
    totalSubmissions: number;
    completedSubmissions: number;
  }>;
  summary: {
    totalUsers: number;
    totalStudents: number;
    totalEvaluators: number;
    totalSubmissions: number;
    totalRevenue: number;
    completionRate: number;
    averageRating: number;
    averageResponseTime: number;
  };
}

interface UseAnalyticsOptions {
  period?: string;
  startDate?: string;
  endDate?: string;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuthStore();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token || !isAuthenticated) {
        throw new Error('Authentication token not found');
      }

      const queryParams = new URLSearchParams();
      if (options.period) queryParams.append('period', options.period);
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);

      const response = await fetch(
        `${getApiBaseUrl()}/admin/analytics?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized access');
        }
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.period, options.startDate, options.endDate, token, isAuthenticated]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
