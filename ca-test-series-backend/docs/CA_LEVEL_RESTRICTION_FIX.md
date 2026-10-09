# CA Level Purchase Restriction Fix

## Problem
Students enrolled in FOUNDATION level were able to purchase and enroll in FINAL or INTERMEDIATE level test series, which should be restricted based on their CA level.

## Solution Implemented

### Backend Validation Added

CA Level matching validation has been added at multiple checkpoints to ensure students can only purchase test series appropriate for their enrolled level.

## Changes Made

### 1. Payment Controller (`src/controllers/paymentController.js`)

#### A. `createOrder` Function
Added CA level validation before creating payment order:

```javascript
// Get student details to check CA level
const student = await User.findById(studentId);

// Validate CA Level match
if (testSeries.caLevel !== 'ALL' && testSeries.caLevel !== student.caLevel) {
  return res.status(403).json({ 
    message: `You cannot purchase this test series. This is a ${testSeries.caLevel} level test series, but you are enrolled in ${student.caLevel} level.`,
    studentLevel: student.caLevel,
    testSeriesLevel: testSeries.caLevel
  });
}
```

**When:** Before creating Razorpay order
**Prevents:** Students from initiating payment for mismatched CA levels

#### B. `verifyPayment` Function
Added CA level validation before creating enrollment:

```javascript
// Get student and test series for CA level validation
const student = await User.findById(payment.studentId);
const testSeries = await TestSeries.findById(payment.testSeriesId);

// Validate CA Level match - prevent enrollment if levels don't match
if (testSeries.caLevel !== 'ALL' && testSeries.caLevel !== student.caLevel) {
  await payment.markAsFailed('CA_LEVEL_MISMATCH', `CA level mismatch: Student ${student.caLevel}, Test Series ${testSeries.caLevel}`);
  return res.status(403).json({ 
    message: `Payment cannot be processed. This is a ${testSeries.caLevel} level test series, but you are enrolled in ${student.caLevel} level.`,
    studentLevel: student.caLevel,
    testSeriesLevel: testSeries.caLevel
  });
}
```

**When:** After payment verification, before enrollment creation
**Prevents:** Enrollment even if payment somehow went through for mismatched levels
**Security:** Double-layer protection against bypassing client-side restrictions

### 2. Cart Controller (`src/controllers/cartController.js`)

#### `addToCart` Function
Added CA level validation before adding items to cart:

```javascript
// Get student details to check CA level
const student = await User.findById(req.user.id);

// Validate CA Level match
if (testSeries.caLevel !== 'ALL' && testSeries.caLevel !== student.caLevel) {
  return res.status(403).json({ 
    error: `You cannot add this test series to your cart. This is a ${testSeries.caLevel} level test series, but you are enrolled in ${student.caLevel} level.`,
    studentLevel: student.caLevel,
    testSeriesLevel: testSeries.caLevel
  });
}
```

**When:** Before adding test series to shopping cart
**Prevents:** Students from even adding mismatched test series to their cart

## Validation Rules

### CA Level Matching Logic

| Student Level | Can Purchase | Cannot Purchase |
|--------------|-------------|-----------------|
| FOUNDATION   | FOUNDATION, ALL | INTERMEDIATE, FINAL |
| INTERMEDIATE | INTERMEDIATE, ALL | FOUNDATION, FINAL |
| FINAL        | FINAL, ALL | FOUNDATION, INTERMEDIATE |

**Special Case:** Test series with `caLevel: 'ALL'` can be purchased by students of any level.

## Security Benefits

✅ **Multi-layer Protection** - Validation at cart, order creation, and payment verification  
✅ **Clear Error Messages** - Users know exactly why they can't purchase  
✅ **Payment Protection** - Failed payments are properly marked with reason  
✅ **Backend Enforcement** - Cannot be bypassed by client-side manipulation  
✅ **Audit Trail** - Failed payments logged with CA_LEVEL_MISMATCH reason  

## API Response Examples

### Success (Matching Levels)
```json
{
  "orderId": "order_xyz123",
  "amount": 1999,
  "currency": "INR",
  "testSeriesId": "...",
  "testSeriesTitle": "Foundation Test Series"
}
```

### Error (Mismatched Levels)
```json
{
  "message": "You cannot purchase this test series. This is a FINAL level test series, but you are enrolled in FOUNDATION level.",
  "studentLevel": "FOUNDATION",
  "testSeriesLevel": "FINAL"
}
```

## Testing Scenarios

### Test Case 1: Foundation Student + Foundation Test Series
- **Expected:** ✅ Success - Order created

### Test Case 2: Foundation Student + Final Test Series
- **Expected:** ❌ Error 403 - CA level mismatch

### Test Case 3: Any Student + ALL Level Test Series
- **Expected:** ✅ Success - Order created

### Test Case 4: Intermediate Student + Foundation Test Series
- **Expected:** ❌ Error 403 - CA level mismatch

## Files Modified

1. **src/controllers/paymentController.js**
   - Added User model import
   - Added CA level validation in `createOrder()`
   - Added CA level validation in `verifyPayment()`
   - Optimized to reuse student/testSeries queries

2. **src/controllers/cartController.js**
   - Added User model import
   - Added CA level validation in `addToCart()`

## Technical Notes

- **Backward Compatible:** Existing enrollments are not affected
- **Database:** No schema changes required
- **Performance:** Minimal impact (1 additional User query per operation)
- **Error Handling:** Proper HTTP status codes (403 Forbidden)
- **Logging:** Failed payments logged with CA_LEVEL_MISMATCH reason

## Future Enhancements

Consider implementing:
- Frontend validation to hide/disable unavailable test series
- Filtering test series by student CA level in listing APIs
- Admin override capability for special cases
- Progressive CA level unlocking (students can upgrade)
