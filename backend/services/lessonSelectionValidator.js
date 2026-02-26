/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LESSON SELECTION VALIDATOR SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Strict validation for lesson selections ensuring:
 * - ONLY explicitly selected lessons are processed
 * - NO auto-mapping or inference between phases
 * - NO assumption-based additions
 * - Each phase selection is treated independently
 * 
 * Rules:
 * 1. When user selects lessons from Phase 1, do NOT auto-select Phase 2 lessons
 * 2. Only process and return explicitly selected lessons
 * 3. Do not infer, auto-map, auto-complete, or auto-select related lessons
 * 4. Each phase selection must be treated independently
 * 5. If user selects multiple lessons manually, include ONLY those exact selections
 * 6. Clarify instead of assuming additional selections
 * 
 * @author LearnSphere AI
 * @version 1.0.0
 */

class LessonSelectionValidator {
    /**
     * Validate and filter lessons to include ONLY those explicitly selected
     * 
     * @param {Array} allLessons - All available lessons in roadmap
     * @param {Array} selectedLessonIds - Explicitly selected lesson IDs (from user)
     * @param {Object} options - Validation options
     * @returns {Object} - Validated result with selected lessons only
     */
    static validateAndFilterLessons(allLessons, selectedLessonIds, options = {}) {
        // Guard: Check inputs
        if (!Array.isArray(selectedLessonIds) || selectedLessonIds.length === 0) {
            return {
                success: false,
                message: 'No lesson selections provided. Cannot proceed.',
                selectedLessons: [],
                validation: {
                    allSelectionsExplicit: false,
                    phasesRepresented: [],
                    totalSelected: 0,
                    warnings: ['No explicit lesson selections found']
                }
            };
        }

        // Guard: Validate that all selections exist
        const validLessonIds = new Set(
            (allLessons || []).map(lesson => lesson.lessonId || lesson.id)
        );

        const invalidSelections = selectedLessonIds.filter(id => !validLessonIds.has(id));
        if (invalidSelections.length > 0) {
            return {
                success: false,
                message: `Invalid lesson selections: ${invalidSelections.join(', ')}`,
                selectedLessons: [],
                validation: {
                    allSelectionsExplicit: false,
                    phasesRepresented: [],
                    totalSelected: 0,
                    warnings: [`Found ${invalidSelections.length} invalid selections: ${invalidSelections.join(', ')}`],
                    invalidSelections: invalidSelections
                }
            };
        }

        // Filter to get ONLY selected lessons
        const selectedLessons = (allLessons || []).filter(lesson => {
            const lessonId = lesson.lessonId || lesson.id;
            return selectedLessonIds.includes(lessonId);
        });

        // Identify phases from selected lessons
        const phasesRepresented = new Set();
        selectedLessons.forEach(lesson => {
            if (lesson.phaseId || lesson.phaseName) {
                phasesRepresented.add(lesson.phaseId || lesson.phaseName);
            }
        });

        // Validation result
        const validation = {
            allSelectionsExplicit: true,
            totalSelected: selectedLessons.length,
            totalRequested: selectedLessonIds.length,
            phasesRepresented: Array.from(phasesRepresented),
            warnings: []
        };

        // Add warnings if selections span multiple phases
        if (phasesRepresented.size > 1) {
            validation.warnings.push(
                `Selections span ${phasesRepresented.size} phases. Remember: Each phase is treated independently.`
            );
        }

        return {
            success: true,
            message: `Successfully validated ${selectedLessons.length} explicit lesson selections`,
            selectedLessons: selectedLessons,
            validation: validation
        };
    }

    /**
     * Filter lessons by phase WITHOUT cross-phase inference
     * 
     * @param {Array} allLessons - All available lessons
     * @param {String} phaseId - Specific phase ID
     * @param {Array} selectedLessonIds - Explicitly selected lesson IDs for this phase
     * @returns {Object} - Validated lessons for this phase only
     */
    static filterLessonsByPhaseStrict(allLessons, phaseId, selectedLessonIds) {
        // Get ALL lessons for this phase (unfiltered)
        const phaseLessons = (allLessons || []).filter(lesson => {
            return (lesson.phaseId === phaseId || lesson.phaseName === phaseId);
        });

        if (phaseLessons.length === 0) {
            return {
                success: false,
                message: `No lessons found for phase: ${phaseId}`,
                selectedLessons: [],
                warnings: []
            };
        }

        // If no specific selections, return empty (don't auto-include anything)
        if (!selectedLessonIds || selectedLessonIds.length === 0) {
            return {
                success: true,
                message: `Phase ${phaseId} has ${phaseLessons.length} available lessons. No selections made.`,
                selectedLessons: [],
                availableLessons: phaseLessons,
                warnings: ['No explicit selections for this phase. Returning empty selection.']
            };
        }

        // Filter to get ONLY selected lessons from this phase
        const selectedLessons = phaseLessons.filter(lesson => {
            const lessonId = lesson.lessonId || lesson.id;
            return selectedLessonIds.includes(lessonId);
        });

        // Check for selections from other phases (cross-phase selection attempt)
        const selectedIds = new Set(selectedLessonIds);
        const thisPhaseIds = new Set(phaseLessons.map(l => l.lessonId || l.id));
        const crossPhaseSelections = Array.from(selectedIds).filter(id => !thisPhaseIds.has(id));

        let warnings = [];
        if (crossPhaseSelections.length > 0) {
            warnings.push(
                `⚠️ IGNORED cross-phase selections: ${crossPhaseSelections.join(', ')}. ` +
                `Each phase is treated independently. Include only lessons from Phase ${phaseId}.`
            );
        }

        return {
            success: true,
            message: `Phase ${phaseId}: ${selectedLessons.length} lessons selected (${phaseLessons.length} available)`,
            selectedLessons: selectedLessons,
            availableLessons: phaseLessons,
            validation: {
                phaseId: phaseId,
                totalAvailable: phaseLessons.length,
                totalSelected: selectedLessons.length,
                crossPhaseAttempts: crossPhaseSelections.length
            },
            warnings: warnings
        };
    }

    /**
     * Validate multi-phase lesson selections
     * Each phase's selections are treated completely independently
     * 
     * @param {Array} allLessons - All available lessons
     * @param {Object} phaseSelections - { phaseId: [lessonIds], ... }
     * @returns {Object} - Validated selections by phase
     */
    static validateMultiPhaseSelections(allLessons, phaseSelections) {
        const result = {
            success: true,
            selectedByPhase: {},
            validation: {
                totalPhases: 0,
                totalLessonsSelected: 0,
                phasesWithSelections: [],
                warnings: []
            }
        };

        // Process each phase independently
        for (const [phaseId, lessonIds] of Object.entries(phaseSelections || {})) {
            const phaseResult = this.filterLessonsByPhaseStrict(allLessons, phaseId, lessonIds);
            
            result.selectedByPhase[phaseId] = phaseResult;
            result.validation.totalLessonsSelected += phaseResult.selectedLessons.length;
            
            if (phaseResult.selectedLessons.length > 0) {
                result.validation.phasesWithSelections.push(phaseId);
            }

            if (phaseResult.warnings && phaseResult.warnings.length > 0) {
                result.validation.warnings.push(...phaseResult.warnings);
            }
        }

        result.validation.totalPhases = Object.keys(phaseSelections || {}).length;

        return result;
    }

    /**
     * Check if lesson selections are explicit (no auto-mapping)
     * 
     * @param {Array} selectedLessons - User-selected lessons
     * @param {Array} inferenceLessons - Lessons that might have been auto-added
     * @returns {Object} - Assessment of selection quality
     */
    static assertSelectionsAreExplicit(selectedLessons, inferenceLessons = []) {
        const selectedIds = new Set(selectedLessons.map(l => l.lessonId || l.id));
        const inferenceIds = new Set(inferenceLessons.map(l => l.lessonId || l.id));

        // Find any overlap (inferred lessons that were also in selections)
        const overlap = Array.from(selectedIds).filter(id => inferenceIds.has(id));

        return {
            isExplicit: inferenceLessons.length === 0 || overlap.length === 0,
            message: inferenceLessons.length === 0 
                ? 'All selections are explicit (no inferences detected)'
                : `❌ FOUND ${inferenceLessons.length} inferred lessons. Selections must be 100% explicit.`,
            autoAddedCount: inferenceLessons.length - overlap.length,
            violations: Array.from(inferenceIds).filter(id => !selectedIds.has(id))
        };
    }

    /**
     * Extract ONLY the directly selected lessons from a roadmap
     * Useful for filtering a complete roadmap to show only selected items
     * 
     * @param {Object} roadmap - Complete roadmap structure
     * @param {Array} selectedLessonIds - Explicit selections
     * @returns {Object} - Filtered roadmap with only selected lessons
     */
    static filterRoadmapByExplicitSelections(roadmap, selectedLessonIds) {
        if (!roadmap || !roadmap.learningPath) {
            return {
                success: false,
                message: 'Invalid roadmap structure',
                filteredRoadmap: null
            };
        }

        const selectedIds = new Set(selectedLessonIds);
        const filteredLearningPath = [];

        // Process each phase
        for (const phase of roadmap.learningPath) {
            const filteredModules = [];

            // Process each module in phase
            for (const module of phase.modules || []) {
                // Filter lessons to only selected ones
                const filteredLessons = (module.lessons || []).filter(lesson => {
                    return selectedIds.has(lesson.lessonId || lesson.id);
                });

                // If module has selected lessons, include it with filtered lessons
                if (filteredLessons.length > 0) {
                    filteredModules.push({
                        ...module,
                        lessons: filteredLessons
                    });
                }
            }

            // If phase has selected lessons (via modules), include the phase
            if (filteredModules.length > 0) {
                filteredLearningPath.push({
                    ...phase,
                    modules: filteredModules
                });
            }
        }

        return {
            success: true,
            message: `Roadmap filtered to ${selectedLessonIds.length} explicit lesson selections`,
            filteredRoadmap: {
                ...roadmap,
                learningPath: filteredLearningPath
            },
            validation: {
                originalPhases: roadmap.learningPath.length,
                filteredPhases: filteredLearningPath.length,
                selectedLessons: selectedLessonIds.length
            }
        };
    }

    /**
     * Report potential auto-selection violations
     * Helps identify if the system is adding unselected items
     * 
     * @param {Array} expectedLessons - User's explicit selections
     * @param {Array} actualReturnedLessons - What the system returned
     * @returns {Object} - Violation report
     */
    static reportSelectionViolations(expectedLessons, actualReturnedLessons) {
        const expectedIds = new Set(expectedLessons.map(l => l.lessonId || l.id));
        const actualIds = new Set(actualReturnedLessons.map(l => l.lessonId || l.id));

        const unauthorized = Array.from(actualIds).filter(id => !expectedIds.has(id));
        const missing = Array.from(expectedIds).filter(id => !actualIds.has(id));

        return {
            isViolation: unauthorized.length > 0 || missing.length > 0,
            unauthorizedAdditions: unauthorized.length,
            unauthorizedLessons: Array.from(unauthorized),
            missingSelections: missing.length,
            missingLessons: Array.from(missing),
            message: unauthorized.length > 0 
                ? `❌ VIOLATION: System returned ${unauthorized.length} unselected lessons: ${unauthorized.join(', ')}`
                : missing.length > 0
                    ? `⚠️ WARNING: System returned fewer lessons than selected (${missing.length} missing)`
                    : '✅ OK: System returned exactly what was selected'
        };
    }
}

module.exports = LessonSelectionValidator;
