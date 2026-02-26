/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LESSON SELECTION ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Routes for strict lesson selection validation and filtering.
 * All endpoints enforce:
 * - Explicit selection only (no auto-mapping)
 * - Phase independence (each phase is separate)
 * - No inference-based additions
 * 
 * @author LearnSphere AI
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const LessonSelectionController = require('../controllers/lessonSelectionController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    validateLessonSelection,
    enforceExplicitSelection,
    reportSelectionViolations
} = require('../middleware/lessonSelectionMiddleware');

// All routes require authentication
router.use(authMiddleware.protect);

/**
 * POST /api/lessons/filter
 * 
 * Filter lessons by explicit user selections
 * STRICTLY returns ONLY the selected lessons - nothing more, nothing less
 * 
 * Rules enforced:
 * - Only explicitly selected lessons are returned
 * - No auto-mapping between phases
 * - No inference-based additions
 * - Each phase is treated independently
 * 
 * Body: {
 *   documentId: string (required),
 *   selectedLessonIds: [string] (required, non-empty),
 *   phaseId?: string (optional - filter by specific phase)
 * }
 * 
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   selectedLessons: [object],
 *   validation: object,
 *   warnings: [string]
 * }
 */
router.post(
    '/filter',
    validateLessonSelection,
    enforceExplicitSelection,
    reportSelectionViolations,
    (req, res) => LessonSelectionController.filterLessonsBySelection(req, res)
);

/**
 * POST /api/lessons/validate-selections
 * 
 * Validate multi-phase lesson selections
 * Checks if selections are valid and explicit before processing
 * 
 * Each phase is treated COMPLETELY independently - no cross-phase interference
 * 
 * Body: {
 *   documentId: string (required),
 *   phaseSelections: {
 *     phase_1: [lessonIds],
 *     phase_2: [lessonIds],
 *     ...
 *   }
 * }
 * 
 * Returns: {
 *   success: boolean,
 *   validation: {
 *     totalPhases: number,
 *     totalLessonsSelected: number,
 *     phasesWithSelections: [string],
 *     warnings: [string]
 *   },
 *   selectedByPhase: object
 * }
 */
router.post(
    '/validate-selections',
    (req, res) => LessonSelectionController.validateSelections(req, res)
);

/**
 * GET /api/lessons/:documentId/phase/:phaseId
 * 
 * Get lessons for a specific phase
 * Optionally filter by explicit selections if provided
 * 
 * Query Parameters:
 * - selectedLessonIds: comma-separated lesson IDs (optional)
 *   Format: ?selectedLessonIds=les_1,les_2,les_3
 * 
 * Returns: {
 *   success: boolean,
 *   phaseId: string,
 *   phaseName: string,
 *   lessons: [object],
 *   selectedLessons?: [object] (if selections provided),
 *   validation?: object,
 *   warnings?: [string]
 * }
 */
router.get(
    '/:documentId/phase/:phaseId',
    (req, res) => LessonSelectionController.getLessonsByPhase(req, res)
);

/**
 * POST /api/lessons/:documentId/filter-roadmap
 * 
 * Get filtered roadmap with ONLY selected lessons
 * Returns complete roadmap structure but includes only explicitly selected lessons
 * 
 * Body: {
 *   selectedLessonIds: [string] (required, non-empty)
 * }
 * 
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   roadmap: object (filtered),
 *   validation: {
 *     originalPhases: number,
 *     filteredPhases: number,
 *     selectedLessons: number
 *   }
 * }
 */
router.post(
    '/:documentId/filter-roadmap',
    validateLessonSelection,
    (req, res) => LessonSelectionController.getFilteredRoadmap(req, res)
);

/**
 * Documentation endpoints
 */

/**
 * GET /api/lessons/docs/rules
 * Returns the strict lesson selection validation rules
 */
router.get('/docs/rules', (req, res) => {
    res.status(200).json({
        title: 'Lesson Selection Validation Rules',
        rules: [
            'Rule 1: When user selects lessons from Phase 1, do NOT auto-select Phase 2 lessons',
            'Rule 2: Only process and return explicitly selected lessons',
            'Rule 3: Do not infer, auto-map, auto-complete, or auto-select related lessons',
            'Rule 4: Each phase selection must be treated independently',
            'Rule 5: If user selects multiple lessons manually, include ONLY those exact selections',
            'Rule 6: Clarify instead of assuming additional selections'
        ],
        enforcement: [
            'All endpoints validate selections before processing',
            'System rejects requests with no explicit selections',
            'Cross-phase selections are ignored with warnings',
            'Violations are reported in response',
            'Complete audit trail of selections vs returned lessons'
        ],
        endpoints: [
            {
                method: 'POST',
                path: '/api/lessons/filter',
                description: 'Filter lessons by explicit selections'
            },
            {
                method: 'POST',
                path: '/api/lessons/validate-selections',
                description: 'Validate multi-phase selections'
            },
            {
                method: 'GET',
                path: '/api/lessons/:documentId/phase/:phaseId',
                description: 'Get lessons for a phase with optional filtering'
            },
            {
                method: 'POST',
                path: '/api/lessons/:documentId/filter-roadmap',
                description: 'Get filtered roadmap with only selected lessons'
            }
        ]
    });
});

module.exports = router;
