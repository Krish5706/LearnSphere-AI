const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOtpEmail, sendPaymentSuccessEmail } = require('../services/emailService');

const DEMO_PLAN_UPGRADES = {
    starter_plus: {
        name: 'Starter Plus',
        addedCredits: 120,
        isSubscribed: true
    },
    premium_pro: {
        name: 'Premium Pro',
        addedCredits: 500,
        isSubscribed: true
    },
    team_elite: {
        name: 'Team Elite',
        addedCredits: 1200,
        isSubscribed: true
    }
};

const demoPaymentSessions = new Map();

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const maskEmail = (email = '') => {
    const [namePart, domainPart] = String(email).split('@');
    if (!namePart || !domainPart) return email;

    const visible = namePart.length <= 2 ? namePart[0] : namePart.slice(0, 2);
    const masked = `${visible}${'*'.repeat(Math.max(1, namePart.length - visible.length))}`;
    return `${masked}@${domainPart}`;
};

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Register new user
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        console.log('📝 REGISTER ATTEMPT:', { name, email, password: '***' });

        // Validate input
        if (!email || !password || !name) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ message: "Please provide name, email and password" });
        }

        if (password.length < 8) {
            console.log('❌ Password too short');
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        // Ensure new users get 20 free credits by default
        const newUser = await User.create({ name, email, password, credits: 20 });
        console.log('✅ User created:', { id: newUser._id, email: newUser.email });
        
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        console.log('🔑 Token generated for new user');

        res.status(201).json({
            status: 'success',
            token,
            user: { id: newUser._id, name: newUser.name, email: newUser.email, credits: newUser.credits, isSubscribed: newUser.isSubscribed }
        });
    } catch (err) {
        console.error("❌ REGISTRATION ERROR:", err.message);

        res.status(400).json({
            status: 'fail',
            message: err.code === 11000 ? "Email already exists" : err.message
        });
    }
};

// Login user, get current user profile
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 LOGIN ATTEMPT:', { email, password: '***' });
        
        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({ message: "Missing email or password" });
        }

        // Find user and select password field (normally hidden)
        const user = await User.findOne({ email }).select('+password');
        console.log('👤 User found:', user ? `${user.email} (exists)` : 'NOT FOUND');
        
        if (!user) {
            console.log('❌ User not found with email:', email);
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare passwords
        const isPasswordCorrect = await user.correctPassword(password, user.password);
        console.log('🔑 Password check:', isPasswordCorrect ? 'CORRECT' : 'INCORRECT');
        
        if (!isPasswordCorrect) {
            console.log('❌ Password mismatch for user:', email);
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = signToken(user._id);
        console.log('✅ Login successful for:', email);
        
        res.status(200).json({
            status: 'success',
            token,
            user: { id: user._id, name: user.name, email: user.email, credits: user.credits, isSubscribed: user.isSubscribed }
        });
    } catch (err) {
        console.error('🚨 Login error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Get current authenticated user
exports.getMe = async (req, res) => {
    try {
        // req.user is attached by the 'protect' middleware
        res.status(200).json(req.user);
    } catch (err) {
        res.status(500).json({ message: "Error fetching user data" });
    }
};

// Demo payment + upgrade endpoint (no real payment gateway)
exports.demoUpgrade = async (req, res) => {
    try {
        const { planKey, paymentMethod } = req.body;

        if (!planKey) {
            return res.status(400).json({ message: 'planKey is required' });
        }

        const selectedPlan = DEMO_PLAN_UPGRADES[planKey];
        if (!selectedPlan) {
            return res.status(400).json({ message: 'Invalid plan selected' });
        }

        const validPaymentMethods = ['credit_card', 'upi', 'net_banking', 'wallet'];
        if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const previousCredits = user.credits;
        user.credits = Number(user.credits || 0) + selectedPlan.addedCredits;
        user.isSubscribed = selectedPlan.isSubscribed;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: `Demo upgrade successful: ${selectedPlan.name}`,
            payment: {
                mode: 'demo',
                method: paymentMethod || 'credit_card',
                transactionId: `demo_${Date.now()}`
            },
            upgrade: {
                planKey,
                planName: selectedPlan.name,
                creditsAdded: selectedPlan.addedCredits,
                previousCredits,
                currentCredits: user.credits
            },
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                isSubscribed: user.isSubscribed
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Demo payment step 1: create payment session and send OTP email
exports.initiateDemoPayment = async (req, res) => {
    console.log('\n💳 PAYMENT INITIATION REQUEST RECEIVED');
    try {
        const { planKey, paymentMethod, paymentDetails } = req.body;
        
        console.log('  User:', req.user.email || 'unknown');
        console.log('  Plan:', planKey);
        console.log('  Method:', paymentMethod);

        if (!planKey) {
            console.log('❌ Error: planKey missing');
            return res.status(400).json({ message: 'planKey is required' });
        }

        const selectedPlan = DEMO_PLAN_UPGRADES[planKey];
        if (!selectedPlan) {
            console.log('❌ Error: Invalid plan');
            return res.status(400).json({ message: 'Invalid plan selected' });
        }

        const validPaymentMethods = ['credit_card', 'upi'];
        if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
            console.log('❌ Error: Invalid payment method');
            return res.status(400).json({ message: 'Valid paymentMethod is required' });
        }

        if (paymentMethod === 'credit_card' && !paymentDetails?.cardNumber) {
            console.log('❌ Error: Card number missing');
            return res.status(400).json({ message: 'cardNumber is required for credit card payment' });
        }

        if (paymentMethod === 'upi' && !paymentDetails?.upiId) {
            console.log('❌ Error: UPI ID missing');
            return res.status(400).json({ message: 'upiId is required for UPI payment' });
        }

        const otpCode = generateOtp();
        const paymentSessionId = `pay_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        console.log('✅ Validations passed');
        console.log('  Generated OTP:', otpCode);
        console.log('  Session ID:', paymentSessionId);

        demoPaymentSessions.set(paymentSessionId, {
            userId: String(req.user._id),
            planKey,
            paymentMethod,
            email: req.user.email,
            otpCode,
            expiresAt: Date.now() + 5 * 60 * 1000,
            status: 'pending'
        });

        const paymentHint = paymentMethod === 'credit_card'
            ? `Card ending ${String(paymentDetails.cardNumber).replace(/\D/g, '').slice(-4)}`
            : paymentMethod === 'upi'
                ? `UPI ${paymentDetails.upiId}`
                : 'Payment';

        console.log('📨 Attempting to send OTP email...');
        const otpEmailResult = await sendOtpEmail({
            to: req.user.email,
            userName: req.user.name,
            otpCode,
            planName: selectedPlan.name,
            paymentHint
        });

        const otpMessage = `OTP sent to ${maskEmail(req.user.email)}. Valid for 5 min.`;

        console.log('✅ PAYMENT INITIATION SUCCESS - Responding to frontend');
        return res.status(200).json({
            status: 'success',
            message: 'Payment initiated. OTP sent to your email.',
            paymentSessionId,
            otpExpiresInSeconds: 300,
            emailMasked: maskEmail(req.user.email),
            emailDelivery: {
                sent: otpEmailResult.success !== false,
                providerMode: otpEmailResult.isTestAccount ? 'ethereal-test' : 'smtp',
                previewUrl: otpEmailResult.previewUrl
            },
            demoOtp: otpEmailResult.isTestAccount ? otpCode : undefined,
            otpMessage,
            debug: {
                emailSent: true,
                mode: otpEmailResult.isTestAccount ? 'test' : 'real'
            }
        });
    } catch (err) {
        console.error('\n❌ PAYMENT INITIATION ERROR:');
        console.error('  Error:', err.message);
        console.error('  Stack:', err.stack);
        return res.status(500).json({ 
            message: 'Payment initiation failed: ' + err.message,
            error: err.message 
        });
    }
};

// Demo payment step 2: verify OTP and apply credits
exports.confirmDemoPayment = async (req, res) => {
    console.log('\n🔐 OTP VERIFICATION REQUEST RECEIVED');
    try {
        const { paymentSessionId, otp } = req.body;

        console.log('  PaymentSessionId:', paymentSessionId);
        console.log('  OTP entered:', otp);
        console.log('  User:', req.user.email);

        if (!paymentSessionId || !otp) {
            console.log('❌ Error: Missing paymentSessionId or otp');
            return res.status(400).json({ message: 'paymentSessionId and otp are required' });
        }

        const session = demoPaymentSessions.get(paymentSessionId);
        if (!session) {
            console.log('❌ Error: Payment session not found');
            return res.status(404).json({ message: 'Payment session not found' });
        }

        console.log('  Session plan:', session.planKey);
        console.log('  Session status:', session.status);

        if (session.status !== 'pending') {
            console.log('❌ Error: Session not pending');
            return res.status(400).json({ message: 'Payment session already completed or invalid' });
        }

        if (session.userId !== String(req.user._id)) {
            console.log('❌ Error: User ID mismatch');
            return res.status(403).json({ message: 'Unauthorized payment session' });
        }

        if (Date.now() > session.expiresAt) {
            console.log('❌ Error: OTP expired');
            demoPaymentSessions.delete(paymentSessionId);
            return res.status(400).json({ message: 'OTP expired. Please initiate payment again.' });
        }

        if (String(otp).trim() !== session.otpCode) {
            console.log('❌ Error: OTP mismatch');
            console.log('  Expected:', session.otpCode);
            console.log('  Received:', String(otp).trim());
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        console.log('✅ OTP verified successfully');

        const selectedPlan = DEMO_PLAN_UPGRADES[session.planKey];
        if (!selectedPlan) {
            console.log('❌ Error: Invalid plan');
            demoPaymentSessions.delete(paymentSessionId);
            return res.status(400).json({ message: 'Invalid plan in payment session' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            console.log('❌ Error: User not found');
            demoPaymentSessions.delete(paymentSessionId);
            return res.status(404).json({ message: 'User not found' });
        }

        const previousCredits = Number(user.credits || 0);
        user.credits = previousCredits + selectedPlan.addedCredits;
        user.isSubscribed = selectedPlan.isSubscribed;
        await user.save();

        console.log('✅ User credits updated:', previousCredits, '->', user.credits);

        session.status = 'completed';

        console.log('📧 Sending payment success email...');
        const successEmailResult = await sendPaymentSuccessEmail({
            to: user.email,
            userName: user.name,
            planName: selectedPlan.name,
            previousCredits,
            currentCredits: user.credits
        });

        const confirmationMessage = `Payment success for ${selectedPlan.name}. Credits updated ${previousCredits} -> ${user.credits}.`;

        console.log('✅ OTP VERIFICATION SUCCESS - Payment complete');
        return res.status(200).json({
            status: 'success',
            message: `Demo payment successful: ${selectedPlan.name}`,
            payment: {
                mode: 'demo',
                method: session.paymentMethod,
                transactionId: `demo_${Date.now()}`,
                emailMasked: maskEmail(session.email)
            },
            confirmationMessage,
            emailDelivery: {
                sent: successEmailResult.success !== false,
                providerMode: successEmailResult.isTestAccount ? 'ethereal-test' : 'smtp',
                previewUrl: successEmailResult.previewUrl
            },
            upgrade: {
                planKey: session.planKey,
                planName: selectedPlan.name,
                creditsAdded: selectedPlan.addedCredits,
                previousCredits,
                currentCredits: user.credits
            },
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                isSubscribed: user.isSubscribed
            }
        });
    } catch (err) {
        console.error('\n❌ OTP VERIFICATION ERROR:');
        console.error('  Error:', err.message);
        console.error('  Stack:', err.stack);
        return res.status(500).json({ 
            message: 'Payment verification failed: ' + err.message,
            error: err.message 
        });
    }
};