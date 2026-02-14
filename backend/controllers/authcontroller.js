const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

        const newUser = await User.create({ name, email, password });
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