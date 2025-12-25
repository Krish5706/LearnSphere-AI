const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// This is the missing piece for AuthContext.js
router.get('/me', protect, authController.getMe);

module.exports = router;