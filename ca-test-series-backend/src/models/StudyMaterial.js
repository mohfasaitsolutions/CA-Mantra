const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['NOTES', 'PRACTICE_PAPERS', 'REFERENCE_BOOKS', 'VIDEO_LECTURES', 'FORMULA_SHEETS', 'CASE_STUDIES', 'MOCK_TESTS', 'OTHER'],
    default: 'NOTES'
  },
  subject: {
    type: String,
    required: true,
    enum: [
      'Accounting',
      'Business Laws',
      'Quantitative Aptitude',
      'Business Economics',
      'Combo',
      'Advanced Accounting',
      'Corporate and Other Laws',
      'Taxation',
      'Cost and Management Accounting',
      'Auditing and Ethics',
      'Financial Management and Strategic Management',
      'Financial Reporting',
      'Advanced Financial Management',
      'Advanced Auditing, Assurance and Professional Ethics',
      'Direct Tax Laws and International Taxation',
      'Indirect Tax Laws',
      'Integrated Business Solution',
      'Corporate and Economic Laws',
      'Strategic Cost and Performance Management',
      'ALL_SUBJECTS'
    ],
    default: 'Combo'
  },
  caLevel: {
    type: String,
    required: true,
    enum: ['FOUNDATION', 'INTERMEDIATE', 'FINAL', 'ALL_LEVELS'],
    default: 'ALL_LEVELS'
  },
  type: {
    type: String,
    required: true,
    enum: ['FREE', 'PAID'],
    default: 'FREE',
    index: true
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function (value) {
        if (this.type === 'PAID' && value <= 0) {
          return false;
        }
        if (this.type === 'FREE' && value > 0) {
          return false;
        }
        return true;
      },
      message: 'Price must be greater than 0 for paid materials and 0 for free materials'
    }
  },
  discountPrice: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function (value) {
        return value <= this.price;
      },
      message: 'Discount price cannot be greater than original price'
    }
  },
  fileInfo: {
    originalName: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  purchaseCount: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
studyMaterialSchema.index({ type: 1, isActive: 1 });
studyMaterialSchema.index({ category: 1, subject: 1, caLevel: 1 });
studyMaterialSchema.index({ featured: 1, isActive: 1 });
studyMaterialSchema.index({ createdAt: -1 });
studyMaterialSchema.index({ downloadCount: -1 });
studyMaterialSchema.index({ purchaseCount: -1 });
studyMaterialSchema.index({ 'rating.average': -1 });

// Virtual for effective price (considering discount)
studyMaterialSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

// Virtual for file size in readable format
studyMaterialSchema.virtual('readableFileSize').get(function () {
  const size = this.fileInfo.size;
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
});

// Virtual for discount percentage
studyMaterialSchema.virtual('discountPercentage').get(function () {
  if (this.discountPrice > 0 && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// Pre-save middleware to update lastUpdated
studyMaterialSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

// Static method to get popular materials
studyMaterialSchema.statics.getPopularMaterials = function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ downloadCount: -1, purchaseCount: -1 })
    .limit(limit)
    .populate('uploadedBy', 'fullName');
};

// Static method to get featured materials
studyMaterialSchema.statics.getFeaturedMaterials = function (limit = 5) {
  return this.find({ isActive: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('uploadedBy', 'fullName');
};

// Instance method to increment download count
studyMaterialSchema.methods.incrementDownload = function () {
  this.downloadCount += 1;
  return this.save();
};

// Instance method to increment purchase count
studyMaterialSchema.methods.incrementPurchase = function () {
  this.purchaseCount += 1;
  return this.save();
};

studyMaterialSchema.set('toJSON', { virtuals: true });
studyMaterialSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
