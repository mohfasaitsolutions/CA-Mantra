export const BACKEND_ROLES = {
  ADMIN: 'ADMIN',
  EVALUATOR: 'EVALUATOR',
  STUDENTS: 'STUDENTS'
} as const;

export type BackendRole = typeof BACKEND_ROLES[keyof typeof BACKEND_ROLES];

export const APP_ROLES = {
  ADMIN: 'admin',
  EVALUATOR: 'evaluator',
  STUDENT: 'student'
} as const;

export type AppRole = typeof APP_ROLES[keyof typeof APP_ROLES];

export const mapBackendRole = (role?: string): AppRole => {
  switch ((role || '').toUpperCase()) {
    case BACKEND_ROLES.ADMIN: return APP_ROLES.ADMIN;
    case BACKEND_ROLES.EVALUATOR: return APP_ROLES.EVALUATOR;
    default: return APP_ROLES.STUDENT; // covers STUDENTS plural
  }
};

export const dashboardPathForRole = (role?: string) => {
  const r = mapBackendRole(role);
  if (r === APP_ROLES.ADMIN) return '/admin/dashboard';
  if (r === APP_ROLES.EVALUATOR) return '/evaluator/dashboard';
  return '/student/dashboard';
};
