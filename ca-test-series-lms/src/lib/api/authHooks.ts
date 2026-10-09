import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { evaluatorsApi } from './evaluators';

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useEvaluatorLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: evaluatorsApi.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluator'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const response = await apiClient.post('/auth/register', { name, email, password });
      return response.data;
    },
  });
};
