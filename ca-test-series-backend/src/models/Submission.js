const mongoose = require('mongoose');
const Counter = require('./Counter');

// Student's submission for a single test
const SubmissionSchema = new mongoose.Schema({
  submissionNumber: { type: Number, unique: true, index: true }, // Numeric submission ID
  testSeriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries', required: true, index: true },
  testId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true },

  // Evaluation fields
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  status: { type: String, enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED'], default: 'PENDING', index: true },
  totalMarks: { type: Number, default: 0 },
  awardedMarks: { type: Number },
  isPassed: { type: Boolean },
  remarks: { type: String },
  evaluatedAt: { type: Date },
  evaluatedFileUrl: { type: String }, // URL to the evaluated answer sheet uploaded by evaluator

  // Lock fields
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lockedAt: { type: Date },

  // Attachments (e.g., answer sheet PDF/image urls)
  attachments: [{ url: String, label: String }],

  // Student feedback for evaluator
  feedback: {
    rating: { type: Number, min: 1, max: 5 }, // 1-5 star rating
    comment: { type: String },
    feedbackAt: { type: Date }
  },

  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

SubmissionSchema.index({ subject: 1, status: 1 });
SubmissionSchema.index({ evaluatorId: 1, status: 1 });
// Ensure unique submission per student per test (prevents duplicate submissions)
SubmissionSchema.index({ studentId: 1, testSeriesId: 1, testId: 1 }, { unique: true });

// Pre-save hook to generate numeric submission number
SubmissionSchema.pre('save', async function(next) {
  if (this.isNew && !this.submissionNumber) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'submissionNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.submissionNumber = counter.seq;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
