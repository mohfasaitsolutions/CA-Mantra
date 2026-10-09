import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { usersApi, UserProfile, UpdateProfilePayload } from '../api/users'
import { authApi, AuthUser } from '../api/auth'

// Backend user shape (as returned by /users/me)
type BackendUser = {
  _id: string
  email: string
  fullName?: string
  mobile?: string
  studentId?: number
  caLevel?: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL'
  address?: string
  dob?: string
  role?: string
  meta?: Record<string, unknown>
}

export type UserMeta = {
  profileImage?: string
  state?: string
  city?: string
  country?: string
  street?: string
  pincode?: string
  [k: string]: unknown
}

export type AppUser = {
  id: string
  email: string
  name?: string
  fullName?: string
  mobile?: string
  studentId?: number
  caLevel?: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL'
  address?: string
  dob?: string
  role?: string
  profileImage?: string
  state?: string
  city?: string
  street?: string
  pincode?: string
  createdAt?: string
  updatedAt?: string
  meta?: UserMeta
}

export type UpdateProfileInput = UpdateProfilePayload

function parseAddressToMeta(address?: string): Partial<UserMeta> {
  if (!address) return {}

  // Pattern: City, State - 6digit
  const parts = address.split(',').map(p => p.trim()).filter(Boolean)
  let city: string | undefined
  let state: string | undefined
  let pincode: string | undefined

  const last = parts[parts.length - 1]
  if (last) {
    const m = last.match(/([^-]+)-\s*(\d{6})$/)
    if (m) {
      state = m[1].trim()
      pincode = m[2]
    }
  }
  if (parts.length >= 2) city = parts[parts.length - 2]

  const result: Partial<UserMeta> = {}
  if (city) result.city = city
  if (state) result.state = state
  if (pincode) result.pincode = pincode
  return result
}

function mapBackendUser(me: BackendUser | UserProfile): AppUser {
  const meta: UserMeta = { ...(me.meta || {}) }
  const derived = parseAddressToMeta(me.address)
  meta.city = meta.city ?? derived.city
  meta.state = meta.state ?? derived.state
  meta.pincode = meta.pincode ?? derived.pincode
  meta.country = meta.country ?? 'India'

  return {
    id: me._id,
    email: me.email,
  name: me.fullName || (me.email ? me.email.split('@')[0] : undefined),
  fullName: me.fullName,
    mobile: me.mobile,
    studentId: (me as BackendUser & { studentId?: number }).studentId,
  caLevel: me.caLevel as AppUser['caLevel'],
    address: me.address,
    dob: me.dob,
    role: me.role,
  profileImage: meta.profileImage,
  state: meta.state,
  city: meta.city,
  street: meta.street,
  pincode: meta.pincode,
    meta,
  }
}

// Global flag to prevent multiple simultaneous fetches across all instances
let globalFetchInProgress = false;

interface AuthState {
  user: AppUser | null
  token?: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error?: string | null
  info?: string | null
  _lastProfileFetch?: number
  login: (email: string, password: string, redirectTarget?: string | null) => Promise<boolean>
  register: (fullName: string, email: string, password: string, mobile: string, caLevel: string) => Promise<boolean>
  resendVerification: (email: string) => Promise<boolean>
  fetchProfile: (force?: boolean) => Promise<void>
  updateProfile: (data: UpdateProfileInput) => Promise<void>
  logout: () => void
  isProfileComplete: () => boolean
  clearError: () => void
  clearInfo: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
  (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
  error: null,
  info: null,
        _lastProfileFetch: undefined,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          try {
            const res = await authApi.signin({ email, password })
            const token = res.token
            let user: AppUser | null = null
            if (res.user) {
              // map inline if backend returns user
              user = mapBackendUser({
                _id: res.user.id,
                email: res.user.email,
                fullName: res.user.fullName,
                role: res.user.role,
                caLevel: res.user.caLevel as AppUser['caLevel'],
                address: undefined,
                mobile: undefined,
                meta: { profileImage: res.user.profileImage },
              } as unknown as BackendUser)
            } else {
              // fallback: fetch profile
              const me = await usersApi.getMe()
              user = mapBackendUser(me)
            }
            set({ token, user, isAuthenticated: true, isLoading: false, error: null })
            return true
          } catch (e: unknown) {
            const err = e as unknown as { response?: { data?: { message?: string } } } | Error
            const respMsg =
              typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined
            const message = respMsg || (err instanceof Error ? err.message : 'Login failed')
            set({ error: message, isLoading: false, isAuthenticated: false, token: null, user: null })
            return false
          }
        },

        register: async (fullName: string, email: string, password: string, mobile: string, caLevel: string) => {
          set({ isLoading: true, error: null, info: null })
          try {
            const res = await authApi.signup({ fullName, email, password, mobile, caLevel })
            // If backend returns AuthResponse (auto-login) it will have user & token; otherwise just message.
            if (res && typeof res === 'object' && 'user' in res && 'token' in res) {
              const authRes = res as { user: AuthUser; token: string }
              const user = mapBackendUser({
                _id: authRes.user.id,
                email: authRes.user.email,
                fullName: authRes.user.fullName,
                role: authRes.user.role,
                caLevel: authRes.user.caLevel as AppUser['caLevel'],
                address: undefined,
                mobile: authRes.user.mobile,
                studentId: authRes.user.studentId,
                meta: { profileImage: authRes.user.profileImage },
              } as unknown as BackendUser)
              set({ user, token: authRes.token, isAuthenticated: true, isLoading: false, info: 'Account created successfully.' })
            } else {
              const message = (res as { message?: string })?.message || 'Registration successful. Please verify your email.'
              set({ isLoading: false, info: message })
            }
            return true
          } catch (e: unknown) {
            const err = e as unknown as { response?: { data?: { message?: string } } } | Error
            const respMsg =
              typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined
            const message = respMsg || (err instanceof Error ? err.message : 'Registration failed')
            set({ error: message, isLoading: false })
            return false
          }
        },

        resendVerification: async (email: string) => {
          set({ isLoading: true, error: null, info: null })
          try {
            const res = await authApi.resendVerification(email)
            const msg = res?.message || 'Verification email sent.'
            set({ isLoading: false, info: msg })
            return true
          } catch (e: unknown) {
            const err = e as unknown as { response?: { data?: { message?: string } } } | Error
            const respMsg =
              typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined
            const message = respMsg || (err instanceof Error ? err.message : 'Failed to resend verification')
            set({ error: message, isLoading: false })
            return false
          }
        },

        fetchProfile: async (force = false) => {
          console.log('🔍 fetchProfile called, force:', force, 'caller:', new Error().stack?.split('\n')[2]);
          const now = Date.now()
          const { _lastProfileFetch, isLoading } = get()
          
          // Global protection against multiple simultaneous fetches
          if (globalFetchInProgress && !force) {
            console.log('⏭️ Skipping fetchProfile - global fetch in progress');
            return;
          }
          
          // Stronger rate limiting - prevent calls within 5 seconds unless forced
          if (!force && _lastProfileFetch && (now - _lastProfileFetch) < 5_000) {
            console.log('⏭️ Skipping fetchProfile - recent fetch (5s cooldown)');
            return
          }
          
          // Don't fetch if already loading to prevent race conditions
          if (isLoading) {
            console.log('⏭️ Skipping fetchProfile - already loading');
            return;
          }
          
          globalFetchInProgress = true;
          console.log('📡 Making fetchProfile API call');
          set({ isLoading: true, error: null })
          try {
            const me = await usersApi.getMe()
            const mapped = mapBackendUser(me)
            set({ 
              user: mapped, 
              isAuthenticated: true, 
              isLoading: false,
              _lastProfileFetch: now
            })
            console.log('✅ fetchProfile completed successfully');
          } catch (e: unknown) {
            console.error('❌ fetchProfile failed:', e);
            const message = e instanceof Error ? e.message : 'Failed to load profile'
            set({ 
              error: message, 
              isLoading: false, 
              _lastProfileFetch: now 
            })
          } finally {
            globalFetchInProgress = false;
          }
        },

        updateProfile: async (data: UpdateProfileInput) => {
          set({ isLoading: true, error: null })
          try {
            const updated = await usersApi.updateMe(data)
            const mapped = mapBackendUser(updated)
            set({ user: mapped, isLoading: false })
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Failed to update profile'
            set({ error: message, isLoading: false })
          }
        },

        logout: () => {
          set({ user: null, token: null, isAuthenticated: false, error: null })
        },
        isProfileComplete: () => {
          const u = get().user
          if (!u) return false
          const hasLocation = Boolean(u.address || ((u.city || u.state) && u.pincode))
          return Boolean(u.mobile && u.caLevel && hasLocation)
        },
  clearError: () => set({ error: null }),
  clearInfo: () => set({ info: null })
      }),
      {
        name: 'ca-prep-auth-storage',
        partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      }
    )
  )
)
