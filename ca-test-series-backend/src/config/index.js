require('dotenv').config();
const mongoose = require('mongoose');

// A configured MONGODB_URI is authoritative: a failure to connect is an error, never a
// silent fallback to an empty local database. Local fallbacks only apply when it is unset
// outside production.
if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
  throw new Error('MONGODB_URI must be set in production');
}
const DEFAULT_MONGODB_URIS = process.env.MONGODB_URI
  ? [process.env.MONGODB_URI]
  : ['mongodb://127.0.0.1:27017/cahero', 'mongodb://localhost:27017/cahero'];

const redactUri = (uri) => uri.replace(/\/\/[^@/]+@/, '//***@');

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  let lastError;

  for (const uri of [...new Set(DEFAULT_MONGODB_URIS)]) {
    try {
      await mongoose.connect(uri, {
        autoIndex: true
      });
      console.log(`MongoDB connected using: ${redactUri(uri)}`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB connection failed for ${redactUri(uri)}: ${error.message}`);
    }
  }

  throw lastError || new Error('Failed to connect to MongoDB');
}

// Razorpay configuration
const razorpayKeyId = process.env.RAZORPAY_LIVE_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET;
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  console.warn('Warning: Razorpay credentials not configured');
}

module.exports = { 
  connectDB,
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret
};
