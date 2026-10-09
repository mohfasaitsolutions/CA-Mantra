import { useQuery } from '@tanstack/react-query';
import apiClient from './client';

export const useTestSeries = () => {
  return useQuery({
    queryKey: ['testSeries'],
    queryFn: async () => {
      const response = await apiClient.get('/test-series');
      return response.data;
    },
  });
};

export const useTestSeriesById = (id: string) => {
  return useQuery({
    queryKey: ['testSeries', id],
    queryFn: async () => {
      const response = await apiClient.get(`/test-series/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};
