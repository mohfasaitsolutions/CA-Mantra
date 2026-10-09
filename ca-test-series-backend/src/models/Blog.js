const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200
  },
  content: { 
    type: String, 
    required: true 
  },
  excerpt: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  slug: { 
    type: String, 
    unique: true, 
    index: true 
  },
  tags: [{ 
    type: String, 
    trim: true,
    lowercase: true
  }],
  category: { 
    type: String, 
    trim: true,
    enum: ['FOUNDATION', 'INTERMEDIATE', 'FINAL', 'GENERAL', 'TIPS', 'NEWS'],
    default: 'GENERAL'
  },
  status: { 
    type: String, 
    enum: ['PUBLISHED'], 
    default: 'PUBLISHED',
    index: true
  },
  publishedAt: { 
    type: Date 
  },
  viewCount: { 
    type: Number, 
    default: 0 
  },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  meta: { 
    type: mongoose.Schema.Types.Mixed 
  }
}, { 
  timestamps: true 
});

// Indexes for performance
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ author: 1, status: 1 });
BlogSchema.index({ category: 1, status: 1 });
BlogSchema.index({ tags: 1 });

// Generate slug from title before saving
BlogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set publishedAt when blog is created
  if (this.isNew && this.status === 'PUBLISHED' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Generate excerpt from content if not provided
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 150) + '...';
  }
  
  next();
});

// Virtual for like count
BlogSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

BlogSchema.set('toJSON', { virtuals: true });
BlogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Blog', BlogSchema);