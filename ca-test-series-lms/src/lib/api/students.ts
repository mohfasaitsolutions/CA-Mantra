import apiClient from './client';

export interface StudentDashboardMetrics {
  profile: {
    name: string;
    email: string;
    phone: string;
    caLevel: 'Foundation' | 'Intermediate' | 'Final';
    city: string;
    state: string;
    country: string;
    isProfileComplete: boolean;
  };
  metrics: {
    purchasedSeries: number;
    completedTests: number;
    averageScore: number;
    totalSubmissions: number;
  };
}

export interface PurchasedSeriesItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: 'Foundation' | 'Intermediate' | 'Final';
  isPurchased: true;
  attemptsUsed: number;
  attemptsTotal: number;
  evaluationStatus?: 'pending' | 'completed';
  validity?: { isUnlimited: boolean; days?: number };
  purchaseDate?: string; // Date when the series was purchased
}

export interface TestHistoryItem {
  id: string;
  testId: string;
  testName: string;
  date: string;
  score?: number;
  maxScore: number;
  status: 'completed' | 'pending' | 'failed';
  type: 'objective' | 'subjective' | 'mixed';
  subject: string;
  evaluatorName?: string;
  hasRated: boolean;
  answerPdfUrl?: string;
  questionPaperUrl?: string;
  evaluatedFileUrl?: string;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  caLevel: string;
  mobile?: string;
  phone?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  dob?: string;
  experience?: string;
  bio?: string;
  profilePictureUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  stats: {
    enrolledSeries: number;
    completedTests: number;
    averageScore: number;
  };
}

export interface SubmissionDetails {
  id: string;
  testId: string;
  testSeriesId: string;
  testName: string;
  subject: string;
  testType: 'OBJECTIVE' | 'SUBJECTIVE' | 'MIXED';
  totalMarks: number;
  timeLimit?: number;
  instructions?: string;
  
  // Submission details
  submittedAt: string;
  status: string;
  score?: number;
  remarks?: string;
  evaluatedAt?: string;
  
  // Files
  submissionFileUrl?: string;
  answerPdfUrl?: string;
  questionPaperUrl?: string;
  evaluatedFileUrl?: string;
  
  // Evaluator info
  evaluatorName?: string;
  evaluatorEmail?: string;
  
  // Meta
  hasRated: boolean;
  isAutoEvaluated: boolean;
  
  // For objective tests
  answers?: Array<{ questionIndex: number; answer: 'A'|'B'|'C'|'D' }>;
  correctAnswers?: Array<{ questionIndex: number; answer: 'A'|'B'|'C'|'D' }>;
  questionAnalysis?: Array<{
    questionIndex: number;
    questionText: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: 'A'|'B'|'C'|'D';
    studentAnswer?: 'A'|'B'|'C'|'D';
    isCorrect: boolean;
    maxMarks: number;
    marksAwarded: number;
  }>;
}

export const studentsApi = {
  dashboard: async (): Promise<StudentDashboardMetrics> => {
    const { data } = await apiClient.get('/students/dashboard');
    return data;
  },
  purchases: async (): Promise<{ data: PurchasedSeriesItem[] }> => {
    const { data } = await apiClient.get('/students/purchases');
    return data;
  },
  history: async (params: { page?: number; pageSize?: number } = {}): Promise<{ data: TestHistoryItem[]; page: number; pageSize: number; total: number }> => {
    const { data } = await apiClient.get('/students/history', { params });
    return data;
  },
  purchaseSeries: async (testSeriesId: string): Promise<{ message: string; id: string }> => {
    const { data } = await apiClient.post(`/students/purchases/${testSeriesId}`);
    return data;
  },
  isProfileComplete: async (): Promise<{ isComplete: boolean }> => {
    const { data } = await apiClient.get('/students/profile-complete');
    return data;
  },
  analytics: async (): Promise<{ 
    performanceData: Array<{ 
      subject: string; 
      averageScore: number; 
      averagePercentage: number;
      totalAttempts: number 
    }>;
    rankings: {
      allIndiaRank: number;
      stateRank: number;
      cityRank: number;
      percentile: number;
      totalStudents: number;
      overallPercentage: number;
    };
  }> => {
    const { data } = await apiClient.get('/students/analytics');
    return data;
  },
  unattempted: async (params: { page?: number; pageSize?: number } = {}) => {
    const { data } = await apiClient.get('/students/unattempted', { params });
    return data as { data: Array<{ seriesId: string; testId: string; title: string; description: string; thumbnail: string; price: number; level: 'Foundation' | 'Intermediate' | 'Final'; subject: string; testType: 'objective' | 'subjective'; purchaseDate: string | null; validity?: { isUnlimited: boolean; days?: number }; attempts?: { isUnlimited: boolean; count?: number } }>; page: number; pageSize: number; total: number };
  },
  statuses: async (testSeriesId: string): Promise<{ 
    statuses: Array<{ 
      testId: string; 
      status: 'not_attempted'|'submitted'|'completed'|'objective_completed'; 
      objectiveCompleted?: boolean;
      subjectiveCompleted?: boolean;
      objectiveScore?: number;
      canRetake?: boolean;
      attemptsUsed?: number;
      maxAttempts?: number | 'Unlimited';
    }> 
  }> => {
    const { data } = await apiClient.get(`/students/tests/${testSeriesId}/statuses`);
    return data;
  },
  /**
   * Get a test detail for a student. For OBJECTIVE tests, the payload includes mcqQuestions without correct answers.
   */
  getTestDetail: async (
    testSeriesId: string,
    testId: string
  ): Promise<
    | {
        test: {
          seriesId: string;
          testId: string;
          title: string;
          testType: 'OBJECTIVE';
          subject: string;
          duration: number | null;
          totalMarks: number;
          instructions: string;
          mcqQuestions: Array<{
            index: number;
            questionText: string;
            options: { A: string; B: string; C: string; D: string };
            marks: number;
          }>;
        };
        series: { title: string; caLevel: string; description: string };
      }
    | {
        test: {
          seriesId: string;
          testId: string;
          title: string;
          testType: 'SUBJECTIVE';
          subject: string;
          duration: number | null;
          totalMarks: number;
          instructions: string;
          questionPaperUrl?: string | null;
        };
        series: { title: string; caLevel: string; description: string };
      }
  > => {
    const { data } = await apiClient.get(`/students/tests/${testSeriesId}/${testId}`);
    return data;
  },
  submitObjective: async (testSeriesId: string, testId: string, answers: Array<{ questionIndex: number; answer: 'A'|'B'|'C'|'D' }>) => {
    const { data } = await apiClient.post(`/students/tests/${testSeriesId}/${testId}/objective-submission`, { answers });
    return data as { message: string; submissionId: string; score: number; totalMarks: number; status: string };
  },
  submitSubjective: async (testSeriesId: string, testId: string, file: File) => {
    const formData = new FormData();
    formData.append('answerSheet', file);
    const { data } = await apiClient.post(`/students/tests/${testSeriesId}/${testId}/subjective-submission`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data as { message: string; submissionId: string; fileUrl: string };
  },
  suggestedAnswer: async (testSeriesId: string, testId: string): Promise<{ url: string }> => {
    const { data } = await apiClient.get(`/students/tests/${testSeriesId}/${testId}/suggested-answer`);
    return data;
  },
  getSubmissionDetails: async (submissionId: string): Promise<SubmissionDetails> => {
    const { data } = await apiClient.get(`/students/submissions/${submissionId}`);
    return data;
  },

  // Student profile endpoints
  getMyProfile: async (): Promise<StudentProfile> => {
    const { data } = await apiClient.get('/students/profile');
    return data;
  },

  updateMyProfile: async (payload: {
    fullName?: string;
    mobile?: string;
    phone?: string;
    address?: string;
    dob?: string;
    experience?: string;
    bio?: string;
  }): Promise<StudentProfile> => {
    const { data } = await apiClient.patch('/students/profile', payload);
    return data;
  },

  uploadProfilePicture: async (file: File): Promise<{ message: string; profilePictureUrl: string }> => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const { data } = await apiClient.post('/students/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  submitFeedback: async (submissionId: string, feedback: { rating: number; comment?: string }): Promise<{ message: string; feedback: { rating: number; comment: string; feedbackAt: string } }> => {
    const { data } = await apiClient.post(`/students/submissions/${submissionId}/feedback`, feedback);
    return data;
  },

  // Course-related endpoints
  getCourses: async (): Promise<{ 
    purchased: PurchasedSeriesItem[]; 
    unattempted: Array<{ 
      seriesId: string; 
      testId: string; 
      title: string; 
      description: string; 
      thumbnail: string; 
      price: number; 
      level: 'Foundation' | 'Intermediate' | 'Final'; 
      subject: string; 
      testType: 'objective' | 'subjective' | 'mixed'; 
      purchaseDate: string | null; 
    }> 
  }> => {
    // Fetch both purchased series and unattempted tests
    const [purchasesResult, unattemptedResult] = await Promise.all([
      studentsApi.purchases(),
      studentsApi.unattempted({ page: 1, pageSize: 100 })
    ]);
    
    return {
      purchased: purchasesResult.data,
      unattempted: unattemptedResult.data
    };
  },
};
