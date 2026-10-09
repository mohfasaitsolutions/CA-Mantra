#!/bin/bash

# Razorpay Configuration Verification Script

echo "🔍 Verifying Razorpay Configuration..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Source .env file
export $(cat .env | grep -v '^#' | xargs)

# Check Razorpay credentials
echo "Checking RAZORPAY_LIVE_KEY_ID..."
if [ -z "$RAZORPAY_LIVE_KEY_ID" ]; then
    echo "❌ RAZORPAY_LIVE_KEY_ID is not set!"
    exit 1
else
    echo "✅ RAZORPAY_LIVE_KEY_ID is set: ${RAZORPAY_LIVE_KEY_ID:0:10}..."
fi

echo ""
echo "Checking RAZORPAY_LIVE_KEY_SECRET..."
if [ -z "$RAZORPAY_LIVE_KEY_SECRET" ]; then
    echo "❌ RAZORPAY_LIVE_KEY_SECRET is not set!"
    exit 1
else
    echo "✅ RAZORPAY_LIVE_KEY_SECRET is set: ${RAZORPAY_LIVE_KEY_SECRET:0:10}..."
fi

echo ""
echo "Checking RAZORPAY_WEBHOOK_SECRET..."
if [ -z "$RAZORPAY_WEBHOOK_SECRET" ]; then
    echo "⚠️  RAZORPAY_WEBHOOK_SECRET is not set (optional but recommended)"
else
    echo "✅ RAZORPAY_WEBHOOK_SECRET is set: ${RAZORPAY_WEBHOOK_SECRET:0:10}..."
fi

echo ""
echo "✅ All Razorpay credentials are configured!"
echo ""
echo "📋 Configuration Summary:"
echo "  - Key ID: ${RAZORPAY_LIVE_KEY_ID:0:15}..."
echo "  - Key Secret: [HIDDEN]"
echo "  - Webhook Secret: ${RAZORPAY_WEBHOOK_SECRET:+[SET]}${RAZORPAY_WEBHOOK_SECRET:-[NOT SET]}"
echo ""
echo "✅ Ready to process payments!"
