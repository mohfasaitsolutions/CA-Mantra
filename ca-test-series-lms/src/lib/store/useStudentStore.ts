import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { studentsApi } from '@/lib/api';

// Define types for test series and tests
interface TestSection {
  name: string;
  questions: number;
  marks: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: string;
  isPurchased: boolean;
  attemptsUsed: number;
  attemptsTotal: number;
  evaluationStatus: 'evaluated' | 'pending' | 'not-attempted';
  sections: TestSection[];
  duration: string;
  totalMarks: number;
  type: 'objective' | 'subjective' | 'mixed';
  subject: string;
}

interface TestSeries {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: string;
  isPurchased: boolean;
  tests: Test[];
}

interface TestHistory {
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
}

interface StudentState {
  // Student data
  profile: {
    name: string;
    email: string;
    phone: string;
    caLevel: 'Foundation' | 'Intermediate' | 'Final';
    city: string;
    state: string;
    country: string;
    isProfileComplete: boolean;
  } | null;
  
  // Dashboard metrics
  metrics: {
    purchasedSeries: number;
    completedTests: number;
    averageScore: number;
    totalSubmissions: number;
  } | null;
  
  // Test series and tests
  purchasedTestSeries: TestSeries[];
  testHistory: TestHistory[];
  isLoading: boolean;
  error: string | null;
  _lastDashboardFetch?: number;
  _lastPurchasesFetch?: number;
  
  // Actions
  fetchProfile: (force?: boolean) => Promise<void>;
  updateProfile: (profileData: Partial<StudentState['profile']>) => Promise<void>;
  fetchPurchasedTestSeries: (force?: boolean) => Promise<void>;
  fetchTestHistory: () => Promise<void>;
  purchaseTestSeries: (testSeriesId: string) => Promise<void>;
  clearError: () => void;
  clearAllData: () => void;
}

// Create the student store with persistence
export const useStudentStore = create<StudentState>()(
  devtools(
    persist(
      (set, get) => ({
      // Student data
      profile: null,
      
      // Dashboard metrics
      metrics: null,
      
      // Test series and tests
      purchasedTestSeries: [],
      testHistory: [],
      isLoading: false,
      error: null,
      
      // Actions
      fetchProfile: async (force=false) => {
        const now = Date.now();
        const { _lastDashboardFetch, isLoading } = get();
        if (!force && _lastDashboardFetch && (now - _lastDashboardFetch) < 30_000) {
          return; // cached within 30s
        }
        if (isLoading) return; // avoid overlapping spinners
        set({ isLoading: true, error: null });
        try {
          const data = await studentsApi.dashboard();
          set({ 
            profile: data.profile, 
            metrics: data.metrics,
            isLoading: false,
            _lastDashboardFetch: now
          });
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch profile');
          set({ error: errMsg, isLoading: false, _lastDashboardFetch: now });
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
            isLoading: false,
          });
        }
      },
      
      fetchPurchasedTestSeries: async (force=false) => {
        const now = Date.now();
        const { _lastPurchasesFetch, isLoading } = get();
        if (!force && _lastPurchasesFetch && (now - _lastPurchasesFetch) < 30_000) {
          return; // cached
        }
        if (isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const res = await studentsApi.purchases();
          const series = res.data.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            thumbnail: s.thumbnail,
            price: s.price,
            level: s.level,
            isPurchased: true,
            tests: [],
          }));
          set({ purchasedTestSeries: series, isLoading: false, _lastPurchasesFetch: now });
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch test series');
          set({ error: errMsg, isLoading: false, _lastPurchasesFetch: now, purchasedTestSeries: [] });
        }
      },
      
      fetchTestHistory: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await studentsApi.history({ page: 1, pageSize: 50 });
          set({ testHistory: res.data, isLoading: false });
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch test history');
          set({ error: errMsg, isLoading: false });
        }
      },
      
      purchaseTestSeries: async (testSeriesId) => {
        set({ isLoading: true, error: null });
        try {
          await studentsApi.purchaseSeries(testSeriesId);
          // Refresh purchases
          await get().fetchPurchasedTestSeries();
          set({ isLoading: false });
        } catch (error: any) {
          const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to purchase test series');
          set({ error: errMsg, isLoading: false });
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      clearAllData: () => {
        set({ 
          profile: null,
          metrics: null,
          purchasedTestSeries: [],
          testHistory: [],
          error: null,
          _lastDashboardFetch: undefined,
          _lastPurchasesFetch: undefined
        });
      },
    }),
      {
        name: 'ca-prep-student-storage',
      }
    )
  )
);