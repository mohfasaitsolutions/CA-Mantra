const express = require('express');
const { body } = require('express-validator');
const { auth, requireRoles, ROLES } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// All payment routes require authentication
router.use(auth());

// Create Razorpay order for a single test series - Students only
router.post('/create-order',
  requireRoles(ROLES.STUDENTS),
  paymentController.createOrder
);

// Create Razorpay order for all items in cart - Students only
router.post('/create-cart-order',
  requireRoles(ROLES.STUDENTS),
  paymentController.createCartOrder
);

// Verify payment after successful Razorpay checkout - Students only
router.post('/verify',
  requireRoles(ROLES.STUDENTS),
  [
    body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Signature is required')
  ],
  paymentController.verifyPayment
);

// Get payment details - Students only
router.get('/:paymentId',
  requireRoles(ROLES.STUDENTS),
  paymentController.getPaymentDetails
);

// Get payment history - Students only
router.get('/history',
  requireRoles(ROLES.STUDENTS),
  paymentController.getPaymentHistory
);

// Webhook endpoint - No authentication (verified via signature)
// Note: This route should be placed before auth() middleware or use a separate router
const webhookRouter = express.Router();
webhookRouter.post('/webhook',
  express.json({ verify: false }), // Get raw body for signature verification
  paymentController.handleWebhook
);

module.exports = { router, webhookRouter };
