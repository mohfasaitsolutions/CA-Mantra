const Invoice = require('../models/Invoice');

/**
 * Generate invoice data from payment
 */
exports.generateInvoiceData = async (payment, student, testSeries) => {
  // Calculate pricing
  const subtotal = payment.amount;
  const taxRate = 18; // GST 18%
  const taxAmount = Math.round((subtotal * taxRate) / (100 + taxRate) * 100) / 100;
  const amountBeforeTax = Math.round((subtotal - taxAmount) * 100) / 100;

  const invoiceData = {
    paymentId: payment._id,
    studentId: student._id,
    testSeriesId: testSeries._id,
    invoiceDate: new Date(),
    dueDate: new Date(), // Immediate payment
    
    // Customer Details
    customerName: student.fullName || student.email,
    customerEmail: student.email,
    customerPhone: student.mobile || student.phone || '',
    customerAddress: student.address || '',
    
    // Items
    items: [{
      description: testSeries.title,
      quantity: 1,
      unitPrice: amountBeforeTax,
      amount: amountBeforeTax
    }],
    
    // Pricing
    subtotal: amountBeforeTax,
    taxRate: taxRate,
    taxAmount: taxAmount,
    totalAmount: payment.amount,
    currency: payment.currency || 'INR',
    
    // Payment Info
    paymentMethod: payment.paymentMethod || 'Razorpay',
    paymentStatus: 'PAID',
    transactionId: payment.razorpayPaymentId,
    
    metadata: {
      razorpayOrderId: payment.razorpayOrderId,
      testSeriesLevel: testSeries.caLevel
    }
  };

  return invoiceData;
};

/**
 * Create invoice from payment
 */
exports.createInvoice = async (payment, student, testSeries) => {
  const invoiceData = await this.generateInvoiceData(payment, student, testSeries);
  const invoice = await Invoice.create(invoiceData);
  
  // Update payment with invoice reference
  payment.metadata = payment.metadata || {};
  payment.metadata.invoiceId = invoice._id;
  payment.metadata.invoiceNumber = invoice.invoiceNumber;
  await payment.save();
  
  return invoice;
};

/**
 * Generate invoice HTML for email
 */
exports.generateInvoiceHTML = (invoice, brandName = 'CA Mantraa') => {
  const formatCurrency = (amount, currency = 'INR') => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .invoice-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .company-info {
      flex: 1;
    }
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin: 0 0 5px 0;
    }
    .company-tagline {
      color: #666;
      font-size: 14px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
      margin: 0 0 10px 0;
    }
    .invoice-number {
      font-size: 14px;
      color: #666;
    }
    .details-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .bill-to, .invoice-details {
      flex: 1;
    }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      color: #2563eb;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .info-line {
      margin: 5px 0;
      font-size: 14px;
    }
    .info-label {
      color: #666;
      display: inline-block;
      min-width: 120px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .items-table th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #dee2e6;
      font-size: 14px;
    }
    .items-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #dee2e6;
      font-size: 14px;
    }
    .text-right {
      text-align: right;
    }
    .totals-section {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 300px;
    }
    .totals-table tr {
      border-bottom: 1px solid #dee2e6;
    }
    .totals-table td {
      padding: 10px 0;
      font-size: 14px;
    }
    .totals-table .total-row td {
      font-weight: bold;
      font-size: 18px;
      color: #2563eb;
      padding-top: 15px;
      border-top: 2px solid #2563eb;
    }
    .payment-status {
      display: inline-block;
      padding: 6px 16px;
      background: #10b981;
      color: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      text-align: center;
      color: #666;
      font-size: 13px;
    }
    .notes {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13px;
      color: #666;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">${brandName}</div>
        <div class="company-tagline">Empowering CA Aspirants</div>
      </div>
      <div class="invoice-info">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div class="payment-status">${invoice.paymentStatus}</div>
      </div>
    </div>

    <!-- Details Section -->
    <div class="details-section">
      <div class="bill-to">
        <div class="section-title">Bill To</div>
        <div class="info-line"><strong>${invoice.customerName}</strong></div>
        <div class="info-line">${invoice.customerEmail}</div>
        ${invoice.customerPhone ? `<div class="info-line">${invoice.customerPhone}</div>` : ''}
        ${invoice.customerAddress ? `<div class="info-line">${invoice.customerAddress}</div>` : ''}
      </div>
      <div class="invoice-details">
        <div class="section-title">Invoice Details</div>
        <div class="info-line">
          <span class="info-label">Invoice Date:</span>
          <strong>${formatDate(invoice.invoiceDate)}</strong>
        </div>
        <div class="info-line">
          <span class="info-label">Payment Method:</span>
          ${invoice.paymentMethod}
        </div>
        ${invoice.transactionId ? `
        <div class="info-line">
          <span class="info-label">Transaction ID:</span>
          ${invoice.transactionId}
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map(item => `
        <tr>
          <td><strong>${item.description}</strong></td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice, invoice.currency)}</td>
          <td class="text-right">${formatCurrency(item.amount, invoice.currency)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">${formatCurrency(invoice.subtotal, invoice.currency)}</td>
        </tr>
        <tr>
          <td>GST (${invoice.taxRate}%):</td>
          <td class="text-right">${formatCurrency(invoice.taxAmount, invoice.currency)}</td>
        </tr>
        <tr class="total-row">
          <td>Total Amount:</td>
          <td class="text-right">${formatCurrency(invoice.totalAmount, invoice.currency)}</td>
        </tr>
      </table>
    </div>

    <!-- Notes -->
    <div class="notes">
      <strong>Note:</strong> This is a computer-generated invoice and does not require a signature. 
      Thank you for your purchase! You now have access to the test series. 
      For any queries, please contact our support team.
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for choosing ${brandName}!</p>
      <p>This invoice was generated on ${formatDate(new Date())}</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Get invoice by ID (with authorization check)
 */
exports.getInvoiceById = async (invoiceId, studentId) => {
  const invoice = await Invoice.findById(invoiceId)
    .populate('testSeriesId', 'title caLevel')
    .populate('paymentId', 'razorpayPaymentId razorpayOrderId');
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  // Check authorization
  if (invoice.studentId.toString() !== studentId.toString()) {
    throw new Error('Unauthorized access to invoice');
  }
  
  return invoice;
};

/**
 * Get invoices for student with pagination
 */
exports.getStudentInvoices = async (studentId, options = {}) => {
  const { page = 1, limit = 10 } = options;
  
  const invoices = await Invoice.findByStudent(studentId, { page, limit });
  const total = await Invoice.countDocuments({ studentId });
  
  return {
    invoices,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  };
};
