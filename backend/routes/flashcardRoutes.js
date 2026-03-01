/**
 * Flashcard Routes
 * 
 * API endpoints for Spaced Repetition System (SRS)
 * All routes require authentication
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const flashcardController = require('../controllers/flashcardController');

// All routes require authentication
router.use(protect);

// ==============================================
// FLASHCARD CRUD OPERATIONS
// ==============================================

/**
 * POST /api/flashcards
 * Create a new flashcard manually
 */
router.post('/', flashcardController.createFlashcard);

/**
 * POST /api/flashcards/bulk
 * Create multiple flashcards at once
 */
router.post('/bulk', flashcardController.createBulkFlashcards);

/**
 * GET /api/flashcards
 * Get all flashcards (with filtering, pagination)
 */
router.get('/', flashcardController.getFlashcards);

/**
 * GET /api/flashcards/:cardId
 * Get a single flashcard
 */
router.get('/:cardId', flashcardController.getFlashcard);

/**
 * PUT /api/flashcards/:cardId
 * Update a flashcard
 */
router.put('/:cardId', flashcardController.updateFlashcard);

/**
 * DELETE /api/flashcards/:cardId
 * Delete a flashcard
 */
router.delete('/:cardId', flashcardController.deleteFlashcard);

// ==============================================
// AI GENERATION
// ==============================================

/**
 * POST /api/flashcards/generate
 * Generate flashcards from document content using AI
 */
router.post('/generate', flashcardController.generateFlashcards);

/**
 * POST /api/flashcards/generate-from-keypoints
 * Generate flashcards from document key points
 */
router.post('/generate-from-keypoints', flashcardController.generateFromKeyPoints);

// ==============================================
// DECK MANAGEMENT
// ==============================================

/**
 * GET /api/flashcards/decks
 * Get all decks with card counts
 */
router.get('/decks/list', flashcardController.getDecks);

/**
 * DELETE /api/flashcards/deck/:deckName
 * Delete all cards in a deck
 */
router.delete('/deck/:deckName', flashcardController.deleteDeck);

/**
 * PATCH /api/flashcards/deck/:deckName/rename
 * Rename a deck
 */
router.patch('/deck/:deckName/rename', flashcardController.renameDeck);

// ==============================================
// STUDY SESSION & SRS
// ==============================================

/**
 * GET /api/flashcards/study/due
 * Get cards due for review (study session)
 */
router.get('/study/due', flashcardController.getDueCards);

/**
 * POST /api/flashcards/:cardId/review
 * Submit review for a flashcard (updates SRS)
 * 
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect but recognized
 * 2 - Incorrect but easy to recall
 * 3 - Correct with difficulty
 * 4 - Correct with hesitation
 * 5 - Perfect instant recall
 * 
 * User-friendly mapping:
 * "Again" = 0
 * "Hard" = 2
 * "Good" = 3
 * "Easy" = 5
 */
router.post('/:cardId/review', flashcardController.submitReview);

/**
 * POST /api/flashcards/reviews/batch
 * Submit multiple reviews at once (for offline sync)
 */
router.post('/reviews/batch', flashcardController.submitBatchReviews);

/**
 * POST /api/flashcards/evaluate-answer
 * AI-based answer evaluation (handles typos, grammar, different wording)
 */
router.post('/evaluate-answer', flashcardController.evaluateAnswer);

// ==============================================
// STATISTICS & ANALYTICS
// ==============================================

/**
 * GET /api/flashcards/stats/overview
 * Get comprehensive study statistics
 */
router.get('/stats/overview', flashcardController.getStudyStats);

/**
 * GET /api/flashcards/stats/forecast
 * Get review forecast for upcoming days
 */
router.get('/stats/forecast', flashcardController.getReviewForecast);

// ==============================================
// CARD MANAGEMENT
// ==============================================

/**
 * PATCH /api/flashcards/:cardId/archive
 * Archive or unarchive a flashcard
 */
router.patch('/:cardId/archive', flashcardController.toggleArchive);

/**
 * PATCH /api/flashcards/:cardId/suspend
 * Suspend or unsuspend a flashcard
 */
router.patch('/:cardId/suspend', flashcardController.toggleSuspend);

/**
 * POST /api/flashcards/:cardId/reset
 * Reset flashcard progress
 */
router.post('/:cardId/reset', flashcardController.resetFlashcard);

module.exports = router;
