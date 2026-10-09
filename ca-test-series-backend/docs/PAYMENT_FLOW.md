# Payment Flow Documentation

## New Full-Page Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Journey                             │
└─────────────────────────────────────────────────────────────────┘

1. Browse Marketplace
   └─> /buy-now
       │
       ├─ View test series cards
       ├─ Search & filter by CA level
       └─ Click "Buy Now" button
           │
           ▼
2. Navigate to Full-Page Checkout (NEW!)
   └─> /payment/checkout?testSeriesId=xxx
       │
       ├─ Left Panel: Order Summary
       │  ├─ Test series thumbnail
       │  ├─ Title & description
       │  ├─ CA level badge
       │  ├─ Features (tests, validity, attempts)
       │  └─ Security information
       │
       ├─ Right Panel: Price Summary (Sticky)
       │  ├─ Price details
       │  ├─ GST information
       │  ├─ Total amount
       │  ├─ Billing details (auto-filled)
       │  │  ├─ Name: user.fullName
       │  │  ├─ Email: user.email
       │  │  └─ Phone: user.mobile ✨
       │  └─ [Pay ₹XXX] Button
       │
       └─ Click "Pay" Button
           │
           ▼
3. Razorpay Checkout Modal Opens
   └─> Razorpay Gateway
       │
       ├─ Pre-filled Information ✨
       │  ├─ Name: user.fullName
       │  ├─ Email: user.email
       │  └─ Contact: user.mobile
       │
       ├─ User completes payment
       │  ├─ Card / UPI / Net Banking / Wallet
       │  └─ Payment processed
       │
       └─ Payment Success/Failure
           │
           ▼
4. Payment Verification (Backend)
   └─> POST /api/payments/verify
       │
       ├─ Verify Razorpay signature
       ├─ Mark payment as captured
       ├─ Create enrollment
       │
       ├─ Create Razorpay Invoice
       │
       ├─ Send Email to Customer ✨
       │  └─> Payment Success Email
       │      ├─ Test series details
       │      ├─ Amount paid
       │      ├─ Payment ID
       │      └─ [Go to My Courses] button
       │
       └─ Send Email to Admin ✨
           └─> Payment Notification Email
               ├─ Customer name
               ├─ Customer email
               ├─ Customer phone ✨
               ├─ Test series details
               ├─ Amount
               └─ Payment IDs
           │
           ▼
5. Success Redirect
   └─> /student/courses
       │
       └─ Show success toast
           "Payment Successful! Test series added to your courses."
```

## Email Notifications Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Email Notification System                     │
└─────────────────────────────────────────────────────────────────┘

Payment Verified Successfully
    │
    ├─────────────────────────────┬─────────────────────────────┐
    │                             │                             │
    ▼                             ▼                             ▼
Customer Email              Admin Email               Razorpay Invoice
(Custom Template)      (Custom Template)         (Automatic from Razorpay)
    │                             │                             │
    ├─ Greeting                   ├─ Admin notification         ├─ Invoice PDF
    ├─ Order details              ├─ Customer details:          └─ Sent by Razorpay
    │  ├─ Test series             │  ├─ Name
    │  ├─ Amount                  │  ├─ Email
    │  ├─ Payment ID              │  └─ Phone ✨
    │  └─ Date                    ├─ Order details:
    └─ [Go to My Courses]         │  ├─ Test series
                                  │  ├─ CA Level
                                  │  ├─ Amount
                                  │  ├─ Payment ID
                                  │  └─ Order ID
                                  └─ Timestamp
```

## Data Extraction & Prefill

```
┌─────────────────────────────────────────────────────────────────┐
│              User Data Extraction & Prefill ✨                   │
└─────────────────────────────────────────────────────────────────┘

User Profile (MongoDB)
    │
    ├─ fullName: "John Doe"
    ├─ email: "john@example.com"
    ├─ mobile: "9876543210" ✨
    ├─ caLevel: "INTERMEDIATE"
    └─ ... other fields
        │
        ▼
useAuth Hook (Frontend)
    │
    └─ user object available in components
        │
        ▼
Payment Checkout Page
    │
    ├─ Display billing details:
    │  ├─ Name: {user.fullName}
    │  ├─ Email: {user.email}
    │  └─ Phone: {user.mobile} ✨
    │
    └─ Pass to Razorpay:
        prefill: {
          name: user.fullName,
          email: user.email,
          contact: user.mobile ✨
        }
        │
        ▼
Razorpay Checkout
    │
    └─ Auto-fills customer information
       ├─ Faster checkout
       ├─ Better UX
       └─ Fewer errors
```

## Backend Email Processing

```
┌─────────────────────────────────────────────────────────────────┐
│                  Backend Email Processing                        │
└─────────────────────────────────────────────────────────────────┘

Payment Verification Success
    │
    ▼
Fetch User & Test Series from DB
    │
    ├─ User Model:
    │  ├─ fullName
    │  ├─ email
    │  └─ mobile / phone ✨
    │
    └─ Test Series Model:
       ├─ title
       ├─ caLevel
       └─ price
        │
        ▼
Process Emails (Async)
    │
    ├─ sendPaymentSuccessEmailToCustomer()
    │  ├─ Build HTML email with branded template
    │  ├─ Include order details
    │  └─ Send via SMTP (Gmail)
    │
    ├─ sendPaymentNotificationToAdmin()
    │  ├─ Build HTML email with customer info
    │  ├─ Include phone number ✨
    │  └─ Send to admin email
    │
    └─ Error Handling
       └─ Log errors but don't fail payment
```

## Key Improvements Summary

✨ **New Features**
1. Full-page checkout (no more dialog hanging)
2. Auto-extracted phone number prefill
3. Customer payment confirmation email
4. Admin payment notification email with customer details

🎯 **UX Improvements**
1. Professional checkout layout
2. Clear billing information display
3. Security badges for trust
4. Sticky price summary
5. Better mobile responsiveness

📧 **Email Features**
1. Branded HTML templates
2. Comprehensive order details
3. Customer contact information (including phone)
4. CTA buttons for easy navigation
5. Responsive email design

🔒 **Security & Reliability**
1. Proper payment verification
2. Razorpay signature validation
3. Error handling for emails (doesn't fail payment)
4. Webhook support
5. Invoice generation
