const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config');

// Validate Razorpay credentials
if (!config.razorpayKeyId || !config.razorpayKeySecret) {
  console.error('CRITICAL: Razorpay credentials missing!');
  console.error('RAZORPAY_LIVE_KEY_ID:', config.razorpayKeyId ? 'Set' : 'Missing');
  console.error('RAZORPAY_LIVE_KEY_SECRET:', config.razorpayKeySecret ? 'Set' : 'Missing');
  throw new Error('Razorpay credentials are not configured. Please check environment variables.');
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: config.razorpayKeyId,
  key_secret: config.razorpayKeySecret
});

console.log('✅ Razorpay initialized successfully');

/**
 * Create a Razorpay order with invoice
 * @param {Object} options - Order options
 * @param {number} options.amount - Amount in INR (will be converted to paise)
 * @param {string} options.currency - Currency code (default: INR)
 * @param {string} options.receipt - Receipt ID for reference
 * @param {Object} options.notes - Additional notes
 * @param {Object} options.customer - Customer details for invoice (email, name, contact)
 * @returns {Promise<Object>} Razorpay order object
 */
exports.createOrder = async ({ amount, currency = 'INR', receipt, notes = {}, customer = {} }) => {
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const orderData = {
      amount: amountInPaise,
      currency,
      receipt,
      notes,
      payment_capture: 1 // Auto capture payment
    };

    // Add customer details if provided (Razorpay will send invoice automatically)
    if (customer.email) {
      orderData.customer_id = customer.customer_id; // If you have existing customer ID
      orderData.notes = {
        ...notes,
        customer_email: customer.email,
        customer_name: customer.name || '',
        customer_contact: customer.contact || ''
      };
    }

    console.log('Creating Razorpay order with data:', {
      amount: amountInPaise,
      currency,
      receipt
    });

    const order = await razorpay.orders.create(orderData);

    console.log('Razorpay order created successfully:', order.id);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    
    // Handle Razorpay specific errors
    if (error.error) {
      const razorpayError = error.error;
      console.error('Razorpay Error Details:', {
        code: razorpayError.code,
        description: razorpayError.description,
        reason: razorpayError.reason,
        statusCode: error.statusCode
      });
      throw new Error(`Razorpay Error: ${razorpayError.description || razorpayError.code}`);
    }
    
    throw new Error(`Failed to create Razorpay order: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Whether signature is valid
 */
exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
exports.fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay fetch payment error:', error);
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
};

/**
 * Fetch order details from Razorpay
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<Object>} Order details
 */
exports.fetchOrder = async (orderId) => {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Razorpay fetch order error:', error);
    throw new Error(`Failed to fetch order: ${error.message}`);
  }
};

/**
 * Create Razorpay Invoice (for automatic invoice generation and email)
 * @param {Object} options - Invoice options
 * @param {string} options.customerId - Razorpay customer ID (optional, will create if not exists)
 * @param {string} options.customerName - Customer name
 * @param {string} options.customerEmail - Customer email
 * @param {string} options.customerContact - Customer phone
 * @param {number} options.amount - Amount in INR
 * @param {string} options.description - Invoice description
 * @param {string} options.currency - Currency (default: INR)
 * @returns {Promise<Object>} Razorpay invoice object
 */
exports.createInvoice = async ({
  customerId = null,
  customerName,
  customerEmail,
  customerContact,
  amount,
  description,
  currency = 'INR'
}) => {
  try {
    // Create or get customer
    let customer;
    if (!customerId) {
      customer = await razorpay.customers.create({
        name: customerName,
        email: customerEmail,
        contact: customerContact,
        fail_existing: 0 // Don't fail if customer exists, return existing
      });
      customerId = customer.id;
    }

    // Create invoice
    const invoice = await razorpay.invoices.create({
      type: 'invoice',
      description: description,
      customer_id: customerId,
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      email_notify: 1, // Automatically send email
      sms_notify: 0, // Don't send SMS
      expire_by: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
    });

    return invoice;
  } catch (error) {
    console.error('Razorpay invoice creation error:', error);
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
};

/**
 * Fetch invoice details
 * @param {string} invoiceId - Razorpay invoice ID
 * @returns {Promise<Object>} Invoice details
 */
exports.fetchInvoice = async (invoiceId) => {
  try {
    const invoice = await razorpay.invoices.fetch(invoiceId);
    return invoice;
  } catch (error) {
    console.error('Razorpay fetch invoice error:', error);
    throw new Error(`Failed to fetch invoice: ${error.message}`);
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in INR (optional, full refund if not provided)
 * @returns {Promise<Object>} Refund details
 */
exports.refundPayment = async (paymentId, amount = null) => {
  try {
    const refundData = {};
    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundData);
    return refund;
  } catch (error) {
    console.error('Razorpay refund error:', error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Verify webhook signature
 * @param {string} body - Raw webhook body
 * @param {string} signature - Razorpay webhook signature from header
 * @param {string} webhookSecret - Webhook secret (optional)
 * @returns {boolean} Whether webhook is authentic
 */
exports.verifyWebhookSignature = (body, signature, webhookSecret = null) => {
  try {
    const secret = webhookSecret || config.razorpayWebhookSecret;
    if (!secret) {
      console.warn('Webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

module.exports.razorpay = razorpay;
