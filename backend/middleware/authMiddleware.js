const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * PROTECT MIDDLEWARE
 * Ensures the user is logged in before allowing access to a route
 */
exports.protect = async (req, res, next) => {
    try {
        let token;

        // 1. Check if token exists in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                message: 'You are not logged in! Please log in to get access.' 
            });
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Check if user still exists (they might have deleted their account but still have a token)
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ 
                message: 'The user belonging to this token no longer exists.' 
            });
        }

        // 4. GRANT ACCESS: Attach user to the request object
        req.user = currentUser;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
};

/**
 * CREDIT CHECK MIDDLEWARE
 * Specifically checks if a user has remaining credits OR a subscription
 */
exports.checkCredits = (req, res, next) => {
    // If user is subscribed or has more than 0 credits, proceed
    if (req.user.isSubscribed || req.user.credits > 0) {
        return next();
    }

    // Otherwise, block the action
    res.status(403).json({
        status: 'fail',
        message: "You've exhausted your free credits. Please upgrade to Pro to continue."
    });
};