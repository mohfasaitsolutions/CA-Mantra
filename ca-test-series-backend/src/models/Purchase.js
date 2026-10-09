const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studyMaterialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyMaterial',
    required: true,
    index: true
  },
  purchaseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
  paymentMethod: {
    type: String,
    enum: ['RAZORPAY', 'STRIPE', 'PAYPAL', 'UPI', 'NETBANKING', 'CARD', 'WALLET'],
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    index: true
  },
  paymentDetails: {
    transactionId: String,
    paymentId: String,
    orderId: String,
    signature: String,
    gateway: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDownloads: {
    type: Number,
    default: 10,
    min: 1
  },
  expiryDate: {
    type: Date,
    default: function() {
      // Default to 1 year from purchase
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      return date;
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes
purchaseSchema.index({ studentId: 1, studyMaterialId: 1 });
purchaseSchema.index({ status: 1, createdAt: -1 });
purchaseSchema.index({ expiryDate: 1, status: 1 });

// Pre-save middleware to generate purchase ID
purchaseSchema.pre('save', async function(next) {
  if (this.isNew && !this.purchaseId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.purchaseId = `PUR-${timestamp}-${random}`;
  }
  next();
});

// Virtual to check if purchase is expired
purchaseSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Virtual to check if download limit reached
purchaseSchema.virtual('isDownloadLimitReached').get(function() {
  return this.downloadCount >= this.maxDownloads;
});

// Virtual to check if purchase is active (completed and not expired)
purchaseSchema.virtual('isActive').get(function() {
  return this.status === 'COMPLETED' && !this.isExpired && !this.isDownloadLimitReached;
});

// Instance method to increment download count
purchaseSchema.methods.incrementDownload = function() {
  if (this.downloadCount < this.maxDownloads) {
    this.downloadCount += 1;
    return this.save();
  } else {
    throw new Error('Download limit reached');
  }
};

// Static method to find active purchases by student
purchaseSchema.statics.findActiveByStudent = function(studentId) {
  return this.find({
    studentId,
    status: 'COMPLETED',
    expiryDate: { $gt: new Date() }
  }).populate('studyMaterialId');
};

// Static method to check if student has purchased a material
purchaseSchema.statics.hasPurchased = function(studentId, studyMaterialId) {
  return this.findOne({
    studentId,
    studyMaterialId,
    status: 'COMPLETED',
    expiryDate: { $gt: new Date() }
  });
};

purchaseSchema.set('toJSON', { virtuals: true });
purchaseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
