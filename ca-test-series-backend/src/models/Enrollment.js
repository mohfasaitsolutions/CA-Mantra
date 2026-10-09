const mongoose = require('mongoose');

// Represents a student's purchase/enrollment to a Test Series
const EnrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testSeriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries', required: true, index: true },
    purchasedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true, index: true },
    // Payment/transaction metadata (supports gateways like Razorpay/PhonePe)
    payment: {
      provider: { type: String, enum: ['RAZORPAY', 'PHONEPE', 'MANUAL', 'OTHER'], default: 'MANUAL' },
      // Generic status of the purchase/payment lifecycle
      status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'SUCCESS', index: true },
      amount: { type: Number, min: 0 },
      currency: { type: String, default: 'INR' },
      // Order-level identifiers (e.g., Razorpay order)
      orderId: { type: String, index: true },
      receipt: { type: String },
      // Payment-level identifiers and details
      transactionId: { type: String, index: true }, // generic transaction/payment reference
      paymentId: { type: String, index: true }, // e.g., Razorpay payment id
      signature: { type: String }, // e.g., Razorpay signature for verification
      method: { type: String }, // UPI, CARD, NETBANKING, WALLET, etc.
      capturedAt: { type: Date },
      failureReason: { type: String },
      meta: { type: mongoose.Schema.Types.Mixed }, // raw gateway payloads or extra info
    },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ studentId: 1, testSeriesId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
