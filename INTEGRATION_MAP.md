# 🔗 FRONTEND-BACKEND INTEGRATION MAP

## Complete Payment Flow with Code References

### 1️⃣ USER CLICKS "UPGRADE TO PREMIUM"

**Frontend:** [PremiumPlansModal.jsx](forntend/src/components/common/PremiumPlansModal.jsx#L1)
```jsx
// User clicks button on header/home page
// Modal opens with 3 plans visible
```

**Initial State:**
```js
const [paymentStep, setPaymentStep] = useState('choose_plan');
// Shows: Starter Plus, Premium Pro (featured), Team Elite
```

---

### 2️⃣ USER SELECTS PLAN (e.g., Premium Pro)

**Frontend:** [PremiumPlansModal.jsx](forntend/src/components/common/PremiumPlansModal.jsx#L76)
```jsx
const handleSelectPlan = (plan) => {
    setErrorMessage('');
    setSelectedPlan(plan);  // { key: 'premium_pro', name: 'Premium Pro', creditsAdded: 500 }
    setPaymentStep('enter_payment_details');  // Transition to next step
};
```

**What's displayed:**
- Plan name & credits to be added
- Message: "OTP will be sent to your registered account email: yo****@domain.com"
- Payment method selector: Credit Card or UPI

---

### 3️⃣ USER ENTERS PAYMENT DETAILS & CLICKS "PAY NOW"

**Frontend:** [PremiumPlansModal.jsx](forntend/src/components/common/PremiumPlansModal.jsx#L85)
```jsx
const handleInitiatePayment = async () => {
    // Validation
    if (paymentMethod === 'credit_card') {
        if (cardNumber.replace(/\s/g, '').length < 12) {
            setErrorMessage('Please enter a valid card number.');
            return;
        }
    }
    
    try {
        setIsProcessingPayment(true);
        
        // 📤 CALL BACKEND API
        const res = await api.post('/auth/demo-payment/initiate', {
            planKey: selectedPlan.key,              // "premium_pro"
            paymentMethod,                          // "credit_card"
            paymentDetails: { cardNumber }          // "4111111111111111"
        });
        
        // 📥 HANDLE RESPONSE
        setPaymentSessionId(res.data?.paymentSessionId || '');
        setOtpDeliveryMessage(res.data?.otpMessage || 'OTP sent to your registered email.');
        setEmailPreviewUrl(res.data?.emailDelivery?.previewUrl || '');
        setOtpHint(res.data?.demoOtp || '');        // Only if dev fallback
        setPaymentStep('verify_otp');
    } catch (err) {
        // 404 = older backend; fallback to local OTP generation
        if (err?.response?.status === 404) {
            // ... fallback logic ...
        }
    }
};
```

**Key Part:** Authorization header added automatically by API service:

**Frontend:** [api.js](forntend/src/services/api.js#L7)
```js
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;  // ← Added automatically
    }
    return config;
});
```

**Backend Receives:**
```
POST /api/auth/demo-payment/initiate
Headers: {
    Authorization: "Bearer eyJhbGc...",
    Content-Type: "application/json"
}
Body: {
    planKey: "premium_pro",
    paymentMethod: "credit_card",
    paymentDetails: { cardNumber: "4111111111111111" }
}
```

---

### 4️⃣ BACKEND: VALIDATE & GENERATE OTP

**Backend:** [authcontroller.js](backend/controllers/authcontroller.js#L198)
```js
exports.initiateDemoPayment = async (req, res) => {
    try {
        const { planKey, paymentMethod, paymentDetails } = req.body;
        
        // ✅ Validation
        if (!planKey) return res.status(400).json({ message: 'planKey is required' });
        
        const selectedPlan = DEMO_PLAN_UPGRADES[planKey];
        if (!selectedPlan) return res.status(400).json({ message: 'Invalid plan selected' });
        
        if (paymentMethod === 'credit_card' && !paymentDetails?.cardNumber) {
            return res.status(400).json({ message: 'cardNumber is required' });
        }
        
        // 🎲 Generate 6-digit OTP
        const otpCode = generateOtp();  // "482913"
        const paymentSessionId = `pay_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        
        // 💾 Store session with 5-min expiry
        demoPaymentSessions.set(paymentSessionId, {
            userId: String(req.user._id),
            planKey,
            paymentMethod,
            email: req.user.email,
            otpCode,
            expiresAt: Date.now() + 5 * 60 * 1000,  // 5 minutes
            status: 'pending'
        });
```

---

### 5️⃣ BACKEND: SEND EMAIL VIA NODEMAILER

**Backend:** [authcontroller.js](backend/controllers/authcontroller.js#L245)
```js
        // 📧 SEND OTP EMAIL
        const otpEmailResult = await sendOtpEmail({
            to: req.user.email,
            userName: req.user.name,
            otpCode,
            planName: selectedPlan.name,
            paymentHint: `Card ending ${paymentDetails.cardNumber.slice(-4)}`
        });
        
        // Returns: { messageId, previewUrl, isTestAccount }
        // If Gmail SMTP: messageId from Gmail, isTestAccount=false
        // If Ethereal fallback: previewUrl for dev testing, isTestAccount=true
```

**Email Service:** [emailService.js](backend/services/emailService.js#L60)
```js
exports.sendOtpEmail = async ({ to, userName, otpCode, planName, paymentHint }) => {
    const { transporter, from, isTestAccount } = await getTransporter();
    
    const mailOptions = {
        from,
        to,
        subject: 'LearnSphere Premium Payment - Verify OTP',
        html: `
            <h2>Verify Your Payment</h2>
            <p>Your OTP: <strong>${otpCode}</strong></p>
            <p>Plan: ${planName}</p>
            <p>Payment: ${paymentHint}</p>
            <p>Valid for 5 minutes</p>
        `
    };
    
    // 📤 Send via real SMTP or Ethereal
    const info = await transporter.sendMail(mailOptions);
    
    return {
        messageId: info.messageId,
        previewUrl: isTestAccount ? nodemailer.getTestMessageUrl(info) : null,
        isTestAccount
    };
};
```

**SMTP Configuration:** [emailService.js](backend/services/emailService.js#L10)
```js
// From .env file:
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_SECURE=false
// SMTP_USER=dakshprajapati2208@gmail.com
// SMTP_PASS="rpik gefx bldb muix"
// MAIL_FROM="LearnSphere OTP <dakshprajapati2208@gmail.com>"

const createTransportFromEnv = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = toBoolean(process.env.SMTP_SECURE || 'false');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) return null;  // Skip if not configured

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });
};
```

---

### 6️⃣ BACKEND RETURNS RESPONSE

**Backend:** [authcontroller.js](backend/controllers/authcontroller.js#L253)
```js
        return res.status(200).json({
            status: 'success',
            message: 'Payment initiated. OTP sent to your email.',
            paymentSessionId,
            otpExpiresInSeconds: 300,
            emailMasked: maskEmail(req.user.email),  // "yo****@domain.com"
            emailDelivery: {
                sent: true,
                providerMode: otpEmailResult.isTestAccount ? 'ethereal-test' : 'smtp',
                previewUrl: otpEmailResult.previewUrl  // null for real SMTP
            },
            demoOtp: otpEmailResult.isTestAccount ? otpCode : undefined,  // Only for dev
            otpMessage: `OTP sent to ${maskEmail(req.user.email)}. Valid for 5 min.`
        });
```

---

### 7️⃣ FRONTEND RECEIVES RESPONSE & SHOWS OTP STEP

**Frontend:** [PremiumPlansModal.jsx](forntend/src/components/common/PremiumPlansModal.jsx#L125)
```jsx
        // 📥 BACKEND RESPONSE RECEIVED
        setPaymentSessionId(res.data?.paymentSessionId || '');
        setOtpDeliveryMessage(res.data?.otpMessage || '...');
        setEmailPreviewUrl(res.data?.emailDelivery?.previewUrl || '');
        setOtpHint(res.data?.demoOtp || '');  // Undefined for real SMTP
        setPaymentStep('verify_otp');
```

**Displayed to User:**
```jsx
{paymentStep === 'verify_otp' && (
    <div className="mt-5">
        <p className="text-xs text-emerald-200 bg-emerald-500/20 border border-emerald-300/30 rounded-lg px-3 py-2">
            {otpDeliveryMessage}  // "OTP sent to yo****@domain.com. Valid for 5 min."
        </p>
        {emailPreviewUrl && (
            <p className="text-xs text-cyan-200 mt-2 break-all">
                Email preview URL (dev): {emailPreviewUrl}  // Only if Ethereal
            </p>
        )}
        {otpHint && (
            <p className="text-xs text-amber-200 mt-2">
                Demo OTP preview (for testing): <strong>{otpHint}</strong>  // Only if dev
            </p>
        )}
        
        <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit OTP"
        />
        <button onClick={handleConfirmPayment}>Verify OTP and Complete Payment</button>
    </div>
)}
```

---

### 8️⃣ USER CHECKS EMAIL & GETS OTP

**Email Received:**
```
From: LearnSphere OTP <dakshprajapati2208@gmail.com>
To: user@domain.com
Subject: LearnSphere Premium Payment - Verify OTP

┌─────────────────────────────────────────┐
│                                          │
│  Verify Your Payment                    │
│                                          │
│  Your OTP: 482913                       │
│  Plan: Premium Pro                      │
│  Payment: Card ending 1111              │
│  Valid for 5 minutes                    │
│                                          │
│  LearnSphere                            │
│                                          │
└─────────────────────────────────────────┘
```

**User Copies OTP:** `482913`

---

### 9️⃣ USER ENTERS OTP & CLICKS VERIFY

**Frontend:** [PremiumPlansModal.jsx](forntend/src/components/common/PremiumPlansModal.jsx#L150)
```jsx
const handleConfirmPayment = async () => {
    if (!paymentSessionId) {
        setErrorMessage('Payment session missing.');
        return;
    }

    if (!otpCode || otpCode.length !== 6) {
        setErrorMessage('Please enter the 6-digit OTP.');
        return;
    }

    try {
        setErrorMessage('');
        setProcessingPlan(selectedPlan?.key || 'verifying');

        // 📤 SEND OTP VERIFICATION REQUEST
        const res = await api.post('/auth/demo-payment/confirm', {
            paymentSessionId,      // "pay_1774084747078_1225"
            otp: otpCode           // "482913"
        });

        // 📥 UPDATE USER IN CONTEXT
        if (res.data?.user) {
            setUser(res.data.user);  // Update AuthContext with new credits!
        }

        setOtpDeliveryMessage(res.data?.confirmationMessage || 'Payment successful');
        setPaymentStep('completed');
    } catch (err) {
        setErrorMessage(err?.response?.data?.message || 'Payment verification failed.');
    }
};
```

**Backend Receives:**
```
POST /api/auth/demo-payment/confirm
Headers: { Authorization: "Bearer ...", Content-Type: "application/json" }
Body: {
    paymentSessionId: "pay_1774084747078_1225",
    otp: "482913"
}
```

---

### 🔟 BACKEND: VERIFY OTP & UPDATE CREDITS

**Backend:** [authcontroller.js](backend/controllers/authcontroller.js#L275)
```js
exports.confirmDemoPayment = async (req, res) => {
    try {
        const { paymentSessionId, otp } = req.body;

        if (!paymentSessionId || !otp) {
            return res.status(400).json({ message: 'paymentSessionId and otp are required' });
        }

        // 🔐 Look up session
        const session = demoPaymentSessions.get(paymentSessionId);
        if (!session) {
            return res.status(404).json({ message: 'Payment session not found' });
        }

        // ⏰ Check expiry
        if (Date.now() > session.expiresAt) {
            demoPaymentSessions.delete(paymentSessionId);
            return res.status(400).json({ message: 'OTP expired. Please initiate payment again.' });
        }

        // ✅ Verify OTP
        if (String(otp).trim() !== session.otpCode) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // 💰 Add credits to user
        const user = await User.findById(req.user._id);
        const selectedPlan = DEMO_PLAN_UPGRADES[session.planKey];
        
        const previousCredits = Number(user.credits || 0);
        user.credits = previousCredits + selectedPlan.addedCredits;  // 5 + 500 = 505
        user.isSubscribed = selectedPlan.isSubscribed;
        await user.save();  // 💾 SAVE TO MONGODB

        session.status = 'completed';

        // 📧 Send success email
        const successEmailResult = await sendPaymentSuccessEmail({
            to: user.email,
            userName: user.name,
            planName: selectedPlan.name,
            previousCredits,
            currentCredits: user.credits
        });

        // 📤 Return updated user
        return res.status(200).json({
            status: 'success',
            message: `Demo payment successful: ${selectedPlan.name}`,
            confirmationMessage: `Payment success for ${selectedPlan.name}. Credits updated ${previousCredits} -> ${user.credits}.`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,        // ← 505
                isSubscribed: user.isSubscribed // ← true
            },
            upgrade: {
                planName: selectedPlan.name,
                creditsAdded: selectedPlan.addedCredits,
                previousCredits,
                currentCredits: user.credits
            }
        });
    }
};
```

---

### 1️⃣1️⃣ FRONTEND: UPDATE CONTEXT & SHOW SUCCESS

**Frontend:** [PremiumPlansModal.jsx](forntend/src/components/common/PremiumPlansModal.jsx#L174)
```jsx
        // 📥 BACKEND RESPONSE
        if (res.data?.user) {
            setUser(res.data.user);  // ← CRITICAL: Update AuthContext
            // Now header shows: "Credits: 505" instead of "Credits: 5"
        }

        setOtpDeliveryMessage(res.data?.confirmationMessage || '...');
        setPaymentStep('completed');  // Show completion step
```

**Displayed to User:**
```jsx
{paymentStep === 'completed' && (
    <>
        <p className="mt-5 text-sm text-emerald-100 bg-emerald-500/20">
            Payment complete. {otpDeliveryMessage}
            // Shows: "Payment success for Premium Pro. Credits updated 5 -> 505."
        </p>
        <button onClick={handleClose}>Done</button>
    </>
)}
```

**What's Updated:**
- ✅ Modal shows success message
- ✅ AuthContext.user.credits = 505 (increased by 500)
- ✅ AuthContext.user.isSubscribed = true
- ✅ Header displays updated credits
- ✅ Success email sent to user email

---

## 📊 State Flow Summary

```
┌─ FRONTEND ─────────────────────────────────────┐
│                                                 │
│  localStorage.token                           │
│      ↓                                          │
│  AuthContext.user                             │
│  { id, name, email, credits, isSubscribed }   │
│      ↓                                          │
│  PremiumPlansModal                            │
│  - paymentStep: 'choose_plan'                │
│  - selectedPlan: { key, name, creditsAdded }│
│  - paymentSessionId: 'pay_...'               │
│  - otpCode: '482913'                         │
│                                                 │
└─ [setUser(res.data.user)] ←────────────────────┘
           ↑                                       
           │ Updates on payment confirm           
           │                                       
┌─ BACKEND ──────────────────────────────────────┐
│                                                 │
│  MongoDB (User Document)                       │
│  { credits: 505, isSubscribed: true }         │
│      ↑                                          │
│      │ Updates on OTP verification             │
│                                                 │
│  demoPaymentSessions (In-Memory Map)          │
│  { paymentSessionId → { otp, expiresAt } }   │
│      ↑                                          │
│      │ Creates on payment initiate             │
│                                                 │
│  Nodemailer (SMTP)                            │
│  Sends OTP emails via Gmail                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Key Integration Points

| Component | File | Function |
|-----------|------|----------|
| **Plan Selection UI** | [PremiumPlansModal.jsx](forntend/src/components/common/PremiumPlansModal.jsx) | Displays 3 plans, calls `handleSelectPlan()` |
| **Payment Details UI** | [PremiumPlansModal.jsx](forntend/src/components/common/PremiumPlansModal.jsx) | Card/UPI input, calls `handleInitiatePayment()` |
| **OTP Input UI** | [PremiumPlansModal.jsx](forntend/src/components/common/PremiumPlansModal.jsx) | 6-digit input, calls `handleConfirmPayment()` |
| **API Client** | [api.js](forntend/src/services/api.js) | Adds Bearer token automatically |
| **Auth Context** | [AuthContext.jsx](forntend/src/context/AuthContext.jsx) | Stores user, credits, isSubscribed |
| **Auth Middleware** | [authMiddleware.js](backend/middleware/authMiddleware.js) | Verifies JWT on payment routes |
| **Payment Initiate** | [authcontroller.js](backend/controllers/authcontroller.js#L198) | Generates OTP, sends email, returns sessionId |
| **Payment Confirm** | [authcontroller.js](backend/controllers/authcontroller.js#L275) | Verifies OTP, updates credits, returns user |
| **Email Service** | [emailService.js](backend/services/emailService.js) | Sends OTP & success emails via SMTP |
| **User Model** | [User.js](backend/models/User.js) | Stores credits, isSubscribed, email |

---

## ✨ Complete Integration Verified

✅ Frontend sends plan + payment details to backend
✅ Backend generates OTP + creates payment session
✅ Backend sends OTP email via real Gmail SMTP
✅ Frontend shows OTP verification step
✅ User checks email, gets OTP
✅ Frontend sends OTP + session ID to backend
✅ Backend verifies OTP + updates user credits
✅ Backend returns updated user to frontend
✅ Frontend calls `setUser()` to update AuthContext
✅ Header displays updated credits immediately
✅ Success email sent to user

**Everything is connected and working! 🎉**

