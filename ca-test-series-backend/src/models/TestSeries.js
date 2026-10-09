const mongoose = require('mongoose');
const SUBJECTS = require('../constants/subjects');

const MCQQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  options: {
    A: { type: String, required: true, trim: true },
    B: { type: String, required: true, trim: true },
    C: { type: String, required: true, trim: true },
    D: { type: String, required: true, trim: true }
  },
  correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  marks: { type: Number, required: true, min: 1, default: 1 },
  negativeMarks: { type: Number, default: 0, min: 0 }
}, { _id: true });

const TestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  testType: { type: String, enum: ['OBJECTIVE', 'SUBJECTIVE', 'MIXED'], required: true },
  subject: { type: String, required: true, enum: SUBJECTS, trim: true },

  // For Objective Tests and Objective part of Mixed Tests
  mcqQuestions: [MCQQuestionSchema],

  // For Subjective Tests and Subjective part of Mixed Tests
  questionPaperUrl: { type: String }, // PDF URL for question paper
  suggestedAnswerUrl: { type: String }, // PDF URL for suggested answers

  // For Mixed Tests - separate marks allocation
  objectiveMarks: { type: Number, default: 0 }, // Marks for objective section
  subjectiveMarks: { type: Number, default: 0 }, // Marks for subjective section

  totalMarks: { type: Number, default: 0 },
  passingPercentage: { type: Number, default: 40, min: 0, max: 100 },
  duration: { type: Number }, // Duration in minutes
  instructions: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  // Optional: restrict which evaluators can grade this test
  allowedEvaluatorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const TestSeriesSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  discountedPrice: { type: Number, min: 0 },
  thumbnailUrl: { 
    type: String,
    // Default thumbnail if none provided
    default: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop'
  },
  caLevel: { type: String, enum: ['FOUNDATION', 'INTERMEDIATE', 'FINAL', 'ALL'], required: true },
  
  // Plan categorization (optional reference to Plan)
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  
  // Access validity and attempts policy for the series
  validity: {
    isUnlimited: { type: Boolean, default: true },
    days: { type: Number, min: 1, default: undefined }, // DEPRECATED: used when isUnlimited=false
    expiryDate: { type: Date, default: undefined }, // used when isUnlimited=false
  },
  attempts: {
    isUnlimited: { type: Boolean, default: true },
    count: { type: Number, min: 1, default: undefined }, // per test allowed attempts when limited
  },

  tests: [TestSchema],

  totalTests: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  // New series are saved as drafts until an administrator explicitly publishes
  // them. Legacy records without this field are treated as published by the
  // public controller for backward compatibility.
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED'],
    // Set explicitly by the create controller so legacy records without this
    // field are not hydrated as drafts by Mongoose.
    default: undefined,
    index: true
  },
  publishedAt: { type: Date, default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  meta: { type: mongoose.Schema.Types.Mixed } // For additional metadata
}, { timestamps: true });

// Pre-save middleware to calculate totalTests and totalMarks for tests
TestSeriesSchema.pre('save', function (next) {
  if (typeof this.originalPrice !== 'number') {
    this.originalPrice = this.price;
  }
  if (typeof this.discountedPrice !== 'number') {
    this.discountedPrice = this.price;
  }
  if (this.discountedPrice > this.originalPrice) {
    return next(new Error('Discounted price cannot be greater than original price'));
  }
  this.price = this.discountedPrice > 0 ? this.discountedPrice : this.originalPrice;

  // No isActive field on embedded test; count all tests for now
  this.totalTests = Array.isArray(this.tests) ? this.tests.length : 0;

  // Calculate total marks for each test
  if (Array.isArray(this.tests)) {
    this.tests.forEach(test => {
      if (test.testType === 'OBJECTIVE' && Array.isArray(test.mcqQuestions)) {
        test.totalMarks = test.mcqQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
      } else if (test.testType === 'MIXED') {
        // For mixed tests, calculate objective marks from MCQ questions
        const objectiveMarks = Array.isArray(test.mcqQuestions)
          ? test.mcqQuestions.reduce((sum, q) => sum + (q.marks || 0), 0)
          : 0;
        test.objectiveMarks = objectiveMarks;
        test.totalMarks = objectiveMarks + (test.subjectiveMarks || 0);
      }
      // For SUBJECTIVE tests, totalMarks should be set manually
    });
  }

  next();
});

// Indexes for better performance
TestSeriesSchema.index({ caLevel: 1, isActive: 1 });
TestSeriesSchema.index({ planId: 1 }); // Index for plan filtering
TestSeriesSchema.index({ 'tests.subject': 1 });
TestSeriesSchema.index({ createdBy: 1 });
TestSeriesSchema.index({ status: 1, isActive: 1, createdAt: -1 });
TestSeriesSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('TestSeries', TestSeriesSchema);
