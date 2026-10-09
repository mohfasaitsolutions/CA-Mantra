const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', [
  body('fullName').isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('mobile').matches(/^[0-9]{10}$/).withMessage('Mobile number must be a valid 10-digit number'),
  body('caLevel').optional().isIn(['FOUNDATION','INTERMEDIATE','FINAL'])
], ctrl.signup);

router.get('/verify-email', ctrl.verifyEmail);
router.post('/signin', [ body('email').isEmail(), body('password').notEmpty() ], ctrl.signin);
router.post('/evaluator/signin', [ body('email').isEmail(), body('password').notEmpty() ], ctrl.evaluatorSignin);
router.post('/forgot-password', [ body('email').isEmail() ], ctrl.requestPasswordReset);
router.post('/reset-password', [ body('token').notEmpty(), body('password').isLength({ min:6 }) ], ctrl.resetPassword);
router.post('/resend-verification', [ body('email').isEmail() ], ctrl.resendVerification);

// Authenticated change password
router.post(
  '/change-password',
  auth(),
  [ body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 }) ],
  ctrl.changePassword
);

module.exports = router;
