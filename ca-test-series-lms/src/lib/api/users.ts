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
  role: 'ADMIN' | 'EVALUATOR' | 'COURSE_UPLOADER' | 'STUDENTS';
}

export interface StaffUser {
  _id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'EVALUATOR' | 'COURSE_UPLOADER' | 'STUDENTS';
  caLevel?: string;
  isActive: boolean;
  emailVerified?: boolean;
  createdAt?: string;
}

export type StaffSortField =
  | 'fullName'
  | 'email'
  | 'role'
  | 'isActive'
  | 'emailVerified'
  | 'createdAt';

export interface ListStaffParams {
  role?: string;
  q?: string;
  active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: StaffSortField;
  sortDir?: 'asc' | 'desc';
}

export interface StaffPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface PaginatedStaff {
  data: StaffUser[];
  pagination: StaffPagination;
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
  // Staff listing. Filtering, sorting and paging all happen server-side; the
  // page only ever renders what this returns.
  listStaff: async (params: ListStaffParams = {}): Promise<PaginatedStaff> => {
    const { data } = await apiClient.get('/users', {
      params: {
        role: params.role,
        q: params.q || undefined,
        active: params.active === undefined ? undefined : String(params.active),
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
      },
    });
    // The endpoint returns a bare array when called without paging params.
    if (Array.isArray(data)) {
      return {
        data,
        pagination: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      };
    }
    return data as PaginatedStaff;
  },
  toggleStaffStatus: async (id: string): Promise<{ id: string; isActive: boolean }> => {
    const { data } = await apiClient.patch(`/users/${id}/toggle`);
    return data;
  },
  resendStaffVerification: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/users/${id}/resend-verification`);
    return data;
  },
  resendStaffInvite: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/users/${id}/resend-invite`);
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
