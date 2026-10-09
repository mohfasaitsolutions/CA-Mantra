import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { evaluatorsApi } from './evaluators';

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboardStats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/dashboard-stats');
      return response.data;
    },
  });
};

export const useAdminStudents = () => {
  return useQuery({
    queryKey: ['admin', 'students'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/students');
      return response.data;
    },
  });
};

export const useAdminEvaluators = () => {
  return useQuery({
    queryKey: ['admin', 'evaluators'],
    queryFn: () => evaluatorsApi.list(),
  });
};

export const useAdminSupportTickets = () => {
  return useQuery({
    queryKey: ['admin', 'supportTickets'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/support-tickets');
      return response.data;
    },
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const response = await apiClient.put(`/admin/support-tickets/${ticketId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'supportTickets'] });
    },
  });
};
