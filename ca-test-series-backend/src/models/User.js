const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const ROLES = require('../constants/roles');
const SUBJECTS = require('../constants/subjects');
const Counter = require('./Counter');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  caLevel: { type: String, enum: ['FOUNDATION','INTERMEDIATE','FINAL'], default: 'FOUNDATION' },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.STUDENTS },
  // Only applicable for Evaluators; a multi-select of subjects they can evaluate
  specializations: [{ type: String, enum: SUBJECTS, index: true }],
  isActive: { type: Boolean, default: true, index: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  mobile: { type: String, trim: true },
  mobileVerified: { type: Boolean, default: false },
  studentNumericId: {
    type: Number,
    unique: true,
    sparse: true,
    min: 100000,
    max: 999999,
    index: true
  },
  address: { type: String, trim: true }, // Keep for backward compatibility
  // Separate address fields for better data integrity
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  dob: { type: Date },
  // Additional evaluator profile fields
  phone: { type: String, trim: true },
  experience: { type: String, trim: true },
  bio: { type: String, trim: true },
  profilePictureUrl: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Helpful indexes
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ studentNumericId: 1 }, { unique: true, sparse: true });

UserSchema.pre('save', async function(next) {
  try {
    if (this.role === ROLES.STUDENTS) {
      const mobile = String(this.mobile || '').trim();
      const shouldValidateMobile = this.isNew || this.isModified('mobile') || this.isModified('role');

      if (shouldValidateMobile) {
        if (!mobile) {
          return next(new Error('Mobile number is required for students'));
        }
        if (!/^[0-9]{10}$/.test(mobile)) {
          return next(new Error('Mobile number must be a valid 10-digit number'));
        }
      }
      if (mobile) {
        this.mobile = mobile;
        this.phone = this.phone || mobile;
      }
      if (!this.studentNumericId) {
        const counter = await Counter.findByIdAndUpdate(
          { _id: 'studentNumericId' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        const nextStudentId = 100000 + (counter.seq - 1);
        if (nextStudentId > 999999) {
          return next(new Error('Student ID limit exhausted'));
        }
        this.studentNumericId = nextStudentId;
      }
    }

    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
