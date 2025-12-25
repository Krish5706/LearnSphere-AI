const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// GET CURRENT USER (For AuthContext checkAuth)
exports.getMe = async (req, res) => {
    try {
        // req.user is attached by the 'protect' middleware
        res.status(200).json(req.user);
    } catch (err) {
        res.status(500).json({ message: "Error fetching user data" });
    }
};

// backend/controllers/authcontroller.js
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        // This log will show if the data is actually arriving
        console.log("Register Attempt for:", email);

        const newUser = await User.create({ name, email, password });
        
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.status(201).json({
            status: 'success',
            token,
            user: { id: newUser._id, name: newUser.name, email: newUser.email, credits: newUser.credits, isSubscribed: newUser.isSubscribed }
        });
    } catch (err) {
        // LOOK AT YOUR BACKEND TERMINAL FOR THIS LOG:
        console.error("VALIDATION ERROR:", err.message);

        res.status(400).json({
            status: 'fail',
            message: err.code === 11000 ? "Email already exists" : err.message
        });
    }
};

exports.getMe = async (req, res) => {
    res.status(200).json(req.user);
};


exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Missing email or password" });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = signToken(user._id);
        res.status(200).json({
            status: 'success',
            token,
            user: { id: user._id, name: user.name, email: user.email, credits: user.credits }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// ... keep your login function as it was ...