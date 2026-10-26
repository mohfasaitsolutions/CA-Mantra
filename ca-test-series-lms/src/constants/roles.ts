export const BACKEND_ROLES = {
  ADMIN: 'ADMIN',
  EVALUATOR: 'EVALUATOR',
  COURSE_UPLOADER: 'COURSE_UPLOADER',
  STUDENTS: 'STUDENTS'
} as const;

export type BackendRole = typeof BACKEND_ROLES[keyof typeof BACKEND_ROLES];

export const APP_ROLES = {
  ADMIN: 'admin',
  EVALUATOR: 'evaluator',
  COURSE_UPLOADER: 'course-uploader',
  STUDENT: 'student'
} as const;

export type AppRole = typeof APP_ROLES[keyof typeof APP_ROLES];

export const mapBackendRole = (role?: string): AppRole => {
  switch ((role || '').toUpperCase()) {
    case BACKEND_ROLES.ADMIN: return APP_ROLES.ADMIN;
    case BACKEND_ROLES.EVALUATOR: return APP_ROLES.EVALUATOR;
    case BACKEND_ROLES.COURSE_UPLOADER: return APP_ROLES.COURSE_UPLOADER;
    default: return APP_ROLES.STUDENT; // covers STUDENTS plural
  }
};

export const dashboardPathForRole = (role?: string) => {
  const r = mapBackendRole(role);
  if (r === APP_ROLES.ADMIN) return '/admin/dashboard';
  if (r === APP_ROLES.EVALUATOR) return '/evaluator/dashboard';
  if (r === APP_ROLES.COURSE_UPLOADER) return '/uploader/tests';
  return '/student/dashboard';
};

export const isCourseUploader = (role?: string) =>
  mapBackendRole(role) === APP_ROLES.COURSE_UPLOADER;
