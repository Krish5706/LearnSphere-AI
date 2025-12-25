const User = require('../models/User');

exports.getProfile = async (req, res) => {
    try {
        // req.user is attached by the 'protect' middleware
        const user = await User.findById(req.user._id);
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching profile" });
    }
};

// Route for when a user completes a "Mock Payment" or "Upgrade"
exports.upgradeAccount = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id, 
            { isSubscribed: true, credits: 100 }, 
            { new: true }
        );
        res.status(200).json({ message: "Account upgraded!", user });
    } catch (err) {
        res.status(500).json({ message: "Upgrade failed" });
    }
};