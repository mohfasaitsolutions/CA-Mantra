# 🚀 Server Deployment Guide

## Issue Fixed
✅ **Receipt length exceeded** - Razorpay requires receipt to be max 40 characters
- Changed from: `${Date.now()}-${studentId}-${testSeriesId}` (too long)
- Changed to: `TS-${timestamp}-${random}` (max 25 chars)

## Deploy to Server

### 1. Push changes to Git
```bash
cd /Users/manavgenius/Desktop/CA/ca-test-series-backend
git add .
git commit -m "fix: Razorpay receipt length and improve error handling"
git push origin main
```

### 2. SSH to Server
```bash
ssh -i camantraaF.pem ubuntu@13.203.67.107
```

### 3. Pull latest changes
```bash
cd /home/ubuntu/ca-test-series-backend
git pull origin main
```

### 4. Install dependencies (if new packages)
```bash
npm install
```

### 5. Restart PM2
```bash
pm2 restart camantraa-api
```

### 6. Check logs
```bash
pm2 logs camantraa-api --lines 50
```

### 7. Verify Razorpay Config
```bash
cd /home/ubuntu/ca-test-series-backend
cat .env | grep RAZORPAY
```

Make sure these are set:
- RAZORPAY_LIVE_KEY_ID=rzp_live_Rc4PnSfYRwhslI
- RAZORPAY_LIVE_KEY_SECRET=hNB5OIi9hsqT1uVFn1Qff824
- RAZORPAY_WEBHOOK_SECRET=vuPZK@pU4vuPZK@pUvuPZK@pU4C54CsL4CvuPZK@pU4C54CsL54CsLC54CsL

### 8. Test the API
```bash
curl -X POST https://api.camantraa.com/api/payments/create-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testSeriesId":"690b3b68eeac9505462af5a9"}'
```

## What Was Fixed

### Before:
```javascript
const receipt = `${Date.now()}-${studentId}-${testSeriesId}`;
// Result: 1730838400000-690b3b68eeac9505462af5a9-67072... (60+ chars) ❌
```

### After:
```javascript
const timestamp = Date.now().toString().slice(-10);
const random = Math.random().toString(36).substring(2, 8);
const receipt = `TS-${timestamp}-${random}`;
// Result: TS-0838400000-abc123 (21 chars) ✅
```

### Error Handling Improved:
- Now shows actual Razorpay error descriptions
- Better logging for debugging
- Validates configuration on startup

## Verify Success

After deployment, the API should:
1. ✅ Accept payment order creation requests
2. ✅ Create Razorpay orders successfully
3. ✅ Return order ID and details
4. ✅ Show proper error messages if issues occur

Check logs for:
```
✅ Razorpay initialized successfully
Creating Razorpay order with data: { amount: ..., currency: 'INR', receipt: 'TS-...' }
Razorpay order created successfully: order_xxxxx
```

## Troubleshooting

### If still getting errors:

1. **Check .env file exists on server**
```bash
ls -la /home/ubuntu/ca-test-series-backend/.env
```

2. **Verify environment variables loaded**
```bash
pm2 show camantraa-api | grep env
```

3. **Check PM2 logs**
```bash
pm2 logs camantraa-api --err --lines 100
```

4. **Restart with environment reload**
```bash
pm2 restart camantraa-api --update-env
```

5. **If .env not loaded, try:**
```bash
cd /home/ubuntu/ca-test-series-backend
pm2 delete camantraa-api
pm2 start src/server.js --name camantraa-api --node-args="--max-old-space-size=4096"
```

## Quick Deploy Commands (All-in-One)

```bash
# Local: Commit and push
git add . && git commit -m "fix: Razorpay payment integration" && git push

# Server: Pull and restart
ssh -i camantraaF.pem ubuntu@13.203.67.107 "cd /home/ubuntu/ca-test-series-backend && git pull && pm2 restart camantraa-api && pm2 logs camantraa-api --lines 20"
```

## Expected Success Response

```json
{
  "orderId": "order_xxxxxxxxxxxxx",
  "amount": 999,
  "currency": "INR",
  "testSeriesId": "690b3b68eeac9505462af5a9",
  "testSeriesTitle": "CA Final Test Series",
  "paymentId": "673..."
}
```

---

✅ **Ready to deploy!** The receipt length issue is fixed and error handling is improved.
