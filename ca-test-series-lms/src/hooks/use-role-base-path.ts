import { useAuthStore } from '@/lib/store';
import { isCourseUploader } from '@/constants/roles';

/**
 * Course management pages are shared between ADMIN and COURSE_UPLOADER, but they
 * live under different URL prefixes so that a course uploader never lands on an
 * /admin/* route. Use this for every in-page navigation inside those pages.
 *
 * ADMIN -> "/admin", COURSE_UPLOADER -> "/uploader"
 */
export const useRoleBasePath = (): '/admin' | '/uploader' => {
  const user = useAuthStore((s) => s.user);
  return isCourseUploader(user?.role) ? '/uploader' : '/admin';
};

/**
 * True when the signed-in user is a COURSE_UPLOADER. Use it to hide controls the
 * server will reject for them (delete, revenue) so they never see a dead button.
 * This is presentation only — the API enforces the same rules independently.
 */
export const useIsCourseUploader = (): boolean => {
  const user = useAuthStore((s) => s.user);
  return isCourseUploader(user?.role);
};
