module.exports = Object.freeze({
  ADMIN: 'ADMIN',
  EVALUATOR: 'EVALUATOR',
  // Manages course content (test series, plans, study materials) only.
  // Has no access to the admin console: dashboard, orders, students,
  // evaluators, support tickets, schedules, analytics or settings.
  COURSE_UPLOADER: 'COURSE_UPLOADER',
  STUDENTS: 'STUDENTS'
});
