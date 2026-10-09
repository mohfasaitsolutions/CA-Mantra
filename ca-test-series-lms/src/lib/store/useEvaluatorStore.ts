import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

// Define types for evaluations
interface Evaluation {
  id: number;
  studentName: string;
  testName: string;
  testSeries: string;
  subject: string;
  submissionDate: string;
  isLocked: boolean;
  lockedBy: string | null;
  maxMarks: number;
  answerPdfUrl?: string;
  questionPaperUrl?: string;
  expectedAnswersheetUrl?: string;
  score?: number;
  feedback?: string;
  status: 'pending' | 'completed';
}

interface EvaluatorState {
  // Evaluator data
  profile: {
    id: string;
    name: string;
    email: string;
    specialization: string[];
    assignedTests: number;
    completedTests: number;
    pendingTests: number;
    avgCompletionTime?: number;
    profileImage?: string | null;
    joinDate: string;
    status: string;
  } | null;
  
  // Evaluations
  pendingEvaluations: Evaluation[];
  completedEvaluations: Evaluation[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<EvaluatorState['profile']>) => Promise<void>;
  fetchPendingEvaluations: () => Promise<void>;
  fetchCompletedEvaluations: () => Promise<void>;
  lockEvaluation: (evaluationId: number) => Promise<void>;
  unlockEvaluation: (evaluationId: number) => Promise<void>;
  submitEvaluation: (evaluationId: number, score: number, feedback: string) => Promise<void>;
  clearError: () => void;
}

// Create the evaluator store with persistence
export const useEvaluatorStore = create<EvaluatorState>()(
  devtools(
    persist(
      (set, get) => ({
      // Evaluator data
      profile: null,
      
      // Evaluations
      pendingEvaluations: [],
      completedEvaluations: [],
      isLoading: false,
      error: null,
      
      // Actions
      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock profile data
          set({
            profile: {
              id: '1',
              name: 'Rajesh Kumar',
              email: 'rajesh@example.com',
              specialization: ['Accounting', 'Taxation', 'Financial Reporting'],
              assignedTests: 78,
              completedTests: 65,
              pendingTests: 13,
              joinDate: '2023-01-15',
              status: 'active',
              profileImage: null,
            },
            isLoading: false,
          });
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch profile');
          set({
            error: errMsg,
            isLoading: false
          });
        }
      },
      
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update profile
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...profileData } : null,
            isLoading: false,
          }));
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to update profile');
          set({
            error: errMsg,
            isLoading: false
          });
        }
      },
      
      fetchPendingEvaluations: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock pending evaluations data
          set({
            pendingEvaluations: [
              // Mock data would go here
            ],
            isLoading: false,
          });
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch pending evaluations');
          set({
            error: errMsg,
            isLoading: false
          });
        }
      },
      
      fetchCompletedEvaluations: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock completed evaluations data
          set({
            completedEvaluations: [
              // Mock data would go here
            ],
            isLoading: false,
          });
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch completed evaluations');
          set({
            error: errMsg,
            isLoading: false
          });
        }
      },
      
      lockEvaluation: async (evaluationId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update the evaluation to be locked
          set((state) => ({
            pendingEvaluations: state.pendingEvaluations.map(evaluation => 
              evaluation.id === evaluationId ? { ...evaluation, isLocked: true, lockedBy: 'current-user' } : evaluation
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to lock evaluation');
          set({
            error: errMsg,
            isLoading: false
          });
        }
      },
      
      unlockEvaluation: async (evaluationId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update the evaluation to be unlocked
          set((state) => ({
            pendingEvaluations: state.pendingEvaluations.map(evaluation => 
              evaluation.id === evaluationId ? { ...evaluation, isLocked: false, lockedBy: null } : evaluation
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to unlock evaluation');
          set({
            error: errMsg,
            isLoading: false
          });
        }
      },
      
      submitEvaluation: async (evaluationId, score, feedback) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Move the evaluation from pending to completed
          const evaluation = get().pendingEvaluations.find(evaluation => evaluation.id === evaluationId);
          
          if (!evaluation) {
            throw new Error('Evaluation not found');
          }
          
          const completedEvaluation = {
            ...evaluation,
            score,
            feedback,
            status: 'completed' as const,
          };
          
          set((state) => ({
            pendingEvaluations: state.pendingEvaluations.filter(evaluation => evaluation.id !== evaluationId),
            completedEvaluations: [...state.completedEvaluations, completedEvaluation],
            isLoading: false,
          }));
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to submit evaluation');
          set({
            error: errMsg,
            isLoading: false
          });
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
      {
        name: 'ca-prep-evaluator-storage',
      }
    )
  )
);