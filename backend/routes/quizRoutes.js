/**
 * Quiz Routes
 * API endpoints for quiz management
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

// All routes require authentication
router.use(protect);

/**
 * POST /api/quizzes/module
 * Create a module quiz
 */
router.post('/module', quizController.createModuleQuiz);

/**
 * POST /api/quizzes/phase
 * Create a phase-end quiz
 */
router.post('/phase', quizController.createPhaseQuiz);

/**
 * POST /api/quizzes/final
 * Create final comprehensive quiz
 */
router.post('/final', quizController.createFinalQuiz);

/**
 * GET /api/quizzes/:quizId
 * Get quiz details
 */
router.get('/:quizId', quizController.getQuiz);

/**
 * POST /api/quizzes/:quizId/submit
 * Submit quiz answers
 */
router.post('/:quizId/submit', quizController.submitQuiz);

/**
 * GET /api/quizzes/tracker/:roadmapId
 * Get score tracker for a roadmap
 */
router.get('/tracker/:roadmapId', quizController.getScoreTracker);

/**
 * GET /api/quizzes/roadmap/:roadmapId
 * Get all quizzes for a roadmap
 */
router.get('/roadmap/:roadmapId', quizController.getQuizzesByRoadmap);

module.exports = router;
