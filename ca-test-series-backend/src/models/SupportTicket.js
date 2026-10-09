const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: ['TECHNICAL', 'PAYMENT', 'EVALUATION', 'GENERAL', 'ACCOUNT'],
    default: 'GENERAL'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries',
    required: false,
    index: true
  },
  attachments: [{
    url: String,
    originalName: String,
    fileType: String,
    fileSize: Number
  }],
  adminResponse: {
    message: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  studentLastViewed: {
    type: Date,
    default: Date.now
  },
  adminLastViewed: {
    type: Date
  },
  resolvedAt: Date,
  tags: [String],
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Generate unique ticket ID
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketId) {
    try {
      // Generate a timestamp-based unique ID
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.ticketId = `TKT-${timestamp}-${random}`;
      
      // Check for uniqueness (unlikely to conflict with timestamp + random)
      const existing = await this.constructor.findOne({ ticketId: this.ticketId });
      if (existing) {
        // Fallback: add another random number
        const fallbackRandom = Math.floor(Math.random() * 10000);
        this.ticketId = `TKT-${timestamp}-${random}-${fallbackRandom}`;
      }
    } catch (error) {
      console.error('Error generating ticket ID:', error);
      // Final fallback
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      this.ticketId = `TKT-FB-${timestamp}-${random}`;
    }
  }
  next();
});

// Virtual for checking if ticket has unread admin response
supportTicketSchema.virtual('hasUnreadResponse').get(function() {
  return this.adminResponse && 
         this.adminResponse.respondedAt && 
         (!this.studentLastViewed || this.adminResponse.respondedAt > this.studentLastViewed);
});

// Virtual for checking if admin needs to respond
supportTicketSchema.virtual('needsAdminResponse').get(function() {
  return this.status === 'OPEN' || this.status === 'IN_PROGRESS';
});

supportTicketSchema.set('toJSON', { virtuals: true });
supportTicketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
