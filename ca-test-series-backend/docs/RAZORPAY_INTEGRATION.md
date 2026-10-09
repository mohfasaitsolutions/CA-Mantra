# Razorpay Payment Integration

## Overview
This document describes the complete Razorpay payment integration for test series purchases in the CA Mantraa platform.

## Architecture

### Backend Components

1. **Payment Model** (`src/models/Payment.js`)
   - Tracks all payment transactions
   - Stores Razorpay order and payment details
   - Maintains payment status and verification state
   - Links to Enrollment after successful payment

2. **Razorpay Service** (`src/services/razorpayService.js`)
   - Handles Razorpay SDK operations
   - Creates orders
   - Verifies payment signatures
   - Processes refunds
   - Validates webhook signatures

3. **Payment Controller** (`src/controllers/paymentController.js`)
   - **POST /api/payments/create-order**: Creates Razorpay order
   - **POST /api/payments/verify**: Verifies payment and creates enrollment
   - **POST /api/payments/webhook**: Handles Razorpay webhook events
   - **GET /api/payments/:paymentId**: Gets payment details
   - **GET /api/payments/history**: Gets payment history

4. **Payment Routes** (`src/routes/paymentRoutes.js`)
   - Defines all payment-related routes
   - Applies authentication and validation middleware
   - Separates webhook route (no auth required)

### Frontend Components

1. **Payment API Client** (`src/lib/api/payment.ts`)
   - TypeScript API client for payment endpoints
   - Type-safe request/response handling

2. **BuySummary Component** (`src/components/shared/BuySummary.tsx`)
   - Dialog component showing order summary
   - Displays test series details and pricing
   - Initiates Razorpay checkout
   - Handles payment success/failure

3. **useRazorpay Hook** (`src/hooks/use-razorpay.ts`)
   - Dynamically loads Razorpay checkout script
   - Tracks loading state
   - Handles errors

## Payment Flow

### 1. User Initiates Purchase
- User clicks "Buy Now" on a test series
- System checks if user is logged in
- BuySummary dialog opens showing order details

### 2. Order Creation
- Frontend calls `POST /api/payments/create-order` with testSeriesId
- Backend validates test series exists and is active
- Backend checks for existing enrollment (prevents duplicates)
- Backend creates Razorpay order via Razorpay API
- Backend saves Payment record with status 'CREATED'
- Backend returns order details to frontend

### 3. Razorpay Checkout
- Frontend initializes Razorpay checkout with order ID
- User completes payment on Razorpay modal
- Razorpay returns payment details (order_id, payment_id, signature)

### 4. Payment Verification
- Frontend calls `POST /api/payments/verify` with Razorpay response
- Backend verifies signature using Razorpay secret
- Backend fetches payment details from Razorpay API
- Backend updates Payment record with status 'CAPTURED'
- Backend creates Enrollment record
- Backend links enrollment to payment
- Backend returns success response

### 5. Post-Payment
- Frontend shows success message
- User is redirected to "My Courses" page
- Enrollment is now active and user can access tests

## Webhook Integration

Razorpay sends webhook events for payment status changes:

### Endpoint
`POST /api/payments/webhook`

### Supported Events
- `payment.authorized`: Payment authorized (for manual capture)
- `payment.captured`: Payment successfully captured
- `payment.failed`: Payment failed
- `order.paid`: Order marked as paid

### Webhook Security
- Signature verification using webhook secret
- Only processes authenticated webhooks
- Idempotent handling (prevents duplicate enrollments)

## Configuration

### Backend Environment Variables
```env
RAZORPAY_LIVE_KEY_ID=rzp_live_xxxxx
RAZORPAY_LIVE_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

### Frontend Environment Variables
```env
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

## Security Features

1. **Signature Verification**
   - All payments verified using HMAC SHA256 signature
   - Webhook signatures verified before processing

2. **Idempotency**
   - Duplicate payment verifications handled gracefully
   - Prevents multiple enrollments for same payment

3. **Authorization**
   - Student ID verified in payment verification
   - Only payment owner can view payment details

4. **Error Handling**
   - Comprehensive error tracking in Payment model
   - Failed payments logged with error details
   - User-friendly error messages

## Testing

### Test Payment Flow

1. **Create Order**
```bash
curl -X POST https://api.camantraa.com/api/payments/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"testSeriesId": "test_series_id"}'
```

2. **Verify Payment**
```bash
curl -X POST https://api.camantraa.com/api/payments/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xxxxx",
    "razorpay_payment_id": "pay_xxxxx",
    "razorpay_signature": "signature_xxxxx"
  }'
```

3. **Get Payment History**
```bash
curl -X GET https://api.camantraa.com/api/payments/history \
  -H "Authorization: Bearer <token>"
```

## Razorpay Dashboard Setup

1. **API Keys**
   - Generate API keys from Settings > API Keys
   - Use live keys for production

2. **Webhook Configuration**
   - Go to Settings > Webhooks
   - Add webhook URL: `https://api.camantraa.com/api/payments/webhook`
   - Select events: payment.authorized, payment.captured, payment.failed, order.paid
   - Generate webhook secret
   - Add secret to backend .env

3. **Payment Methods**
   - Enable desired payment methods (Cards, UPI, Netbanking, Wallets)
   - Configure EMI options if needed

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 400 | Invalid request | Check request parameters |
| 401 | Unauthorized | User not logged in |
| 403 | Forbidden | User doesn't own this payment |
| 404 | Payment/Order not found | Invalid payment/order ID |
| 409 | Already purchased | Test series already enrolled |
| 500 | Server error | Contact support |

## Support

For payment-related issues:
1. Check payment status in Payment History
2. Verify webhook configuration in Razorpay Dashboard
3. Check server logs for detailed error messages
4. Contact Razorpay support for payment gateway issues

## Future Enhancements

- [ ] Support for discount coupons
- [ ] Partial refunds
- [ ] Split payments
- [ ] International payments (multi-currency)
- [ ] Subscription-based pricing
- [ ] Payment link generation
- [ ] Invoice generation
- [ ] GST handling
