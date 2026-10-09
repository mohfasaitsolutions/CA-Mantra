const express = require('express');
const { body } = require('express-validator');
const { auth, requireRoles, ROLES } = require('../middleware/auth');
const { uploadProfilePicture, handleFileUploadError } = require('../utils/fileUpload');
const SUBJECTS = require('../constants/subjects');
const ctrl = require('../controllers/userController');

const router = express.Router();

router.get('/me', auth(), ctrl.getProfile);
router.patch('/me', auth(), ctrl.updateProfile);
router.post('/me/profile/picture', auth(), uploadProfilePicture, handleFileUploadError, ctrl.uploadProfilePicture);
router.post('/send-mobile-otp', auth(), ctrl.sendMobileOTP);
router.post('/verify-mobile-otp', auth(), [ body('otp').notEmpty().withMessage('OTP is required') ], ctrl.verifyMobileOTP);

router.post('/', auth(), requireRoles(ROLES.ADMIN), [
  body('fullName').isLength({ min:2 }),
  body('email').isEmail(),
  body('password').isLength({ min:6 }),
  body('caLevel').isIn(['FOUNDATION','INTERMEDIATE','FINAL']),
  body('role').isIn([ROLES.ADMIN, ROLES.EVALUATOR]),
  body('specializations').optional().isArray(),
  body('specializations.*').optional().isIn(SUBJECTS)
], ctrl.adminCreateUser);

router.get('/', auth(), requireRoles(ROLES.ADMIN), ctrl.listUsers);

module.exports = router;
