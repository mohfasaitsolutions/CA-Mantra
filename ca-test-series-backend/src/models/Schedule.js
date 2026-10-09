const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return v === 'application/pdf';
      },
      message: 'Only PDF files are allowed for schedules'
    }
  },
  examType: {
    type: String,
    enum: ['FOUNDATION', 'INTERMEDIATE', 'FINAL', 'ALL'],
    default: 'ALL'
  },
  examSession: {
    type: String,
    enum: ['Jan', 'May', 'September', 'January', 'November', 'DECEMBER', 'MAY', 'NOVEMBER', 'BOTH'],
    required: true
  },
  examYear: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority for display
  }
}, {
  timestamps: true
});

// Index for efficient queries
scheduleSchema.index({ examType: 1, examSession: 1, examYear: 1 });
scheduleSchema.index({ isActive: 1, priority: -1, createdAt: -1 });

// Virtual for readable file size
scheduleSchema.virtual('readableFileSize').get(function () {
  const bytes = this.fileSize;
  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Ensure virtual fields are serialized
scheduleSchema.set('toJSON', { virtuals: true });
scheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
