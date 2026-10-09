import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import { evaluatorsApi, type SUBMISSION_STATUS, type SubmissionUpdatePayload } from './evaluators';

export const useEvaluatorProfile = () => {
  return useQuery({
    queryKey: ['evaluator', 'profile'],
    queryFn: evaluatorsApi.getMyProfile,
    retry: false,
  });
};

export const useUpdateEvaluatorProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: {
      fullName?: string;
      phone?: string;
      experience?: string;
      bio?: string;
    }) => evaluatorsApi.updateMyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluator', 'profile'] });
    },
  });
};

export const useUploadEvaluatorProfilePicture = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => evaluatorsApi.uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluator', 'profile'] });
    },
  });
};

export const useEvaluatorQueue = (status?: SUBMISSION_STATUS) => {
  return useQuery({
    queryKey: ['evaluator', 'queue', status],
    queryFn: () => evaluatorsApi.getMyQueue(status),
    retry: false,
  });
};

export const useSubmissionDetails = (submissionId: string) => {
  return useQuery({
    queryKey: ['evaluator', 'submission', submissionId],
    queryFn: () => evaluatorsApi.getSubmissionDetails(submissionId),
    enabled: !!submissionId,
  });
};

export const useUpdateSubmissionStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ submissionId, payload }: { submissionId: string; payload: SubmissionUpdatePayload }) =>
      evaluatorsApi.updateSubmissionStatus(submissionId, payload),
    onSuccess: (_, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['evaluator', 'queue'] });
      queryClient.invalidateQueries({ queryKey: ['evaluator', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['evaluator', 'submission', variables.submissionId] });
    },
  });
};

export const useEvaluatorPendingEvaluations = () => {
  return useQuery({
    queryKey: ['evaluator', 'pendingEvaluations'],
    queryFn: () => evaluatorsApi.getMyQueue('ASSIGNED'),
  });
};

export const useEvaluatorCompletedEvaluations = () => {
  return useQuery({
    queryKey: ['evaluator', 'completedEvaluations'],
    queryFn: () => evaluatorsApi.getMyQueue('COMPLETED'),
  });
};

export const useEvaluatorInProgressEvaluations = () => {
  return useQuery({
    queryKey: ['evaluator', 'inProgressEvaluations'],
    queryFn: () => evaluatorsApi.getMyQueue('IN_PROGRESS'),
  });
};

export const useSubmitEvaluation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ evaluationId, score, feedback }: { evaluationId: number; score: number; feedback: string }) => {
      const response = await apiClient.post(`/evaluator/evaluations/${evaluationId}/submit`, { score, feedback });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluator', 'pendingEvaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluator', 'completedEvaluations'] });
    },
  });
};
