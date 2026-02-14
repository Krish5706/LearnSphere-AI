/**
 * Enhanced Document Routes
 * Routes for improved roadmap generation with PDF-based dynamic content
 */

const express = require('express');
const router = express.Router();
const EnhancedDocumentController = require('../controllers/enhancedDocumentController');
const authMiddleware = require('../middleware/authMiddleware');

// Wrapper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * POST /api/v2/roadmap/generate-improved
 * Generate improved roadmap with PDF-based content
 */
router.post('/roadmap/generate-improved', authMiddleware.protect, asyncHandler(
    (req, res) => EnhancedDocumentController.generateImprovedRoadmap(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/status
 * Get roadmap generation status
 */
router.get('/roadmap/:documentId/status', authMiddleware.protect, asyncHandler(
    (req, res) => EnhancedDocumentController.getRoadmapStatus(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/detailed
 * Get full detailed roadmap
 */
router.get('/roadmap/:documentId/detailed', authMiddleware.protect, asyncHandler(
    (req, res) => EnhancedDocumentController.getDetailedRoadmap(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/phase/:phaseId
 * Get specific phase details
 */
router.get('/roadmap/:documentId/phase/:phaseId', authMiddleware.protect, asyncHandler(
    (req, res) => EnhancedDocumentController.getRoadmapPhase(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/phase/:phaseId/module/:moduleId
 * Get module details with all lessons
 */
router.get('/roadmap/:documentId/phase/:phaseId/module/:moduleId', authMiddleware.protect, asyncHandler(
    (req, res) => EnhancedDocumentController.getModuleDetails(req, res)
));

/**
 * POST /api/v2/roadmap/:documentId/regenerate
 * Regenerate roadmap with different learner level
 */
router.post('/roadmap/:documentId/regenerate', authMiddleware.protect, asyncHandler(
    (req, res) => EnhancedDocumentController.regenerateRoadmap(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/stats
 * Get roadmap statistics
 */
router.get('/roadmap/:documentId/stats', authMiddleware.protect, asyncHandler(
    (req, res) => EnhancedDocumentController.getRoadmapStats(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/export
 * Export roadmap as JSON
 */
router.get('/roadmap/:documentId/export', authMiddleware.protect, asyncHandler(
    (req, res) => EnhancedDocumentController.exportRoadmapJSON(req, res)
));

module.exports = router;

/**
 * POST /api/v2/roadmap/generate-improved
 * Generate improved roadmap with PDF-based content
 */
router.post('/roadmap/generate-improved', asyncHandler(
    (req, res) => EnhancedDocumentController.generateImprovedRoadmap(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/status
 * Get roadmap generation status
 */
router.get('/roadmap/:documentId/status', asyncHandler(
    (req, res) => EnhancedDocumentController.getRoadmapStatus(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/detailed
 * Get full detailed roadmap
 */
router.get('/roadmap/:documentId/detailed', asyncHandler(
    (req, res) => EnhancedDocumentController.getDetailedRoadmap(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/phase/:phaseId
 * Get specific phase details
 */
router.get('/roadmap/:documentId/phase/:phaseId', asyncHandler(
    (req, res) => EnhancedDocumentController.getRoadmapPhase(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/phase/:phaseId/module/:moduleId
 * Get module details with all lessons
 */
router.get('/roadmap/:documentId/phase/:phaseId/module/:moduleId', asyncHandler(
    (req, res) => EnhancedDocumentController.getModuleDetails(req, res)
));

/**
 * POST /api/v2/roadmap/:documentId/regenerate
 * Regenerate roadmap with different learner level
 */
router.post('/roadmap/:documentId/regenerate', asyncHandler(
    (req, res) => EnhancedDocumentController.regenerateRoadmap(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/stats
 * Get roadmap statistics
 */
router.get('/roadmap/:documentId/stats', asyncHandler(
    (req, res) => EnhancedDocumentController.getRoadmapStats(req, res)
));

/**
 * GET /api/v2/roadmap/:documentId/export
 * Export roadmap as JSON
 */
router.get('/roadmap/:documentId/export', asyncHandler(
    (req, res) => EnhancedDocumentController.exportRoadmapJSON(req, res)
));

module.exports = router;
