const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  testSeriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries',
    required: true
  },
  // Invoice Details
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  // Customer Details
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: String,
  customerAddress: String,
  // Product Details
  items: [{
    description: String,
    quantity: {
      type: Number,
      default: 1
    },
    unitPrice: Number,
    amount: Number
  }],
  // Pricing
  subtotal: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    default: 18 // GST 18%
  },
  taxAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  // Payment Info
  paymentMethod: String,
  paymentStatus: {
    type: String,
    enum: ['PAID', 'UNPAID', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'PAID'
  },
  transactionId: String,
  // Email Status
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  emailError: String,
  // Notes
  notes: String,
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes
invoiceSchema.index({ studentId: 1, createdAt: -1 });
invoiceSchema.index({ invoiceNumber: 1, studentId: 1 });
invoiceSchema.index({ paymentStatus: 1, emailSent: 1 });

// Pre-save middleware to generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the last invoice of the current month
    const lastInvoice = await this.constructor.findOne({
      invoiceNumber: new RegExp(`^INV-${year}${month}-`)
    }).sort({ invoiceNumber: -1 });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    this.invoiceNumber = `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  next();
});

// Method to mark email as sent
invoiceSchema.methods.markEmailSent = function() {
  this.emailSent = true;
  this.emailSentAt = new Date();
  this.emailError = null;
  return this.save();
};

// Method to mark email as failed
invoiceSchema.methods.markEmailFailed = function(error) {
  this.emailSent = false;
  this.emailError = error;
  return this.save();
};

// Static method to find by invoice number
invoiceSchema.statics.findByInvoiceNumber = function(invoiceNumber) {
  return this.findOne({ invoiceNumber });
};

// Static method to find invoices by student
invoiceSchema.statics.findByStudent = function(studentId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const query = { studentId };
  if (status) {
    query.paymentStatus = status;
  }
  
  return this.find(query)
    .populate('testSeriesId', 'title')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

module.exports = mongoose.model('Invoice', invoiceSchema);
