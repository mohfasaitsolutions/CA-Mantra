const express = require('express');
const { body } = require('express-validator');
const { auth, requireRoles, ROLES } = require('../middleware/auth');
const SUBJECTS = require('../constants/subjects');
const { uploadEvaluatedPDF, uploadProfilePicture, handleFileUploadError } = require('../utils/fileUpload');
const ctrl = require('../controllers/evaluatorController');

const router = express.Router();

// Public/Authorized: list enums for UI
router.get('/subjects', auth(false), (req, res) => {
  res.json({ subjects: SUBJECTS, caLevels: ['FOUNDATION','INTERMEDIATE','FINAL'] });
});

// Admin create evaluator
router.post('/', auth(), requireRoles(ROLES.ADMIN), [
  body('fullName').isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('caLevel').isIn(['FOUNDATION','INTERMEDIATE','FINAL']),
  body('specializations').isArray({ min: 1 }),
  body('specializations.*').isIn(SUBJECTS)
], ctrl.createEvaluator);

// Admin list evaluators
router.get('/', auth(), requireRoles(ROLES.ADMIN), ctrl.listEvaluators);
router.get('/:id', auth(), requireRoles(ROLES.ADMIN), ctrl.getEvaluatorById);
router.post('/:id/resend-invite', auth(), requireRoles(ROLES.ADMIN), ctrl.resendInvite);
router.post('/:id/resend-verification', auth(), requireRoles(ROLES.ADMIN), ctrl.resendVerification);

// Admin toggle status
router.patch('/:id/toggle', auth(), requireRoles(ROLES.ADMIN), ctrl.toggleEvaluatorStatus);

// Admin update evaluator
router.patch('/:id', auth(), requireRoles(ROLES.ADMIN), ctrl.updateEvaluator);

// Evaluator queue
router.get('/me/queue', auth(), requireRoles(ROLES.EVALUATOR, ROLES.ADMIN), ctrl.myQueue);

// Evaluator profile
router.get('/me/profile', auth(), requireRoles(ROLES.EVALUATOR), ctrl.getMyProfile);

// Evaluator update own profile
router.patch('/me/profile', auth(), requireRoles(ROLES.EVALUATOR), [
  body('fullName').optional().isLength({ min: 2 }),
  body('phone').optional().isString(),
  body('experience').optional().isString(),
  body('bio').optional().isString()
], ctrl.updateMyProfile);

// Evaluator upload profile picture
router.post('/me/profile/picture', auth(), requireRoles(ROLES.EVALUATOR), (req, res, next) => {
  uploadProfilePicture(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    next();
  });
}, ctrl.uploadProfilePicture);

// Evaluator get submission details
router.get('/me/submissions/:id', auth(), requireRoles(ROLES.EVALUATOR), ctrl.getSubmissionDetails);

// Admin assign submissions
router.post('/assign', auth(), requireRoles(ROLES.ADMIN), [
  body('evaluatorId').notEmpty(),
  body('submissionIds').isArray({ min: 1 })
], ctrl.assignSubmissions);

// Admin get assignable submissions for specific evaluator (filtered by specialization)
router.get('/:id/assignable-submissions', auth(), requireRoles(ROLES.ADMIN), ctrl.getAssignableSubmissions);

// Evaluator update submission status
router.post('/submissions/:id/status', auth(), requireRoles(ROLES.EVALUATOR, ROLES.ADMIN), ctrl.updateSubmissionStatus);

// Evaluator upload evaluated file
router.post('/submissions/:id/upload-evaluated', auth(), requireRoles(ROLES.EVALUATOR, ROLES.ADMIN), uploadEvaluatedPDF, handleFileUploadError, ctrl.uploadEvaluatedFile);

module.exports = router;
