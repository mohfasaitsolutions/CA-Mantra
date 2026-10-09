import apiClient from './client';

export interface EvaluatorFeedback {
  _id: string;
  subject: string;
  totalMarks: number;
  awardedMarks: number;
  evaluatedAt: string;
  feedback: {
    rating: number;
    comment: string;
    feedbackAt: string;
  };
  evaluator: {
    _id: string;
    fullName: string;
    email: string;
    specializations: string[];
  };
  student: {
    _id: string;
    fullName: string;
    email: string;
    caLevel: string;
  };
  testInfo: {
    title: string;
    testTitle: string;
  };
}

export interface EvaluatorFeedbacksResponse {
  data: EvaluatorFeedback[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalFeedbacks: number;
    averageRating: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
}

export interface Evaluation {
  _id: string;
  submissionId?: string;
  studentId?: number | string | null;
  subject: string;
  totalMarks: number;
  awardedMarks: number | null;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  testId: string;
  testSeriesId: string;
  submittedAt: string;
  assignedAt?: string;
  evaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
  feedback?: {
    rating: number;
    comment: string;
    feedbackAt: string;
  };
  answerPdfUrl?: string;
  evaluatedFileUrl?: string;
  evaluator?: {
    _id: string;
    fullName: string;
    email: string;
    specializations: string[];
    profilePictureUrl?: string;
  };
  student: {
    _id: string;
    fullName: string;
    email: string;
    caLevel: string;
    phone?: string;
    mobile?: string;
    studentNumericId?: number;
    profilePictureUrl?: string;
  };
  testInfo: {
    title: string;
    testTitle: string;
    category: string;
  };
}

export interface EvaluationsResponse {
  data: Evaluation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalSubmissions: number;
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    averageMarks: number;
    averagePercentage: number;
  };
}

export const adminApi = {
  getEvaluations: async (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    evaluatorId?: string;
    studentId?: string;
    subject?: string;
    sortBy?: 'submittedAt' | 'evaluatedAt' | 'createdAt' | 'updatedAt' | 'awardedMarks' | 'status';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<EvaluationsResponse> => {
    const { data } = await apiClient.get('/admin/evaluations', { params });
    return data;
  },

  getEvaluatorFeedbacks: async (params: {
    page?: number;
    pageSize?: number;
    evaluatorId?: string;
    rating?: number;
    sortBy?: 'feedbackAt' | 'rating' | 'evaluatedAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<EvaluatorFeedbacksResponse> => {
    const { data } = await apiClient.get('/admin/evaluator-feedbacks', { params });
    return data;
  },

  getOrders: async (params: { page?: number; pageSize?: number; status?: string; search?: string; testSeriesId?: string }) => {
    const { data } = await apiClient.get('/admin/orders', { params });
    return data;
  },
};
