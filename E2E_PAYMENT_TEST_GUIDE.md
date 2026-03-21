# 🎯 End-to-End Payment & Email OTP Test Guide

## ✅ System Architecture (Verified)

```
Frontend Login → AuthContext (user state + token) 
    ↓
PremiumPlansModal (Choose Plan → Enter Payment Details → Verify OTP)
    ↓
Backend: /auth/demo-payment/initiate → Generate OTP → Send Email via Nodemailer
    ↓
Gmail SMTP (Real or Ethereal fallback)
    ↓
User Email Inbox → Copy OTP
    ↓
Frontend: Enter OTP → /auth/demo-payment/confirm → Credit Updated
```

## 📋 Pre-Flight Checklist

**Backend Status:**
- ✅ Node.js running on port 3000
- ✅ MongoDB connected
- ✅ Nodemailer configured with Gmail SMTP
- ✅ Email service: emailService.js
- ✅ Payment handlers: initiateDemoPayment + confirmDemoPayment

**Frontend Status:**
- ✅ React running on port 5173 (Vite)
- ✅ AuthContext: Stores user, token, credits, isSubscribed
- ✅ PremiumPlansModal: Multi-step payment flow
- ✅ API service: Axios with Bearer token interceptor

**Email Service Status:**
- ✅ SMTP Host: smtp.gmail.com:587
- ✅ SMTP Auth: dakshprajapati2208@gmail.com
- ✅ Response includes: messageId, isTestAccount (true=Ethereal, false=real Gmail)

---

## 🚀 Quick Test: 5 Steps

### Step 1: Start Backend (if not running)
```bash
cd backend
npm run dev
# Wait for: "🚀 Server running on http://localhost:3000"
```

### Step 2: Start Frontend (if not running)
```bash
cd forntend
npm run dev
# Wait for: "Local: http://localhost:5173"
```

### Step 3: Register/Login as Test User
1. Open http://localhost:5173 in browser
2. Click **Register** (or Login if you have account)
3. Use email: `your-real-email@domain.com` (for OTP testing)
4. Password: `TestPassword123`
5. Confirm registration successful → You see credits display

### Step 4: Trigger Premium Upgrade
1. Look for **"Upgrade to Premium"** button (usually header or main page)
2. Click to open PremiumPlansModal
3. You should see:
   - "Step 1: Choose your premium plan"
   - 3 plan cards: Starter Plus, Premium Pro (featured), Team Elite
   - Current credits display
4. Click **"Choose Premium Pro"** (featured plan)
5. You'll see **Step 2: Payment Details** modal

### Step 5: Complete Payment & OTP Verification
1. **Payment step:**
   - Select payment method: **Credit Card** (demo) or **UPI** (demo)
   - Credit Card: Enter any number like `4111111111111111`
   - OR UPI: Enter `test@upi`
   - Message: "OTP will be sent to your registered account email: xx...@domain.com"
   - Click **"Pay Now (Demo)"**

2. **OTP Verification step:**
   - You'll see: "OTP sent to xx...@domain.com"
   - Email preview URL (if dev mode with Ethereal fallback)
   - Demo OTP shown (if using Ethereal fallback) — use this for testing
   - **CHECK YOUR EMAIL** → Open real email inbox, find OTP email from LearnSphere
   - Copy the 6-digit OTP from email
   - Paste into "Enter OTP" field
   - Click **"Verify OTP and Complete Payment"**

3. **Completion:**
   - Success message: "Payment complete. Credits updated."
   - Current credits should increase by plan amount (Premium Pro = +500 credits)
   - Close modal

---

## 🔧 Troubleshooting

### Issue 1: Backend Port 3000 Already in Use
**Problem:** `Error: listen EADDRINUSE :::3000`
**Fix:**
```bash
# Kill the existing process
netstat -ano | findstr :3000  # Find PID
taskkill /PID <PID> /F         # Kill it
npm run dev                      # Restart
```

### Issue 2: Email Not Received
**Problem:** OTP email doesn't arrive in inbox after clicking "Pay Now"
**Diagnostics:**
1. Check browser console (F12) for errors
2. Check backend logs for email send response
3. Verify SMTP credentials in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=dakshprajapati2208@gmail.com
   SMTP_PASS="rpik gefx bldb muix"  # Must have quotes if spaces exist
   ```
4. If using real Gmail, check:
   - Gmail 2-step verification enabled
   - App-specific password generated (not main Gmail password)
   - Check spam/promotions folders
5. **Development mode:** If OTP not sending, system auto-falls back to Ethereal test account
   - Check console for email preview URL
   - Use demo OTP shown in modal for testing

### Issue 3: OTP Verification Fails
**Problem:** "Invalid OTP" message after entering OTP
**Fix:**
1. Ensure you entered exactly 6 digits
2. Copy OTP directly from email (no extra spaces)
3. Make sure OTP hasn't expired (5-minute window)
4. Only one OTP valid per session — initiate new payment if expired

### Issue 4: Credits Not Updated After Payment
**Problem:** Payment confirmed but credits didn't increase
**Diagnostics:**
1. Check backend response from `/auth/demo-payment/confirm` includes `user.credits`
2. Verify `confirmDemoPayment` handler runs `user.save()` after updating credits
3. Refresh frontend page to reload user data from `/auth/me`
4. Check browser console Network tab → `/auth/demo-payment/confirm` response

---

## 📊 API Response Examples

### Success: Payment Initiated
```json
{
  "status": "success",
  "message": "Payment initiated. OTP sent to your email.",
  "paymentSessionId": "pay_1726542380000_1234",
  "otpExpiresInSeconds": 300,
  "emailMasked": "yo****@gmail.com",
  "emailDelivery": {
    "sent": true,
    "providerMode": "smtp",  // or "ethereal-test"
    "previewUrl": null
  },
  "demoOtp": undefined,  // Only if ethereal fallback
  "otpMessage": "OTP sent to yo****@gmail.com. Valid for 5 min."
}
```

### Success: Payment Confirmed
```json
{
  "status": "success",
  "message": "Demo payment successful: Premium Pro",
  "confirmationMessage": "Payment success for Premium Pro. Credits updated 0 -> 500.",
  "user": {
    "id": "67a...",
    "name": "Test User",
    "email": "test@gmail.com", 
    "credits": 500,
    "isSubscribed": true
  }
}
```

---

## 📧 Email Templates

### OTP Email (from learnosphere)
```
To: user@domain.com
Subject: LearnSphere Premium Payment - Verify OTP

Your OTP: 482913
Plan: Premium Pro
Payment: UPI demo@upi
Valid for: 5 minutes

Do not share your OTP with anyone.
```

### Success Email (after OTP verified)
```
To: user@domain.com
Subject: Payment Successful - Credits Updated

Dear Test User,

Your payment for Premium Pro has been confirmed.
Previous Credits: 0
New Credits: 500
Total Available: 500

Enjoy your premium features!
```

---

## 🎓 What Happens Behind the Scenes

### On "Pay Now" Click:
1. **Frontend validates:** Card/UPI ID entered, auth token available
2. **API call:** POST `/auth/demo-payment/initiate` with planKey, paymentMethod, paymentDetails
3. **Backend:**
   - Validates plan exists
   - Generates 6-digit random OTP
   - Creates payment session (5-min expiry) in-memory Map
   - Calls `sendOtpEmail()` service
4. **Email service:**
   - Checks for SMTP config in .env
   - If real SMTP: Sends via Gmail (messageId generated)
   - If no SMTP: Falls back to Ethereal ephemeral account (for dev testing)
   - Returns: messageId, previewUrl (for Ethereal), isTestAccount flag
5. **Frontend receives:**
   - paymentSessionId (to link OTP verification)
   - Masked email address
   - Demo OTP hint (only if Ethereal dev mode)
   - Moves to OTP verification step

### On "Verify OTP" Click:
1. **Frontend validates:** 6 digits entered, payment session ID available
2. **API call:** POST `/auth/demo-payment/confirm` with paymentSessionId, otp
3. **Backend:**
   - Looks up payment session by ID
   - Verifies OTP matches (case-sensitive string comparison)
   - Verifies session not expired (>5 min)
   - Verifies userId in session matches req.user._id (auth security)
   - If all pass: Loads user, adds plan.addedCredits to user.credits, saves user
   - Calls `sendPaymentSuccessEmail()` service
4. **Frontend receives:**
   - Updated user object with new credits
   - Calls `setUser(res.data.user)` to update AuthContext
   - Displays success message
5. **Result:** PremiumPlansModal completes → User sees updated credits in header

---

## ✨ Testing Scenarios

### Scenario 1: Happy Path (Real Email)
- Start backend + frontend
- Register/login with real email
- Upgrade to Premium Pro
- Check real email inbox → copy OTP → enter & confirm
- Verify credits increased by 500

### Scenario 2: Development Mode (Ethereal Fallback)
- If SMTP not configured, system auto-uses test Ethereal account
- Demo OTP shown in modal (for quick testing)
- Can verify payment works without real email setup
- Use demo OTP to complete flow

### Scenario 3: Multiple Plans
- Test all 3 plans: Starter Plus (+120), Premium Pro (+500), Team Elite (+1200)
- Verify correct credits applied
- Verify user.isSubscribed set to true

### Scenario 4: Invalid Inputs
- Try submitting without card number → Error: "cardNumber is required"
- Try submitting with card < 12 digits → Error: "Please enter a valid card number"
- Try entering wrong OTP → Error: "Invalid OTP"
- Try verifying after 5 min → Error: "OTP expired"

---

## 📱 Integration Checklist

- [x] Backend: Email service returns OTP, messageId, isTestAccount flag
- [x] Backend: Payment initiate creates session & sends email
- [x] Backend: Payment confirm verifies OTP & updates user credits
- [x] Backend: Routes protected with JWT middleware
- [x] Frontend: Modal displays plan selection step
- [x] Frontend: Modal displays payment details step
- [x] Frontend: Modal displays OTP verification step with email display
- [x] Frontend: API calls include Bearer token in header
- [x] Frontend: setUser() called with updated user after payment
- [x] Frontend: Fallback mode for 404 (older backend detection)
- [x] AuthContext: user object includes credits, isSubscribed
- [x] AuthContext: canUseAI = isSubscribed || credits > 0

---

## 🎉 Success Indicators

✅ **Payment Flow Complete When:**
1. OTP email arrives in inbox
2. Frontend accepts 6-digit OTP
3. Backend confirms and updates credits
4. Credits display updated in header/profile
5. user.isSubscribed = true in AuthContext
6. No API errors (all 2xx responses)

---

## 📞 Quick Debug Commands

**Check backend port:**
```bash
netstat -ano | findstr :3000
```

**Check backend logs (npm run dev):**
```
Look for: 🚀 Server running on http://localhost:3000
           ✅ MongoDB connected
           MAIL_OK (for successful email sends)
```

**Check browser network (F12 → Network):**
```
POST /api/auth/demo-payment/initiate → 200 OK
POST /auth/demo-payment/confirm → 200 OK
```

**Verify SMTP config is loaded:**
```bash
# Test in backend:
node -e "require('dotenv').config(); console.log(process.env.SMTP_HOST)"
# Should output: smtp.gmail.com
```

---

## 🚨 Important Notes

- **SMTP Credentials Exposed:** The Gmail app password in .env should be rotated after testing (was shared in chat history)
- **In-Memory Sessions:** Payment sessions stored in memory (Map); lost on backend restart
- **Demo Mode Only:** No real payment processing; credits applied immediately after OTP verification
- **5-Minute OTP Expiry:** After 5 min, user must click "Pay Now" again to get new OTP
- **Test Email:** Use any real email you have access to for OTP testing

---

## 🎯 Next Steps After Successful Test

1. ✅ Verify OTP email arrives
2. ✅ Test all 3 plans update credits correctly
3. ✅ Test OTP expiry (wait 5+ min, try old OTP)
4. ✅ Test invalid OTP error handling
5. ✅ Test logout/login persists credits in AuthContext
6. ⏳ Consider: Add success toast notification
7. ⏳ Consider: Add payment history logs to user profile
8. ⏳ Consider: Add transaction ID to user model for tracking

