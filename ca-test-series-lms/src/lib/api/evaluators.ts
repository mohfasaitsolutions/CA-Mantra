import apiClient from './client';

export type CA_LEVEL = 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL';
export type SUBMISSION_STATUS = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';

export interface EvaluatorStats {
  assigned: number;
  pending: number;
  inProgress: number;
  completed: number;
  thisWeek: number;
}

export interface EvaluatorProfile {
  id: string;
  fullName: string;
  email: string;
  caLevel: CA_LEVEL;
  specializations: string[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  phone?: string;
  experience?: string;
  bio?: string;
  profilePictureUrl?: string;
  stats: EvaluatorStats;
}

export interface EvaluatorListItem {
  id: string;
  fullName: string;
  email: string;
  specializations: string[];
  isActive: boolean;
  emailVerified?: boolean;
  stats: EvaluatorStats;
}

export interface EvaluatorDetail extends EvaluatorListItem {
  caLevel: CA_LEVEL;
}

export interface Submission {
  _id: string;
  studentId: string;
  studentIdNumber?: number | null;
  testSeriesId: string;
  testId?: string;
  status: SUBMISSION_STATUS;
  submittedAt?: string; // Backward compatibility
  evaluatorId?: string;
  evaluatedAt?: string;
  awardedMarks?: number;
  totalMarks: number;
  remarks?: string;
  subject: string;
  testType?: 'OBJECTIVE' | 'SUBJECTIVE' | 'MIXED';
  testName?: string;
  studentName?: string;
  answerPdfUrl?: string;
  evaluatedFileUrl?: string;
  answerSheetUrl?: string | null;
  questionPaperUrl?: string;
  suggestedAnswerUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  lockedBy?: string;
  lockedAt?: string;
}

export interface SubmissionUpdatePayload {
  action: 'start' | 'complete' | 'reassign' | 'claim' | 'lock' | 'unlock';
  awardedMarks?: number;
  remarks?: string;
}

export const evaluatorsApi = {
  // Evaluator Authentication
  login: async (payload: { email: string; password: string }): Promise<{
    token: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      role: string;
      caLevel: CA_LEVEL;
      specializations: string[];
      isActive: boolean;
    }
  }> => {
    const { data } = await apiClient.post('/auth/evaluator/signin', payload);
    return data;
  },

  // Public endpoints
  getEnums: async (): Promise<{ subjects: string[]; caLevels: CA_LEVEL[] }> => {
    const { data } = await apiClient.get('/evaluators/subjects');
    return data;
  },

  // Admin endpoints
  list: async (params?: { q?: string; subject?: string; status?: string; active?: boolean }): Promise<EvaluatorListItem[]> => {
    const { data } = await apiClient.get('/evaluators', {
      params: {
        q: params?.q,
        subject: params?.subject,
        status: params?.status,
        active: params?.active === undefined ? undefined : String(params.active),
      },
    });
    return data;
  },

  getById: async (id: string): Promise<EvaluatorDetail> => {
    const { data } = await apiClient.get(`/evaluators/${id}`);
    return data;
  },

  create: async (payload: { 
    fullName: string; 
    email: string; 
    password: string; 
    caLevel: CA_LEVEL; 
    specializations: string[]; 
    convertIfStudent?: boolean 
  }): Promise<{ id: string; invited?: boolean; converted?: boolean }> => {
    const { data } = await apiClient.post('/evaluators', payload);
    return data;
  },

  update: async (id: string, payload: Partial<{ 
    fullName: string; 
    specializations: string[]; 
    caLevel: CA_LEVEL; 
    isActive: boolean 
  }>): Promise<EvaluatorDetail> => {
    const { data } = await apiClient.patch(`/evaluators/${id}`, payload);
    return data;
  },

  toggle: async (id: string): Promise<{ id: string; isActive: boolean }> => {
    const { data } = await apiClient.patch(`/evaluators/${id}/toggle`);
    return data;
  },

  resendVerification: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/evaluators/${id}/resend-verification`);
    return data;
  },

  resendInvite: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/evaluators/${id}/resend-invite`);
    return data;
  },

  assignSubmissions: async (payload: {
    evaluatorId: string;
    submissionIds: string[];
  }): Promise<{ assigned: number }> => {
    const { data } = await apiClient.post('/evaluators/assign', payload);
    return data;
  },

  // Evaluator personal endpoints
  getMyProfile: async (): Promise<EvaluatorProfile> => {
    const { data } = await apiClient.get('/evaluators/me/profile');
    return data;
  },

  updateMyProfile: async (payload: {
    fullName?: string;
    phone?: string;
    experience?: string;
    bio?: string;
  }): Promise<EvaluatorProfile> => {
    const { data } = await apiClient.patch('/evaluators/me/profile', payload);
    return data;
  },

  uploadProfilePicture: async (file: File): Promise<{ message: string; profilePictureUrl: string }> => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const { data } = await apiClient.post('/evaluators/me/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getMyQueue: async (status?: SUBMISSION_STATUS): Promise<Submission[]> => {
    const { data } = await apiClient.get('/evaluators/me/queue', {
      params: { status }
    });
    return data;
  },

  getSubmissionDetails: async (submissionId: string): Promise<Submission> => {
    const { data } = await apiClient.get(`/evaluators/me/submissions/${submissionId}`);
    return data;
  },

  updateSubmissionStatus: async (
    submissionId: string, 
    payload: SubmissionUpdatePayload
  ): Promise<Submission> => {
    const { data } = await apiClient.post(`/evaluators/submissions/${submissionId}/status`, payload);
    return data;
  },

  uploadEvaluatedFile: async (
    submissionId: string,
    formData: FormData
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/evaluators/submissions/${submissionId}/upload-evaluated`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
