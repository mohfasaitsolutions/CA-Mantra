# Razorpay Automatic Invoice Feature

## Overview

The payment system now uses **Razorpay's native invoice functionality** to automatically generate and send invoices to customers via email after successful payment. This is simpler and more reliable than building a custom invoice system.

## How It Works

### 1. **Payment Verification Flow**
When a payment is successfully verified:
1. Payment is marked as CAPTURED
2. Enrollment is created for the student
3. **Razorpay Invoice is automatically created**
4. **Razorpay sends the invoice to customer's email**
5. Invoice ID and short URL are stored in payment metadata

### 2. **Webhook Backup**
If the invoice wasn't created during payment verification (edge case), the webhook handler will create it when receiving the `payment.captured` event.

## Razorpay Invoice Features

✅ **Automatic Email Delivery** - Razorpay sends professional invoice emails  
✅ **PDF Generation** - Invoices are available as downloadable PDFs  
✅ **Short URL** - Shareable invoice links for customers  
✅ **Professional Design** - Razorpay's branded invoice templates  
✅ **GST Compliant** - Automatically handles GST calculations  
✅ **Payment Status** - Shows paid/unpaid status  

## Configuration

### Enable Invoice Emails in Razorpay Dashboard

1. Login to https://dashboard.razorpay.com/
2. Go to **Settings > Invoice Settings**
3. Enable **Email Notifications**
4. Customize email template (optional)
5. Add your business details (logo, address, GST number)

### Invoice Data Sent to Razorpay

```javascript
{
  customerName: "Student Name",
  customerEmail: "student@example.com",
  customerContact: "+919876543210",
  amount: 999, // In rupees
  description: "Test Series: CA Final Test Series",
  currency: "INR"
}
```

## Invoice Email Content

Razorpay automatically sends an email with:
- Invoice number (auto-generated)
- Invoice date
- Customer details
- Item description (Test Series name)
- Amount breakdown with GST
- Payment status (PAID)
- PDF download link
- Short URL to view online

## Payment Metadata

After invoice creation, the payment record stores:

```javascript
payment.metadata = {
  razorpayInvoiceId: "inv_xxxxx",  // Razorpay invoice ID
  invoiceShortUrl: "https://rzp.io/i/xxxxx", // Shareable invoice link
  razorpayOrderId: "order_xxxxx",
  testSeriesLevel: "FINAL"
}
```

## Accessing Invoices

### For Customers
- Receive invoice via email automatically
- Click PDF download link in email
- Visit short URL to view online

### For Admin
- View in Razorpay Dashboard > Invoices
- Download PDFs from dashboard
- Track invoice status
- Resend invoice emails if needed

## Benefits Over Custom Invoice System

| Feature | Razorpay Invoice | Custom System |
|---------|-----------------|---------------|
| Email Delivery | ✅ Automatic | ❌ Need to build |
| PDF Generation | ✅ Automatic | ❌ Need library |
| GST Compliance | ✅ Built-in | ❌ Manual calc |
| Design | ✅ Professional | ❌ Need to design |
| Maintenance | ✅ No effort | ❌ Ongoing work |
| Reliability | ✅ High | ⚠️ Depends on code |
| Email Deliverability | ✅ High (Razorpay's infra) | ⚠️ May land in spam |

## Testing

### Test Invoice Creation

1. Complete a test payment
2. Check server logs for: "Razorpay invoice created and emailed"
3. Check customer's email inbox
4. Verify invoice received with PDF attachment
5. Click short URL to view invoice online

### Verify in Razorpay Dashboard

1. Go to **Invoices** section
2. Find latest invoice
3. Check status is "Paid"
4. View invoice details
5. Download PDF

## Invoice Settings in Razorpay

### Business Information
- **Business Name**: CA Mantraa
- **Business Logo**: Upload your logo
- **Address**: Your business address
- **GSTIN**: Your GST number (if applicable)
- **Email**: info.camantraa@gmail.com
- **Phone**: Your contact number

### Email Template Customization
- Subject line
- Email body text
- Footer text
- Custom branding colors

## Error Handling

If invoice creation fails:
- Payment verification still succeeds
- Enrollment is still created
- Error is logged but doesn't block the flow
- Webhook will retry invoice creation
- Admin can manually create invoice from Razorpay Dashboard

## Manual Invoice Operations

### Resend Invoice Email
```bash
# Via Razorpay Dashboard
1. Go to Invoices
2. Find the invoice
3. Click "Resend Email"
```

### View Invoice URL
```javascript
// Stored in payment metadata
const invoiceUrl = payment.metadata.invoiceShortUrl;
// Example: https://rzp.io/i/xxxxx
```

## FAQs

### Q: When is the invoice sent?
**A:** Immediately after payment verification, usually within seconds.

### Q: What if customer doesn't receive the email?
**A:** Check spam folder, or admin can resend from Razorpay Dashboard.

### Q: Can we customize the invoice design?
**A:** Yes, through Razorpay Dashboard > Settings > Invoice Settings.

### Q: Is GST included?
**A:** Yes, Razorpay automatically calculates and shows GST (18%).

### Q: Can students download past invoices?
**A:** Yes, they can access via the short URL or from their email.

### Q: Do we need to store invoice PDFs?
**A:** No, Razorpay hosts them. We only store the invoice ID and URL.

## Cost

Razorpay invoice feature is **FREE** - no additional charges beyond standard payment gateway fees.

## Summary

✅ **Fully Automated** - No manual intervention needed  
✅ **Professional** - Razorpay's proven email delivery  
✅ **GST Compliant** - Automatic tax calculations  
✅ **Zero Maintenance** - Razorpay handles everything  
✅ **Reliable** - Built on Razorpay's infrastructure  
✅ **Accessible** - Email + Short URL for customers  

**Result**: Customers automatically receive professional invoices via email after every successful payment, with zero effort from your side! 🎉
