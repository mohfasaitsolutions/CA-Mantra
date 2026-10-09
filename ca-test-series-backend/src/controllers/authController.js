const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { signJwt } = require('../utils/token');
const { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } = require('../services/emailService');
const ROLES = require('../constants/roles');

exports.signup = async (req,res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
  const { fullName, email, password, caLevel, mobile } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      if (!existing.emailVerified) {
        // regenerate token (always) to avoid confusion with stale ones
        const newToken = crypto.randomBytes(32).toString('hex');
        existing.emailVerificationToken = newToken;
        existing.emailVerificationExpires = new Date(Date.now()+1000*60*60*24);
        await existing.save();
        sendVerificationEmail(existing, newToken).catch(console.error);
        return res.status(200).json({ message: 'Email not verified. Verification email resent.' });
      }
      return res.status(409).json({ message: 'Email already registered' });
    }
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    fullName,
    email,
    password,
    mobile,
    phone: mobile,
    caLevel: caLevel || 'FOUNDATION',
    isActive: true,
    emailVerificationToken,
    emailVerificationExpires: new Date(Date.now()+1000*60*60*24)
  });
  sendVerificationEmail(user, emailVerificationToken).catch(console.error);
  // Optional: Welcome email right away (some products send after verify). We send now for visibility.
  sendWelcomeEmail(user).catch(console.error);
    res.status(201).json({ message: 'Signup successful. Please verify email.' });
  } catch (e) {
    console.error(e);
    if (e?.message && /Mobile number|Student ID limit/.test(e.message)) {
      return res.status(400).json({ message: e.message });
    }
    res.status(500).json({ message: 'Internal error' });
  }
};

exports.verifyEmail = async (req,res) => {
  const { token } = req.query;
  const successRedirect = process.env.POST_VERIFY_REDIRECT_URL || 'http://localhost:8080/login';
  const failRedirect = process.env.POST_VERIFY_REDIRECT_FAIL_URL || successRedirect;
  if (!token) {
    // fallback: redirect with error
    return res.redirect(failRedirect + '?verified=0&reason=missing_token');
  }
  try {
    const user = await User.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: new Date() } });
    if (!user) return res.redirect(failRedirect + '?verified=0&reason=invalid_or_expired');
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    return res.redirect(successRedirect + '?verified=1');
  } catch (e) {
    console.error(e);
    return res.redirect(failRedirect + '?verified=0&reason=server_error');
  }
};

exports.signin = async (req,res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  if (!user.emailVerified) return res.status(403).json({ message: 'Email not verified' });
  const token = signJwt({ id: user._id, email: user.email, role: user.role });
  res.json({ token, user: { id: user._id, studentId: user.studentNumericId, fullName: user.fullName, email: user.email, role: user.role, caLevel: user.caLevel, mobile: user.mobile } });
};

exports.requestPasswordReset = async (req,res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: 'If account exists, email sent' });
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now()+1000*60*60); // 1h
  await user.save();
  sendResetPasswordEmail(user, token).catch(console.error);
  res.json({ message: 'If account exists, email sent' });
};

exports.resetPassword = async (req,res) => {
  const { token, password } = req.body;
  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated' });
};

// Change password for an authenticated user
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const match = await user.comparePassword(currentPassword);
  if (!match) return res.status(401).json({ message: 'Current password is incorrect' });
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password changed successfully' });
};

exports.resendVerification = async (req,res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Not found' });
  if (user.emailVerified) return res.json({ message: 'Already verified' });
  const token = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now()+1000*60*60*24);
  await user.save();
  sendVerificationEmail(user, token).catch(console.error);
  res.json({ message: 'Verification email sent' });
};

// Evaluator specific login
exports.evaluatorSignin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: ROLES.EVALUATOR });
  
  if (!user) return res.status(401).json({ message: 'Invalid credentials or not an evaluator' });
  
  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  
  if (!user.emailVerified) return res.status(403).json({ message: 'Email not verified' });
  
  if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });
  
  const token = signJwt({ id: user._id, email: user.email, role: user.role });
  
  res.json({ 
    token, 
    user: { 
      id: user._id, 
      fullName: user.fullName, 
      email: user.email, 
      role: user.role, 
      caLevel: user.caLevel,
      specializations: user.specializations,
      isActive: user.isActive
    } 
  });
};
