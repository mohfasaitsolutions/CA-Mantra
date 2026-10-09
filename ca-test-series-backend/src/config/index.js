require('dotenv').config();
const mongoose = require('mongoose');

const DEFAULT_MONGODB_URIS = [
  process.env.MONGODB_URI,
  'mongodb://127.0.0.1:27017/cahero',
  'mongodb://localhost:27017/cahero'
].filter(Boolean);

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  let lastError;

  for (const uri of [...new Set(DEFAULT_MONGODB_URIS)]) {
    try {
      await mongoose.connect(uri, {
        autoIndex: true
      });
      console.log(`MongoDB connected using: ${uri}`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB connection failed for ${uri}: ${error.message}`);
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
