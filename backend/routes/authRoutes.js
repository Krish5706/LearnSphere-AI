const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// This is the missing piece for AuthContext.js
router.get('/me', protect, authController.getMe);
router.post('/demo-payment/initiate', protect, authController.initiateDemoPayment);
router.post('/demo-payment/confirm', protect, authController.confirmDemoPayment);
router.post('/demo-upgrade', protect, authController.demoUpgrade);

module.exports = router;