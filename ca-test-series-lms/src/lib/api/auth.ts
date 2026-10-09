import apiClient from './client';

// Types for API payloads/responses
export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  mobile: string;
  caLevel: string; // FOUNDATION / INTERMEDIATE etc.
}

export interface SigninPayload {
  email: string;
  password: string;
}

// Backend returns uppercase roles (ADMIN, EVALUATOR, STUDENTS). We map them internally.
export type BackendRole = 'ADMIN' | 'EVALUATOR' | 'STUDENTS';
export interface AuthUser {
  id: string;
  studentId?: number;
  fullName: string;
  email: string;
  role: BackendRole; // raw backend role
  caLevel?: string;
  mobile?: string;
  profileImage?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string; // JWT
}

// Backend signup currently returns only { message } (201) unless changed to auto-login in future.
export type SignupResponse = { message: string } | AuthResponse;

export const authApi = {
  signup: async (payload: SignupPayload): Promise<SignupResponse> => {
    const { data } = await apiClient.post('/auth/signup', payload);
    return data;
  },
  signin: async (payload: SigninPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/signin', payload);
    return data;
  },
  evaluatorSignin: async (payload: SigninPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/evaluator/signin', payload);
    return data;
  },
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/resend-verification', { email });
    return data;
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data;
  },
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/reset-password', { token, password });
    return data;
  },
};

export function getPostLoginRedirect(role: AuthUser['role'] | string): string {
  const r = role?.toLowerCase();
  switch (r) {
    case 'admin':
      return '/admin/dashboard';
    case 'evaluator':
      return '/evaluator/dashboard';
    case 'students': // backend plural form
    case 'student':
    default:
      return '/student/dashboard';
  }
}

export function mapBackendRoleToInternal(role: BackendRole | string | undefined): 'student' | 'admin' | 'evaluator' {
  const r = (role || '').toUpperCase();
  if (r === 'ADMIN') return 'admin';
  if (r === 'EVALUATOR') return 'evaluator';
  return 'student'; // covers STUDENTS or anything else
}
