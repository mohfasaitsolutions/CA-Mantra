import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Define types for admin data
interface Student {
  id: string;
  name: string;
  email: string;
  caLevel: 'Foundation' | 'Intermediate' | 'Final';
  registrationDate: string;
  testsCompleted: number;
  averageScore: number;
  status: 'active' | 'inactive';
  phone: string;
  location: string;
  testsPurchased: number;
}

interface Evaluator {
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
  status: 'active' | 'inactive';
}

interface TestSeries {
  id: string;
  title: string;
  price: number;
  sales: number;
  evaluationsPending: number;
  evaluationsComplete: number;
  level: string;
  subjects: string[];
  tests: {
    id: string;
    title: string;
    type: 'objective' | 'subjective' | 'mixed';
  }[];
}

interface SupportTicket {
  id: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  message: string;
  category: 'technical' | 'billing' | 'account' | 'content' | 'other';
  status: 'open' | 'in-progress' | 'closed';
  submissionDate: string;
  screenshot?: string | null;
}

interface AdminState {
  // Dashboard data
  dashboardStats: {
    totalStudents: number;
    activeStudents: number;
    totalEvaluators: number;
    activeEvaluators: number;
    totalTestSeries: number;
    totalSales: number;
    pendingEvaluations: number;
    openSupportTickets: number;
  } | null;
  
  // Students management
  students: Student[];
  
  // Evaluators management
  evaluators: Evaluator[];
  
  // Test series management
  testSeries: TestSeries[];
  
  // Support tickets
  supportTickets: SupportTicket[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardStats: () => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchEvaluators: () => Promise<void>;
  fetchTestSeries: () => Promise<void>;
  fetchSupportTickets: () => Promise<void>;
  updateStudentStatus: (studentId: string, status: 'active' | 'inactive') => Promise<void>;
  updateEvaluatorStatus: (evaluatorId: string, status: 'active' | 'inactive') => Promise<void>;
  updateTicketStatus: (ticketId: string, status: 'open' | 'in-progress' | 'closed') => Promise<void>;
  clearError: () => void;
}

// Create the admin store
export const useAdminStore = create<AdminState>()(devtools(persist((set) => ({
  // Dashboard data
  dashboardStats: null,
  
  // Students management
  students: [],
  
  // Evaluators management
  evaluators: [],
  
  // Test series management
  testSeries: [],
  
  // Support tickets
  supportTickets: [],
  
  // Loading and error states
  isLoading: false,
  error: null,
  
  // Actions
  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock dashboard stats
      set({
        dashboardStats: {
          totalStudents: 1250,
          activeStudents: 980,
          totalEvaluators: 45,
          activeEvaluators: 38,
          totalTestSeries: 28,
          totalSales: 450000,
          pendingEvaluations: 120,
          openSupportTickets: 15,
        },
        isLoading: false,
      });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch dashboard stats');
      set({
        error: errMsg,
        isLoading: false
      });
    }
  },
  
  fetchStudents: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock students data
      set({
        students: [
          // Mock data would go here
        ],
        isLoading: false,
      });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch students');
      set({
        error: errMsg,
        isLoading: false
      });
    }
  },
  
  fetchEvaluators: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock evaluators data
      set({
        evaluators: [
          // Mock data would go here
        ],
        isLoading: false,
      });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch evaluators');
      set({
        error: errMsg,
        isLoading: false
      });
    }
  },
  
  fetchTestSeries: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock test series data
      set({
        testSeries: [
          // Mock data would go here
        ],
        isLoading: false,
      });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch test series');
      set({
        error: errMsg,
        isLoading: false
      });
    }
  },
  
  fetchSupportTickets: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock support tickets data
      set({
        supportTickets: [
          // Mock data would go here
        ],
        isLoading: false,
      });
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to fetch support tickets');
      set({
        error: errMsg,
        isLoading: false
      });
    }
  },
  
  updateStudentStatus: async (studentId, status) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update student status
      set((state) => ({
        students: state.students.map(student => 
          student.id === studentId ? { ...student, status } : student
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to update student status');
      set({
        error: errMsg,
        isLoading: false
      });
    }
  },
  
  updateEvaluatorStatus: async (evaluatorId, status) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update evaluator status
      set((state) => ({
        evaluators: state.evaluators.map(evaluator => 
          evaluator.id === evaluatorId ? { ...evaluator, status } : evaluator
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to update evaluator status');
      set({
        error: errMsg,
        isLoading: false
      });
    }
  },
  
  updateTicketStatus: async (ticketId, status) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update ticket status
      set((state) => ({
        supportTickets: state.supportTickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status } : ticket
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      const errMsg = error?.response?.data?.error || error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to update ticket status');
      set({
        error: errMsg,
        isLoading: false
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
}), {
  name: 'ca-prep-admin-storage',
})));