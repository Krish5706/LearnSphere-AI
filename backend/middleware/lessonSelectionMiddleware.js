/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LESSON SELECTION ENFORCEMENT MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Middleware to enforce strict lesson selection validation:
 * - Only explicitly selected lessons are processed
 * - No auto-mapping between phases
 * - No inference-based additions
 * 
 * Usage:
 * router.post('/lessons/filter', validateLessonSelection, controller.filterLessons);
 * 
 * @author LearnSphere AI
 * @version 1.0.0
 */

const LessonSelectionValidator = require('../services/lessonSelectionValidator');

/**
 * Middleware to validate lesson selections
 * Ensures only explicitly selected lessons are processed
 * 
 * Expects request body:
 * {
 *   selectedLessonIds: [array of lesson IDs],
 *   phaseId: [optional - for phase-specific filtering],
 *   allLessons: [optional - complete lessons array for validation]
 * }
 */
const validateLessonSelection = (req, res, next) => {
    try {
        const { selectedLessonIds, phaseId, allLessons } = req.body;

        // Guard: No selections provided
        if (!selectedLessonIds || !Array.isArray(selectedLessonIds) || selectedLessonIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No explicit lesson selections provided',
                error: 'INVALID_SELECTIONS',
                required: ['selectedLessonIds (non-empty array)']
            });
        }

        // Guard: Invalid selection count
        if (selectedLessonIds.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Selection limit exceeded (max 1000 lessons)',
                error: 'SELECTION_LIMIT_EXCEEDED'
            });
        }

        // Attach validator result to request for later use
        req.lessonValidation = {
            selectedLessonIds: selectedLessonIds,
            phaseId: phaseId,
            timestamp: new Date(),
            source: 'validateLessonSelection middleware'
        };

        next();
    } catch (error) {
        console.error('Lesson validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lesson validation failed',
            error: error.message
        });
    }
};

/**
 * Middleware to enforce strict filtering
 * Should be used AFTER validateLessonSelection
 */
const enforceExplicitSelection = (req, res, next) => {
    try {
        if (!req.lessonValidation || !req.lessonValidation.selectedLessonIds) {
            return res.status(400).json({
                success: false,
                message: 'Lesson validation not performed. Call validateLessonSelection first.',
                error: 'VALIDATION_REQUIRED'
            });
        }

        // Attach enforcement config
        req.enforcementConfig = {
            allowAutoMapping: false,
            allowInference: false,
            treatPhasesIndependently: true,
            requireExplicitSelection: true
        };

        next();
    } catch (error) {
        console.error('Enforcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Could not enforce selection rules',
            error: error.message
        });
    }
};

/**
 * Response wrapper to ensure only selected lessons are returned
 * 
 * Usage:
 * const response = wrapLessonResponse(selectedLessonIds, lessons);
 */
const wrapLessonResponse = (selectedLessonIds, returnedLessons) => {
    const selectedIds = new Set(selectedLessonIds);
    const returnedIds = new Set(returnedLessons.map(l => l.lessonId || l.id));

    // Check for violations
    const violations = LessonSelectionValidator.reportSelectionViolations(
        selectedLessonIds.map(id => ({ lessonId: id })),
        returnedLessons
    );

    return {
        success: !violations.isViolation,
        data: violations.isViolation ? null : returnedLessons,
        validation: {
            selectedCount: selectedLessonIds.length,
            returnedCount: returnedLessons.length,
            isExact: selectedLessonIds.length === returnedLessons.length &&
                     Array.from(selectedIds).every(id => returnedIds.has(id))
        },
        violations: violations.isViolation ? violations : null
    };
};

/**
 * Middleware to report violations if system accidentally returns more lessons than selected
 */
const reportSelectionViolations = (req, res, next) => {
    // Wrap original json method
    const originalJson = res.json.bind(res);

    res.json = function(data) {
        // Check if response contains lessons
        if (data && data.selectedLessons && Array.isArray(data.selectedLessons)) {
            const selectedCount = req.lessonValidation?.selectedLessonIds?.length || 0;
            const returnedCount = data.selectedLessons.length;

            if (returnedCount > selectedCount && selectedCount > 0) {
                // Violation detected
                console.error(`⚠️ LESSON SELECTION VIOLATION DETECTED!`);
                console.error(`   Selected: ${selectedCount} lessons`);
                console.error(`   Returned: ${returnedCount} lessons`);
                console.error(`   Unauthorized additions: ${returnedCount - selectedCount}`);
                
                data.__violations = {
                    detected: true,
                    message: 'System returned more lessons than user selected',
                    selectedCount: selectedCount,
                    returnedCount: returnedCount,
                    unauthorized: returnedCount - selectedCount
                };
            }
        }

        return originalJson(data);
    };

    next();
};

module.exports = {
    validateLessonSelection,
    enforceExplicitSelection,
    wrapLessonResponse,
    reportSelectionViolations
};
