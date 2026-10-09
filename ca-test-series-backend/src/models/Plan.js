const mongoose = require('mongoose');

const testSeriesItemSchema = new mongoose.Schema({
  testSeriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  testSeriesItems: [testSeriesItemSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Indexes for efficient queries
PlanSchema.index({ name: 'text', description: 'text' });
PlanSchema.index({ displayOrder: 1, isActive: 1 });

module.exports = mongoose.model('Plan', PlanSchema);
