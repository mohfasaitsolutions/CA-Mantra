const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendSetPasswordEmail } = require('../services/emailService');
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
  if (![ROLES.ADMIN, ROLES.EVALUATOR].includes(role)) return res.status(400).json({ message: 'Invalid role' });
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

exports.listUsers = async (req,res) => {
  const users = await User.find().select('fullName email role caLevel createdAt specializations isActive');
  res.json(users);
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
