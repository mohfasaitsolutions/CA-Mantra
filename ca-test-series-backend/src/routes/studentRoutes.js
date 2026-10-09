const express = require('express');
const { body } = require('express-validator');
const { auth, requireRoles, ROLES } = require('../middleware/auth');
const { uploadProfilePicture, handleFileUploadError } = require('../utils/fileUpload');
const ctrl = require('../controllers/studentController');

const router = express.Router();

// PUBLIC ROUTES - No authentication required
router.get('/public/study-materials', ctrl.getPublicStudyMaterials);

// All other student routes require authentication with STUDENTS role
router.use(auth());
router.use(requireRoles(ROLES.STUDENTS));

// Protected routes - require authentication
router.get('/study-materials/:id/download', ctrl.downloadStudyMaterial);

router.get('/dashboard', ctrl.getDashboard);
router.get('/purchases', ctrl.getPurchasedSeries);
router.get('/history', ctrl.getTestHistory);
router.get('/submissions/:submissionId', ctrl.getSubmissionDetails);
router.post('/submissions/:submissionId/feedback', [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString()
], ctrl.submitFeedback);
router.post('/purchases/:testSeriesId', ctrl.purchaseSeries);
router.get('/profile-complete', ctrl.isProfileComplete);
router.get('/profile', ctrl.getMyProfile);
router.patch('/profile', [
  body('fullName').optional().isLength({ min: 2 }),
  body('mobile').optional().isString(),
  body('phone').optional().isString(),
  body('address').optional().isString(),
  body('dob').optional().isISO8601(),
  body('experience').optional().isString(),
  body('bio').optional().isString(),
  body('caLevel').optional().isIn(['FOUNDATION', 'INTERMEDIATE', 'FINAL']).withMessage('caLevel must be FOUNDATION, INTERMEDIATE, or FINAL')
], ctrl.updateMyProfile);
router.post('/profile/picture', uploadProfilePicture, handleFileUploadError, ctrl.uploadProfilePicture);
router.get('/analytics', ctrl.getAnalytics);
router.get('/unattempted', ctrl.getUnattemptedTests);
// Test start + submissions
// Place more specific routes BEFORE generic ":testId" to avoid conflicts
router.get('/tests/:testSeriesId/statuses', ctrl.getTestStatuses);
router.get('/tests/:testSeriesId/:testId/suggested-answer', ctrl.getSuggestedAnswer);
router.get('/tests/:testSeriesId/:testId', ctrl.getTestDetail);
router.post('/tests/:testSeriesId/:testId/objective-submission', ctrl.submitObjective);
router.post('/tests/:testSeriesId/:testId/subjective-submission', ctrl.submitSubjective);

// Support tickets
router.post('/support-tickets', [
  body('subject').isLength({ min: 5, max: 200 }),
  body('description').isLength({ min: 10, max: 2000 }),
  body('category').optional().isIn(['TECHNICAL', 'PAYMENT', 'EVALUATION', 'GENERAL', 'ACCOUNT']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
], ctrl.createSupportTicket);
router.get('/support-tickets', ctrl.getSupportTickets);
router.get('/support-tickets/:ticketId', ctrl.getSupportTicketDetails);

module.exports = router;
