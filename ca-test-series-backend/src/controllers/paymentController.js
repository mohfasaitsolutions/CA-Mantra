const mongoose = require('mongoose');
const TestSeries = require('../models/TestSeries');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Cart = require('../models/Cart');
const User = require('../models/User');
const razorpayService = require('../services/razorpayService');
const { validationResult } = require('express-validator');
const { sendPaymentSuccessEmailToCustomer, sendPaymentNotificationToAdmin } = require('../services/emailService');

function isSeriesExpired(validity) {
  if (!validity || validity.isUnlimited) return false;
  if (!validity.expiryDate) return false;
  const expiry = new Date(validity.expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() < Date.now();
}

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for test series purchase
 */
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { testSeriesId } = req.body;
    const studentId = req.user.id;

    // Validate test series ID
    if (!mongoose.Types.ObjectId.isValid(testSeriesId)) {
      return res.status(400).json({ message: 'Invalid test series ID' });
    }

    // Check if test series exists and is active
    const testSeries = await TestSeries.findOne({
      _id: testSeriesId,
      isActive: true,
      $or: [{ status: 'PUBLISHED' }, { status: { $exists: false } }]
    });
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found or inactive' });
    }

    if (isSeriesExpired(testSeries.validity)) {
      return res.status(400).json({ message: 'This test series validity has expired and cannot be purchased' });
    }

    // Get student details to check CA level
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Validate CA Level match - students can only purchase test series for their level or 'ALL' level
    if (testSeries.caLevel !== 'ALL' && testSeries.caLevel !== student.caLevel) {
      return res.status(403).json({
        message: `You cannot purchase this test series. This is a ${testSeries.caLevel} level test series, but you are enrolled in ${student.caLevel} level.`,
        studentLevel: student.caLevel,
        testSeriesLevel: testSeries.caLevel
      });
    }

    // Check if already purchased
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      testSeriesId,
      isActive: true
    });
    if (existingEnrollment) {
      return res.status(409).json({ message: 'Already purchased this test series' });
    }

    // Check for existing pending payment
    const existingPayment = await Payment.findOne({
      studentId,
      testSeriesId,
      status: { $in: ['CREATED', 'PENDING'] }
    });

    if (existingPayment) {
      // Return existing order if still valid
      return res.json({
        orderId: existingPayment.razorpayOrderId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        testSeriesId: testSeries._id,
        testSeriesTitle: testSeries.title
      });
    }

    // Create Razorpay order
    // Receipt must be max 40 characters, so use timestamp + random string
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits
    const random = Math.random().toString(36).substring(2, 8); // 6 char random
    const receipt = `TS-${timestamp}-${random}`; // Format: TS-1234567890-abc123 (max 25 chars)

    // If test series is purely free
    if (testSeries.price <= 0) {
      const payment = await Payment.create({
        studentId,
        testSeriesId,
        razorpayOrderId: `FREE_${receipt}`,
        amount: 0,
        currency: 'INR',
        status: 'CAPTURED',
        isVerified: true,
        verifiedAt: new Date()
      });

      const enrollment = await Enrollment.create({
        studentId,
        testSeriesId,
        isActive: true
      });
      
      payment.enrollmentId = enrollment._id;
      await payment.save();

      return res.status(201).json({
        orderId: `FREE_${receipt}`,
        amount: 0,
        currency: 'INR',
        testSeriesId: testSeries._id,
        testSeriesTitle: testSeries.title,
        paymentId: payment._id,
        enrollmentId: enrollment._id,
        isFree: true
      });
    }

    const razorpayOrder = await razorpayService.createOrder({
      amount: testSeries.price,
      currency: 'INR',
      receipt,
      notes: {
        studentId: studentId.toString(),
        testSeriesId: testSeriesId.toString(),
        testSeriesTitle: testSeries.title
      }
    });

    // Save payment record
    const payment = await Payment.create({
      studentId,
      testSeriesId,
      razorpayOrderId: razorpayOrder.id,
      amount: testSeries.price,
      currency: 'INR',
      status: 'CREATED'
    });

    return res.status(201).json({
      orderId: razorpayOrder.id,
      amount: testSeries.price,
      currency: 'INR',
      testSeriesId: testSeries._id,
      testSeriesTitle: testSeries.title,
      paymentId: payment._id
    });

  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      message: 'Failed to create order',
      error: error.message
    });
  }
};

/**
 * POST /api/payments/create-cart-order
 * Create a Razorpay order for all items in the current cart
 */
exports.createCartOrder = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student's cart
    const cart = await Cart.findOne({ studentId }).populate('items.testSeriesId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Filter valid items (active and price > 0 if needed)
    const validItems = cart.items.filter(
      item => item.testSeriesId && item.testSeriesId.isActive && !isSeriesExpired(item.testSeriesId.validity)
    );
    if (validItems.length === 0) {
      return res.status(400).json({ message: 'No valid items in cart' });
    }

    const totalPrice = validItems.reduce((sum, item) => sum + item.price, 0);
    const testSeriesIds = validItems.map(item => item.testSeriesId._id);
    const testSeriesTitles = validItems.map(item => item.testSeriesId.title).join(', ');

    // Get student details
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create Razorpay order
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.random().toString(36).substring(2, 8);
    const receipt = `CART-${timestamp}-${random}`;

    // If whole cart is free
    if (totalPrice <= 0) {
      const payment = await Payment.create({
        studentId,
        testSeriesIds,
        razorpayOrderId: `FREE_CART_${receipt}`,
        amount: 0,
        currency: 'INR',
        status: 'CAPTURED',
        isVerified: true,
        verifiedAt: new Date(),
        metadata: {
          isCartOrder: true,
          testSeriesTitles
        }
      });

      // Clear ONLY the processed items from cart
      await Cart.findOneAndUpdate(
        { studentId },
        { $pull: { items: { testSeriesId: { $in: testSeriesIds } } } }
      );

      for (const tsId of testSeriesIds) {
        await Enrollment.create({
          studentId,
          testSeriesId: tsId,
          isActive: true
        });
      }

      return res.status(201).json({
        orderId: `FREE_CART_${receipt}`,
        amount: 0,
        currency: 'INR',
        testSeriesIds,
        testSeriesTitles,
        paymentId: payment._id,
        isFree: true
      });
    }

    const razorpayOrder = await razorpayService.createOrder({
      amount: totalPrice,
      currency: 'INR',
      receipt,
      notes: {
        studentId: studentId.toString(),
        testSeriesIds: testSeriesIds.join(','),
        testSeriesTitles: testSeriesTitles.substring(0, 100), // Razorpay note limit
        isCartOrder: 'true'
      }
    });

    // Save payment record
    const payment = await Payment.create({
      studentId,
      testSeriesIds,
      razorpayOrderId: razorpayOrder.id,
      amount: totalPrice,
      currency: 'INR',
      status: 'CREATED',
      metadata: {
        isCartOrder: true,
        testSeriesTitles
      }
    });

    return res.status(201).json({
      orderId: razorpayOrder.id,
      amount: totalPrice,
      currency: 'INR',
      testSeriesIds,
      testSeriesTitles,
      paymentId: payment._id
    });

  } catch (error) {
    console.error('Create cart order error:', error);
    return res.status(500).json({
      message: 'Failed to create cart order',
      error: error.message
    });
  }
};

/**
 * POST /api/payments/verify
 * Verify Razorpay payment and create enrollment
 */
exports.verifyPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const studentId = req.user.id;

    // Find payment record
    const payment = await Payment.findByOrderId(razorpay_order_id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Verify student ID matches
    if (payment.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Unauthorized payment verification' });
    }

    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      await payment.markAsFailed('SIGNATURE_MISMATCH', 'Invalid payment signature', 'Signature verification failed');
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Fetch payment details from Razorpay
    let razorpayPaymentDetails = {};
    try {
      razorpayPaymentDetails = await razorpayService.fetchPayment(razorpay_payment_id);
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
    }

    // Mark payment as captured
    await payment.markAsCaptured(razorpay_payment_id, razorpay_signature, razorpayPaymentDetails);

    // Get student details
    const student = await User.findById(payment.studentId);
    if (!student) {
      await payment.markAsFailed('VALIDATION_ERROR', 'Student not found');
      return res.status(404).json({ message: 'Student not found' });
    }

    // Determine IDs to enroll
    const testSeriesIds = payment.testSeriesIds && payment.testSeriesIds.length > 0
      ? payment.testSeriesIds
      : payment.testSeriesId ? [payment.testSeriesId] : [];

    if (testSeriesIds.length === 0) {
      await payment.markAsFailed('VALIDATION_ERROR', 'No test series IDs found in payment record');
      return res.status(400).json({ message: 'No test series IDs found in payment record' });
    }

    // For single item orders, we still do CA level validation
    if (!payment.metadata?.isCartOrder && payment.testSeriesId) {
      const testSeries = await TestSeries.findById(payment.testSeriesId);
      if (testSeries && testSeries.caLevel !== 'ALL' && testSeries.caLevel !== student.caLevel) {
        await payment.markAsFailed('CA_LEVEL_MISMATCH', `CA level mismatch: Student ${student.caLevel}, Test Series ${testSeries.caLevel}`);
        return res.status(403).json({
          message: `Payment cannot be processed. This is a ${testSeries.caLevel} level test series, but you are enrolled in ${student.caLevel} level.`,
          studentLevel: student.caLevel,
          testSeriesLevel: testSeries.caLevel
        });
      }
    }

    const enrollments = [];
    for (const tsId of testSeriesIds) {
      let enrollment = await Enrollment.findOne({
        studentId: payment.studentId,
        testSeriesId: tsId
      });

      if (!enrollment) {
        enrollment = await Enrollment.create({
          studentId: payment.studentId,
          testSeriesId: tsId,
          isActive: true
        });
      }
      enrollments.push(enrollment);
    }

    // Clear cart specific items instead of emptying the whole cart to avoid overwriting items added in different tabs
    if (payment.metadata?.isCartOrder) {
      await Cart.findOneAndUpdate(
        { studentId: payment.studentId },
        { $pull: { items: { testSeriesId: { $in: testSeriesIds } } } }
      );
    }

    if (enrollments.length > 0) {
      payment.enrollmentId = enrollments[0]._id;
      await payment.save();
    }

    // Create Razorpay Invoice and send emails
    try {
      const tsIdForEmail = testSeriesIds[0];
      const testSeries = await TestSeries.findById(tsIdForEmail);

      if (student && testSeries) {
        const description = payment.metadata?.isCartOrder
          ? `Cart Purchase: ${payment.metadata.testSeriesTitles || 'Multiple Items'}`
          : `Test Series: ${testSeries.title}`;

        // Create Razorpay Invoice (will automatically email to customer)
        try {
          const invoice = await razorpayService.createInvoice({
            customerName: student.fullName || student.email,
            customerEmail: student.email,
            customerContact: student.mobile || student.phone || '',
            amount: payment.amount,
            description: description.substring(0, 255),
            currency: payment.currency || 'INR'
          });

          // Store invoice ID in payment metadata
          payment.metadata = payment.metadata || {};
          payment.metadata.razorpayInvoiceId = invoice.id;
          payment.metadata.invoiceShortUrl = invoice.short_url;
          await payment.save();

          console.log('Razorpay invoice created and emailed:', invoice.id);
        } catch (invoiceError) {
          console.error('Failed to create Razorpay invoice:', invoiceError);
        }

        // Send payment success email to customer
        try {
          await sendPaymentSuccessEmailToCustomer(student, testSeries, payment);
          console.log('Payment success email sent to customer:', student.email);
        } catch (emailError) {
          console.error('Failed to send payment success email to customer:', emailError);
        }

        // Send payment notification to admin
        try {
          await sendPaymentNotificationToAdmin(student, testSeries, payment);
          console.log('Payment notification sent to admin');
        } catch (emailError) {
          console.error('Failed to send payment notification to admin:', emailError);
        }
      }
    } catch (error) {
      // Don't fail the payment if invoice/email fails
      console.error('Failed to process post-payment tasks:', error);
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      enrollmentId: enrollments[0]?._id,
      paymentId: payment._id
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

/**
 * POST /api/payments/webhook
 * Handle Razorpay webhook events
 */
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity;
    const orderEntity = body.payload?.order?.entity;

    console.log(`Webhook received: ${event}`);

    // Handle different webhook events
    switch (event) {
      case 'payment.authorized':
      case 'payment.captured':
        if (paymentEntity) {
          const payment = await Payment.findByOrderId(paymentEntity.order_id);
          if (payment && payment.status !== 'CAPTURED') {
            payment.status = 'CAPTURED';
            payment.razorpayPaymentId = paymentEntity.id;
            payment.isVerified = true;
            payment.verifiedAt = new Date();
            payment.razorpayResponse = paymentEntity;
            payment.webhookReceived = true;
            payment.webhookReceivedAt = new Date();

            if (paymentEntity.method) {
              payment.paymentMethod = paymentEntity.method;
            }

            await payment.save();

            // Create enrollment if not exists
            const testSeriesIds = payment.testSeriesIds && payment.testSeriesIds.length > 0
              ? payment.testSeriesIds
              : [payment.testSeriesId];

            for (const tsId of testSeriesIds) {
              const existingEnrollment = await Enrollment.findOne({
                studentId: payment.studentId,
                testSeriesId: tsId
              });

              if (!existingEnrollment) {
                await Enrollment.create({
                  studentId: payment.studentId,
                  testSeriesId: tsId,
                  isActive: true
                });
              }
            }

            if (payment.metadata?.isCartOrder) {
              await Cart.findOneAndUpdate(
                { studentId: payment.studentId },
                { $pull: { items: { testSeriesId: { $in: testSeriesIds } } } }
              );
            }

            // Create Razorpay Invoice and send emails (webhook scenario)
            if (!payment.metadata?.razorpayInvoiceId) {
              try {
                const User = require('../models/User');
                const user = await User.findById(payment.studentId);
                const tsIdForEmail = payment.testSeriesId || (payment.testSeriesIds && payment.testSeriesIds[0]);
                const testSeries = await TestSeries.findById(tsIdForEmail);

                if (user && testSeries) {
                  // Create Razorpay Invoice
                  try {
                    const invoice = await razorpayService.createInvoice({
                      customerName: user.fullName || user.email,
                      customerEmail: user.email,
                      customerContact: user.mobile || user.phone || '',
                      amount: payment.amount,
                      description: `Test Series: ${testSeries.title}`,
                      currency: payment.currency || 'INR'
                    });

                    payment.metadata = payment.metadata || {};
                    payment.metadata.razorpayInvoiceId = invoice.id;
                    payment.metadata.invoiceShortUrl = invoice.short_url;
                    await payment.save();

                    console.log('Razorpay invoice created via webhook:', invoice.id);
                  } catch (invoiceError) {
                    console.error('Failed to create invoice in webhook:', invoiceError);
                  }

                  // Send payment success email to customer
                  try {
                    await sendPaymentSuccessEmailToCustomer(user, testSeries, payment);
                    console.log('Payment success email sent to customer (webhook):', user.email);
                  } catch (emailError) {
                    console.error('Failed to send payment success email in webhook:', emailError);
                  }

                  // Send payment notification to admin
                  try {
                    await sendPaymentNotificationToAdmin(user, testSeries, payment);
                    console.log('Payment notification sent to admin (webhook)');
                  } catch (emailError) {
                    console.error('Failed to send payment notification in webhook:', emailError);
                  }
                }
              } catch (error) {
                console.error('Failed to process post-payment tasks in webhook:', error);
              }
            }
          }
        }
        break;

      case 'payment.failed':
        if (paymentEntity) {
          const payment = await Payment.findByOrderId(paymentEntity.order_id);
          if (payment) {
            await payment.markAsFailed(
              paymentEntity.error_code,
              paymentEntity.error_description,
              paymentEntity.error_reason
            );
            payment.webhookReceived = true;
            payment.webhookReceivedAt = new Date();
            await payment.save();
          }
        }
        break;

      case 'order.paid':
        // Order paid event - can be used for additional processing
        if (orderEntity) {
          console.log(`Order paid: ${orderEntity.id}`);
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return res.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook handling error:', error);
    return res.status(500).json({
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

/**
 * GET /api/payments/:paymentId
 * Get payment details
 */
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: 'Invalid payment ID' });
    }

    const payment = await Payment.findById(paymentId)
      .populate('testSeriesId', 'title price caLevel')
      .populate('enrollmentId');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify student owns this payment
    if (payment.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    return res.json(payment);

  } catch (error) {
    console.error('Get payment details error:', error);
    return res.status(500).json({
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};

/**
 * GET /api/payments/history
 * Get payment history for logged-in student
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { studentId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('testSeriesId', 'title price caLevel')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payment.countDocuments(query);

    return res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};
