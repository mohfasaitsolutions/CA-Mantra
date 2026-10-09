import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { studentsApi } from './students';

export const useStudentTestHistory = () => {
  return useQuery({
    queryKey: ['student', 'testHistory'],
    queryFn: async () => {
      const response = await apiClient.get('/student/test-history');
      return response.data;
    },
  });
};

export const useStudentPurchasedTestSeries = () => {
  return useQuery({
    queryKey: ['student', 'purchasedTestSeries'],
    queryFn: async () => {
      const response = await apiClient.get('/student/purchased-test-series');
      return response.data;
    },
  });
};

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ['student', 'profile'],
    queryFn: studentsApi.getMyProfile,
    retry: false,
  });
};

export const useUpdateStudentProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: {
      fullName?: string;
      mobile?: string;
      phone?: string;
      address?: string;
      dob?: string;
      experience?: string;
      bio?: string;
    }) => studentsApi.updateMyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
    },
  });
};

export const useUploadStudentProfilePicture = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => studentsApi.uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
    },
  });
};
