# Payment Gateway Security Fix

## Issue
The `/test-series` route was allowing direct purchase without payment by calling a backend API endpoint that created enrollments without payment verification. This was a critical security vulnerability.

## Root Cause
1. **Backend**: `POST /api/students/purchases/:testSeriesId` endpoint was directly creating enrollments without requiring payment
2. **Frontend**: Both `TestSeriesPage.tsx` and `PublicTestSeriesDetail.tsx` were calling `studentsApi.purchaseSeries()` which bypassed the payment gateway

## Security Risk
- Users could purchase any test series for free
- No payment records were created
- No emails were sent
- Revenue loss

## Changes Made

### Backend (ca-test-series-backend)

#### File: `src/controllers/studentController.js`

**Before:**
```javascript
exports.purchaseSeries = async (req, res) => {
  const studentId = req.user.id;
  const { testSeriesId } = req.params;
  // ... validation
  const enr = await Enrollment.create({ studentId, testSeriesId });
  return res.status(201).json({ message: 'Purchased successfully', id: String(enr._id) });
};
```

**After:**
```javascript
exports.purchaseSeries = async (req, res) => {
  return res.status(403).json({ 
    message: 'Direct purchase is not allowed. Please use the payment gateway to purchase test series.',
    requiresPayment: true 
  });
};
```

**Impact**: The endpoint now returns a 403 Forbidden error and requires users to go through the payment gateway.

---

### Frontend (ca-test-series-lms)

#### File: `src/pages/TestSeriesPage.tsx`

**Before:**
```typescript
const buyNow = async (seriesId: string) => {
  if (!isLoggedIn) {
    navigate(`/login?redirect=${encodeURIComponent("/test-series")}`);
    return;
  }
  try {
    await studentsApi.purchaseSeries(seriesId); // ❌ Direct purchase
    toast({ title: "Purchased", description: "Test series added to your courses." });
    navigate("/student/courses");
  } catch (e) {
    // error handling
  }
};
```

**After:**
```typescript
const buyNow = (seriesId: string) => {
  if (!isLoggedIn) {
    navigate(`/login?redirect=${encodeURIComponent("/test-series")}`);
    return;
  }
  
  // Redirect to payment checkout page ✅
  navigate(`/payment/checkout?testSeriesId=${seriesId}`);
};
```

**Impact**: Now redirects to full-page payment checkout instead of direct purchase.

---

#### File: `src/pages/PublicTestSeriesDetail.tsx`

**Before:**
```typescript
const handleBuy = async () => {
  if (!id) return;
  if (!isAuthenticated) {
    navigate(`/login?redirect=${encodeURIComponent(`/test-series/${id}`)}`);
    return;
  }
  try {
    await studentsApi.purchaseSeries(id); // ❌ Direct purchase
    navigate("/student/courses");
  } catch (e) {
    // swallow error
  }
};
```

**After:**
```typescript
const handleBuy = () => {
  if (!id) return;
  if (!isAuthenticated) {
    navigate(`/login?redirect=${encodeURIComponent(`/test-series/${id}`)}`);
    return;
  }
  // Redirect to payment checkout page ✅
  navigate(`/payment/checkout?testSeriesId=${id}`);
};
```

**Impact**: Now redirects to full-page payment checkout instead of direct purchase.

---

## Security Verification

### ✅ All Purchase Routes Now Require Payment

1. **Payment Gateway Route (Only Valid Route)**
   ```
   POST /api/payments/create-order → Creates Razorpay order
   POST /api/payments/verify → Verifies payment & creates enrollment
   ```

2. **Blocked Route**
   ```
   POST /api/students/purchases/:testSeriesId → Returns 403 Forbidden
   ```

3. **Enrollment Creation**
   - Only happens in `paymentController.js` after payment verification
   - Requires valid Razorpay signature
   - Payment record must exist

### ✅ Frontend Routes Secured

All frontend routes now redirect to payment checkout:
- `/test-series` → Buy button → `/payment/checkout?testSeriesId=xxx`
- `/test-series/:id` → Buy button → `/payment/checkout?testSeriesId=xxx`
- `/buy-now` → Buy button → `/payment/checkout?testSeriesId=xxx`

---

## Testing Checklist

### Manual Testing

1. **Test Direct Purchase (Should Fail)**
   ```bash
   # Try to purchase without payment (should get 403)
   curl -X POST https://api.camantraa.com/api/students/purchases/{testSeriesId} \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json"
   
   # Expected: 403 Forbidden with message about payment required
   ```

2. **Test Payment Flow (Should Work)**
   - Go to https://camantraa.com/test-series
   - Click "Buy Now" on any test series
   - Should redirect to `/payment/checkout?testSeriesId=xxx`
   - Should show full-page checkout
   - Click "Pay" button
   - Razorpay modal should open
   - Complete payment
   - Should create enrollment after successful payment

3. **Verify Enrollment Creation**
   ```javascript
   // Check MongoDB
   db.enrollments.find({ studentId: ObjectId("...") })
   // Should only show enrollments with corresponding payment records
   
   // Check payments
   db.payments.find({ studentId: ObjectId("..."), status: "CAPTURED" })
   ```

### Security Testing

1. **Attempt to bypass payment**
   - Try POST to `/api/students/purchases/:testSeriesId`
   - Expected: 403 Forbidden
   - No enrollment should be created

2. **Verify payment verification**
   - Try to access enrolled content without payment
   - Expected: No access
   - Check that enrollment only exists after successful payment

3. **Check database consistency**
   ```javascript
   // Every enrollment should have a corresponding payment
   db.enrollments.aggregate([
     {
       $lookup: {
         from: "payments",
         let: { studentId: "$studentId", testSeriesId: "$testSeriesId" },
         pipeline: [
           {
             $match: {
               $expr: {
                 $and: [
                   { $eq: ["$studentId", "$$studentId"] },
                   { $eq: ["$testSeriesId", "$$testSeriesId"] },
                   { $eq: ["$status", "CAPTURED"] }
                 ]
               }
             }
           }
         ],
         as: "payment"
       }
     },
     {
       $match: { payment: { $size: 0 } }
     }
   ])
   // Should return empty array (no enrollments without payment)
   ```

---

## Deployment Steps

### Backend Deployment

1. **Deploy updated controller**
   ```bash
   cd ca-test-series-backend
   git pull
   pm2 restart all
   ```

2. **Verify deployment**
   ```bash
   # Check logs
   pm2 logs
   
   # Test the blocked endpoint
   curl -X POST https://api.camantraa.com/api/students/purchases/test123 \
     -H "Authorization: Bearer {token}"
   # Should return 403
   ```

### Frontend Deployment

1. **Build and deploy**
   ```bash
   cd ca-test-series-lms
   npm run build
   scp -i camantraaF.pem -r ./dist/* ubuntu@13.203.67.107:/var/www/camantraa/dist/
   ```

2. **Clear browser cache**
   - Users should clear cache or do hard refresh
   - Old cached JavaScript might still call the old API

3. **Verify deployment**
   - Visit https://camantraa.com/test-series
   - Click "Buy Now"
   - Should redirect to payment checkout page
   - Complete flow should work

---

## Rollback Plan

If issues occur, here's how to rollback:

### Backend Rollback
```bash
cd ca-test-series-backend
git revert HEAD
pm2 restart all
```

### Frontend Rollback
```bash
cd ca-test-series-lms
git revert HEAD
npm run build
scp -i camantraaF.pem -r ./dist/* ubuntu@13.203.67.107:/var/www/camantraa/dist/
```

---

## Post-Deployment Monitoring

### Check for Errors

1. **Monitor backend logs**
   ```bash
   pm2 logs --lines 100
   ```

2. **Check for 403 errors** (users trying direct purchase)
   ```bash
   grep "403" /var/log/nginx/access.log | grep "purchases"
   ```

3. **Monitor payment success rate**
   ```javascript
   // Check successful payments in last hour
   db.payments.countDocuments({
     createdAt: { $gte: new Date(Date.now() - 3600000) },
     status: "CAPTURED"
   })
   ```

4. **Check for failed enrollments**
   ```javascript
   // Check for payments without enrollments (should be 0)
   db.payments.aggregate([
     { $match: { status: "CAPTURED", enrollmentId: { $exists: false } } }
   ])
   ```

---

## Summary

### ✅ Security Fixed
- Direct purchase endpoint now returns 403 Forbidden
- All purchases must go through payment gateway
- Razorpay payment verification required
- Email notifications sent after payment

### ✅ User Experience
- Full-page checkout instead of hanging modal
- Clear payment flow
- User details pre-filled
- Better mobile experience

### ✅ Business Impact
- No revenue loss from free purchases
- All transactions tracked
- Payment records maintained
- Admin notifications working

---

## Files Modified

### Backend
- ✅ `src/controllers/studentController.js` - Blocked direct purchase endpoint

### Frontend
- ✅ `src/pages/TestSeriesPage.tsx` - Redirect to payment checkout
- ✅ `src/pages/PublicTestSeriesDetail.tsx` - Redirect to payment checkout

### Documentation
- 📄 `PAYMENT_SECURITY_FIX.md` (this file)

---

## Contact

If you encounter any issues after deployment:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify database state
4. Contact dev team for support
