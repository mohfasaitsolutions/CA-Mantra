import apiClient from './client';
import { AuthUser } from './auth';

// Rich profile shape returned by /users/me
export interface UserProfile {
  _id: string;
  email: string;
  fullName?: string;
  mobile?: string;
  mobileVerified?: boolean;
  caLevel?: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL' | string;
  address?: string;
  dob?: string;
  role?: string;
  profileImage?: string;
  meta?: Record<string, unknown>;
}

export interface UpdateProfilePayload {
  fullName?: string;
  profileImage?: string;
  caLevel?: string;
  mobile?: string; // Changed from phone to mobile to match API
  mobileVerified?: boolean; // Added mobileVerified field
  state?: string;
  city?: string;
  address?: string; // Added address field
  street?: string; // Added street field for house number
  pincode?: string; // Added pincode field
  // Backend supports arbitrary metadata via `meta` field. Use this to persist state/city/country/profileImage.
  meta?: Record<string, unknown>;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  caLevel?: string;
  role: 'ADMIN' | 'EVALUATOR' | 'STUDENTS';
}

export interface PaginatedUsers<T = AuthUser> {
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface VerifyOtpPayload {
  otp: string;
}

export interface OtpResponse {
  message: string;
  success?: boolean; // Optional since the API might not always return this
}

export const usersApi = {
  getMe: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get('/users/me');
    return data;
  },
  updateMe: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const { data } = await apiClient.patch('/users/me', payload);
    return data;
  },
  createUser: async (payload: CreateUserPayload): Promise<AuthUser> => {
    const { data } = await apiClient.post('/users', payload);
    return data;
  },
  listUsers: async (): Promise<PaginatedUsers> => {
    const { data } = await apiClient.get('/users');
    return data;
  },
  sendMobileOtp: async (): Promise<OtpResponse> => {
    const { data } = await apiClient.post('/users/send-mobile-otp');
    return data;
  },
  verifyMobileOtp: async (payload: VerifyOtpPayload): Promise<OtpResponse> => {
    const { data } = await apiClient.post('/users/verify-mobile-otp', payload);
    return data;
  },
};
