const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All routes here require a valid login token
router.use(protect);

// GET /api/users/profile - Fetches current user data and credits
router.get('/profile', userController.getProfile);

// PUT /api/users/profile - Updates user profile (e.g., name)
router.put('/profile', userController.updateProfile);

// PATCH /api/users/upgrade - Mock route to add credits or change subscription
router.patch('/upgrade', userController.upgradeAccount);

module.exports = router;