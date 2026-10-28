const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendSetPasswordEmail, sendVerificationEmail } = require('../services/emailService');
const User = require('../models/User');
const ROLES = require('../constants/roles');

exports.getProfile = async (req,res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

exports.updateProfile = async (req,res) => {
  const allowed = ['fullName','mobile','address','dob','caLevel','meta'];
  const updates = {};
  for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
  
  // Auto-verify mobile when it's provided in profile update
  if (updates.mobile) {
    updates.mobileVerified = true;
  }
  
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
  res.json(user);
};

exports.sendMobileOTP = async (req,res) => {
  const user = await User.findById(req.user.id);
  if (!user.mobile) return res.status(400).json({ message: 'Mobile number not set' });
  
  // Dummy OTP implementation - always sends 123456
  console.log(`Sending OTP 123456 to ${user.mobile} for user ${user.email}`);
  
  res.json({ message: 'OTP sent to your mobile number' });
};

exports.verifyMobileOTP = async (req,res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user.id);
  
  if (!user.mobile) return res.status(400).json({ message: 'Mobile number not set' });
  if (otp !== '123456') return res.status(400).json({ message: 'Invalid OTP' });
  
  user.mobileVerified = true;
  await user.save();
  
  res.json({ message: 'Mobile number verified successfully' });
};

exports.adminCreateUser = async (req,res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { fullName, email, password, caLevel, role, specializations } = req.body;
  if (![ROLES.ADMIN, ROLES.EVALUATOR, ROLES.COURSE_UPLOADER].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email exists' });
  const payload = { fullName, email, password, caLevel, role, emailVerified: false };
  if (role === ROLES.EVALUATOR) payload.specializations = specializations || [];
  // Generate a one-time token to set password (uses the same reset flow)
  payload.resetPasswordToken = crypto.randomBytes(32).toString('hex');
  payload.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h
  // Also require email verification
  payload.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  payload.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const user = await User.create(payload);
  // Fire-and-forget emails: set-password + verification
  Promise.allSettled([
    sendSetPasswordEmail(user, user.resetPasswordToken),
  ]).catch(console.error);
  // If evaluator or admin-created user, send verification as well
  const { sendVerificationEmail } = require('../services/emailService');
  sendVerificationEmail(user, user.emailVerificationToken).catch(console.error);
  res.status(201).json({ id: user._id, email: user.email, role: user.role, specializations: user.specializations });
};

// Staff roles these admin endpoints may act on. Students are deliberately
// excluded: they are managed through /admin/students, which has its own rules.
const STAFF_ROLES = [ROLES.ADMIN, ROLES.EVALUATOR, ROLES.COURSE_UPLOADER];

// Columns a client may sort by. Allow-listed so an arbitrary query value can
// never reach the sort specification.
const SORTABLE_FIELDS = ['fullName', 'email', 'role', 'isActive', 'emailVerified', 'createdAt'];

// Escape user input before it becomes a RegExp, so characters like ( or * are
// matched literally instead of changing the pattern or blowing up.
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.listUsers = async (req,res) => {
  const { role, q, active, page, limit, sortBy, sortDir } = req.query;

  const match = {};
  if (role) {
    const wanted = String(role).toUpperCase();
    if (!Object.values(ROLES).includes(wanted)) return res.status(400).json({ message: 'Invalid role' });
    match.role = wanted;
  }
  if (active === 'true') match.isActive = true;
  if (active === 'false') match.isActive = false;
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).trim()), 'i');
    match.$or = [{ fullName: rx }, { email: rx }];
  }

  const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };
  // Tie-break on _id so paging is stable when the sort column has duplicates.
  if (sortField !== 'createdAt') sort._id = -1;

  const projection = 'fullName email role caLevel createdAt specializations isActive emailVerified';
  const query = User.find(match).select(projection).sort(sort);

  // No paging params: return a plain array, as this endpoint always has.
  if (page === undefined && limit === undefined) {
    return res.json(await query);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const [data, total] = await Promise.all([
    query.skip((pageNum - 1) * perPage).limit(perPage),
    User.countDocuments(match)
  ]);
  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  res.json({
    data,
    pagination: {
      page: pageNum,
      limit: perPage,
      total,
      totalPages,
      hasPrev: pageNum > 1,
      hasNext: pageNum < totalPages
    }
  });
};

// Admin: activate/deactivate a staff user
exports.toggleStaffStatus = async (req,res) => {
  const { id } = req.params;
  if (String(id) === String(req.user.id)) {
    return res.status(400).json({ message: 'You cannot change your own status' });
  }
  const user = await User.findOne({ _id: id, role: { $in: STAFF_ROLES } });
  if (!user) return res.status(404).json({ message: 'Staff user not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ id: user._id, isActive: user.isActive });
};

// Admin: resend the email-verification link to a staff user
exports.resendStaffVerification = async (req,res) => {
  const { id } = req.params;
  const user = await User.findOne({ _id: id, role: { $in: STAFF_ROLES } });
  if (!user) return res.status(404).json({ message: 'Staff user not found' });
  if (user.emailVerified) return res.json({ message: 'Already verified' });
  const token = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await user.save();
  sendVerificationEmail(user, token).catch(console.error);
  res.json({ message: 'Verification email resent' });
};

// Admin: resend the set-password invite to a staff user
exports.resendStaffInvite = async (req,res) => {
  const { id } = req.params;
  const user = await User.findOne({ _id: id, role: { $in: STAFF_ROLES } });
  if (!user) return res.status(404).json({ message: 'Staff user not found' });
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);
  await user.save();
  sendSetPasswordEmail(user, token).catch(console.error);
  res.json({ message: 'Invite resent' });
};

// Upload profile picture for any user
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { compressAndSaveProfilePicture, getFileUrl, deleteFile } = require('../utils/fileUpload');
    
    // Get current user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile picture if exists
    if (user.profilePictureUrl) {
      try {
        // Extract the relative path from the URL
        const urlParts = user.profilePictureUrl.split('/uploads/');
        if (urlParts.length > 1) {
          const relativePath = urlParts[1];
          const fullOldPath = require('path').join(__dirname, '../../storage', relativePath);
          deleteFile(fullOldPath);
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Compress and save new profile picture
    const filePath = await compressAndSaveProfilePicture(
      req.file.buffer, 
      req.user.id, 
      'user'
    );

    // Update user with new profile picture URL
    const profilePictureUrl = getFileUrl(req, filePath);
    user.profilePictureUrl = profilePictureUrl;
    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePictureUrl
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ 
      message: 'Failed to upload profile picture',
      error: error.message 
    });
  }
};
