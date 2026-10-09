import apiClient from './client';
import { Student } from '@/types/student';

export interface ListStudentsQuery {
  q?: string;
  purchased?: 'all' | 'yes' | 'no';
  status?: 'all' | 'active' | 'inactive';
  caLevel?: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL';
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'fullName' | 'testsPurchased' | 'testsCompleted' | 'averageScore';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedStudents {
  data: Student[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminStudentsApi = {
  list: async (params: ListStudentsQuery = {}): Promise<PaginatedStudents> => {
    const { data } = await apiClient.get('/admin/students', { params });
    return data;
  },
  getById: async (id: string): Promise<Student> => {
    const { data } = await apiClient.get(`/admin/students/${id}`);
    return data;
  },
  listSubmissions: async (
    id: string,
    params: { status?: 'all' | 'completed' | 'pending' | 'assigned' | 'in_progress'; page?: number; pageSize?: number } = {}
  ): Promise<{ data: Array<{ id: string; submissionId?: string; testName: string; date: string; evaluatorName: string | null; status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'ASSIGNED'; score: { awarded: number; total: number } | null }>; total: number; page: number; pageSize: number }> => {
    const { data } = await apiClient.get(`/admin/students/${id}/submissions`, { params });
    return data;
  },
  updateStatus: async (id: string, status: 'active' | 'inactive') => {
    const { data } = await apiClient.patch(`/admin/students/${id}/status`, { status });
    return data as { id: string; status: 'active' | 'inactive' };
  },
  listNotes: async (id: string): Promise<{ data: Array<{ id: string; note: string; authorId: string | null; createdAt: string }> }> => {
    const { data } = await apiClient.get(`/admin/students/${id}/notes`);
    return data;
  },
  addNote: async (id: string, note: string): Promise<{ id: string; note: string; authorId: string | null; createdAt: string }> => {
    const { data } = await apiClient.post(`/admin/students/${id}/notes`, { note });
    return data;
  },
  emailStudent: (id: string, payload: { subject: string; message: string }) =>
    apiClient.post(`/admin/students/${id}/email`, payload).then((res) => res.data),

  listPurchases: (id: string) =>
    apiClient.get(`/admin/students/${id}/purchases`).then((res) => res.data),

  grantRetake: (studentId: string, payload: { testId?: string; submissionId?: string }) =>
    apiClient.post(`/admin/students/${studentId}/grant-retake`, payload).then((res) => res.data),
};
