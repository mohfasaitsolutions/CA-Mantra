const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  testSeriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries',
    required: false, // Made optional for bulk payments
    index: true
  },
  testSeriesIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries'
  }],
  // Razorpay Order Details
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    index: true
  },
  razorpaySignature: {
    type: String
  },
  // Amount Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  // Payment Status
  status: {
    type: String,
    enum: ['CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'CREATED',
    index: true
  },
  // Payment Method (filled after payment)
  paymentMethod: {
    type: String,
    enum: ['card', 'netbanking', 'wallet', 'upi', 'emi', 'cardless_emi', 'paylater', 'other']
  },
  // Additional Razorpay Response
  razorpayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  // Error tracking
  errorCode: String,
  errorDescription: String,
  errorReason: String,
  // Verification
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  verifiedAt: Date,
  // Enrollment link
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment'
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Webhook
  webhookReceived: {
    type: Boolean,
    default: false
  },
  webhookReceivedAt: Date
}, {
  timestamps: true
});

// Compound indexes
paymentSchema.index({ studentId: 1, testSeriesId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ isVerified: 1, status: 1 });

// Method to mark payment as captured
paymentSchema.methods.markAsCaptured = function (paymentId, signature, razorpayResponse = {}) {
  this.razorpayPaymentId = paymentId;
  this.razorpaySignature = signature;
  this.status = 'CAPTURED';
  this.isVerified = true;
  this.verifiedAt = new Date();
  this.razorpayResponse = razorpayResponse;
  if (razorpayResponse.method) {
    this.paymentMethod = razorpayResponse.method;
  }
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markAsFailed = function (errorCode, errorDescription, errorReason) {
  this.status = 'FAILED';
  this.errorCode = errorCode;
  this.errorDescription = errorDescription;
  this.errorReason = errorReason;
  return this.save();
};

// Static method to find payment by order ID
paymentSchema.statics.findByOrderId = function (orderId) {
  return this.findOne({ razorpayOrderId: orderId });
};

// Static method to find verified payment for student and test series
paymentSchema.statics.findVerifiedPayment = function (studentId, testSeriesId) {
  return this.findOne({
    studentId,
    testSeriesId,
    status: 'CAPTURED',
    isVerified: true
  });
};

module.exports = mongoose.model('Payment', paymentSchema);
