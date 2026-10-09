import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await apiClient.get('/user/profile');
      return response.data;
    },
    retry: false,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: Record<string, unknown>) => {
      const response = await apiClient.put('/user/profile', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
