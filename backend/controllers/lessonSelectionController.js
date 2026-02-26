/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LESSON SELECTION CONTROLLER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Handles lesson filtering with strict selection validation.
 * Ensures only explicitly selected lessons are returned.
 * 
 * Endpoints:
 * - POST /api/lessons/filter - Filter lessons by explicit selections
 * - POST /api/lessons/validate-selections - Validate user selections
 * - GET /api/lessons/:documentId/phase/:phaseId - Get lessons for a phase
 * 
 * @author LearnSphere AI
 * @version 1.0.0
 */

const Document = require('../models/Document');
const LessonSelectionValidator = require('../services/lessonSelectionValidator');
const { wrapLessonResponse } = require('../middleware/lessonSelectionMiddleware');

class LessonSelectionController {
    /**
     * Filter lessons by explicit user selections
     * ONLY returns the exact lessons the user selected
     * 
     * POST /api/lessons/filter
     * Body: {
     *   documentId: string,
     *   selectedLessonIds: [string],
     *   phaseId?: string (optional - filter by specific phase)
     * }
     */
    static async filterLessonsBySelection(req, res) {
        try {
            const { documentId, selectedLessonIds, phaseId } = req.body;

            // Validate input
            if (!documentId) {
                return res.status(400).json({
                    success: false,
                    message: 'documentId is required'
                });
            }

            if (!Array.isArray(selectedLessonIds) || selectedLessonIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'selectedLessonIds must be a non-empty array'
                });
            }

            // Get document
            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Verify ownership
            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: This is not your document'
                });
            }

            // Collect all lessons from roadmap
            const allLessons = [];
            if (document.enhancedRoadmap && document.enhancedRoadmap.learningPath) {
                for (const phase of document.enhancedRoadmap.learningPath) {
                    for (const module of phase.modules || []) {
                        for (const lesson of module.lessons || []) {
                            allLessons.push({
                                ...lesson,
                                phaseId: phase.phaseId,
                                phaseName: phase.phaseName,
                                moduleId: module.moduleId,
                                moduleName: module.moduleTitle
                            });
                        }
                    }
                }
            }

            let result;

            // Filter by phase if specified
            if (phaseId) {
                result = LessonSelectionValidator.filterLessonsByPhaseStrict(
                    allLessons,
                    phaseId,
                    selectedLessonIds
                );
            } else {
                // Filter across all phases (each phase independently)
                result = LessonSelectionValidator.validateAndFilterLessons(
                    allLessons,
                    selectedLessonIds
                );
            }

            // Verify no violations occurred
            if (result.success && result.selectedLessons.length < selectedLessonIds.length) {
                const found = new Set(result.selectedLessons.map(l => l.lessonId));
                const notFound = selectedLessonIds.filter(id => !found.has(id));
                result.warnings = result.warnings || [];
                result.warnings.push(`⚠️ Could not find these selections: ${notFound.join(', ')}`);
            }

            return res.status(result.success ? 200 : 400).json({
                success: result.success,
                message: result.message,
                selectedLessons: result.selectedLessons,
                validation: result.validation,
                warnings: result.warnings || []
            });

        } catch (error) {
            console.error('Lesson filtering error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to filter lessons',
                error: error.message
            });
        }
    }

    /**
     * Validate lesson selections before processing
     * Checks if selections are valid and explicit
     * 
     * POST /api/lessons/validate-selections
     * Body: {
     *   documentId: string,
     *   phaseSelections: {
     *     phase_1: [lessonIds],
     *     phase_2: [lessonIds],
     *     ...
     *   }
     * }
     */
    static async validateSelections(req, res) {
        try {
            const { documentId, phaseSelections } = req.body;

            if (!documentId) {
                return res.status(400).json({
                    success: false,
                    message: 'documentId is required'
                });
            }

            if (!phaseSelections || Object.keys(phaseSelections).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'phaseSelections must be provided and non-empty'
                });
            }

            // Get document
            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Verify ownership
            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            // Collect all lessons
            const allLessons = [];
            if (document.enhancedRoadmap && document.enhancedRoadmap.learningPath) {
                for (const phase of document.enhancedRoadmap.learningPath) {
                    for (const module of phase.modules || []) {
                        for (const lesson of module.lessons || []) {
                            allLessons.push({
                                ...lesson,
                                phaseId: phase.phaseId,
                                phaseName: phase.phaseName
                            });
                        }
                    }
                }
            }

            // Validate multi-phase selections
            const validation = LessonSelectionValidator.validateMultiPhaseSelections(
                allLessons,
                phaseSelections
            );

            return res.status(200).json({
                success: validation.success,
                message: 'Selection validation complete',
                validation: validation.validation,
                selectedByPhase: Object.entries(validation.selectedByPhase).reduce((acc, [phaseId, result]) => {
                    acc[phaseId] = {
                        success: result.success,
                        totalSelected: result.selectedLessons.length,
                        totalAvailable: result.availableLessons?.length || 0,
                        warnings: result.warnings || []
                    };
                    return acc;
                }, {})
            });

        } catch (error) {
            console.error('Validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Validation failed',
                error: error.message
            });
        }
    }

    /**
     * Get lessons for a specific phase
     * Can optionally filter by explicit selections
     * 
     * GET /api/lessons/:documentId/phase/:phaseId
     * Query: ?selectedLessonIds=les_1,les_2,les_3 (optional)
     */
    static async getLessonsByPhase(req, res) {
        try {
            const { documentId, phaseId } = req.params;
            const { selectedLessonIds } = req.query;

            // Get document
            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Verify ownership
            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            // Find phase
            const phase = document.enhancedRoadmap?.learningPath?.find(
                p => p.phaseId === phaseId
            );

            if (!phase) {
                return res.status(404).json({
                    success: false,
                    message: `Phase not found: ${phaseId}`
                });
            }

            // Collect all lessons in phase
            const allLessons = [];
            for (const module of phase.modules || []) {
                for (const lesson of module.lessons || []) {
                    allLessons.push({
                        ...lesson,
                        phaseId: phase.phaseId,
                        phaseName: phase.phaseName,
                        moduleId: module.moduleId,
                        moduleName: module.moduleTitle
                    });
                }
            }

            // If no selections provided, return all available
            if (!selectedLessonIds) {
                return res.status(200).json({
                    success: true,
                    message: `Found ${allLessons.length} lessons in phase ${phaseId}`,
                    phaseId: phaseId,
                    phaseName: phase.phaseName,
                    lessons: allLessons,
                    note: 'Returning all available lessons. Use selectedLessonIds query parameter to filter.'
                });
            }

            // Parse selections
            const selections = selectedLessonIds.split(',').filter(id => id.trim());
            const result = LessonSelectionValidator.filterLessonsByPhaseStrict(
                allLessons,
                phaseId,
                selections
            );

            return res.status(result.success ? 200 : 400).json({
                success: result.success,
                message: result.message,
                phaseId: phaseId,
                phaseName: phase.phaseName,
                selectedLessons: result.selectedLessons,
                availableLessons: result.availableLessons?.length || 0,
                validation: result.validation,
                warnings: result.warnings || []
            });

        } catch (error) {
            console.error('Get lessons error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve lessons',
                error: error.message
            });
        }
    }

    /**
     * Get filtered roadmap with only selected lessons
     * Returns the complete roadmap structure but with only explicitly selected lessons
     * 
     * POST /api/lessons/:documentId/filter-roadmap
     * Body: {
     *   selectedLessonIds: [string]
     * }
     */
    static async getFilteredRoadmap(req, res) {
        try {
            const { documentId } = req.params;
            const { selectedLessonIds } = req.body;

            if (!documentId) {
                return res.status(400).json({
                    success: false,
                    message: 'documentId is required'
                });
            }

            if (!Array.isArray(selectedLessonIds) || selectedLessonIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'selectedLessonIds must be a non-empty array'
                });
            }

            // Get document
            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Verify ownership
            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            if (!document.enhancedRoadmap) {
                return res.status(404).json({
                    success: false,
                    message: 'No roadmap found for this document'
                });
            }

            // Filter roadmap
            const filtered = LessonSelectionValidator.filterRoadmapByExplicitSelections(
                document.enhancedRoadmap,
                selectedLessonIds
            );

            return res.status(filtered.success ? 200 : 400).json({
                success: filtered.success,
                message: filtered.message,
                roadmap: filtered.filteredRoadmap,
                validation: filtered.validation,
                originalLessons: selectedLessonIds.length
            });

        } catch (error) {
            console.error('Filter roadmap error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to filter roadmap',
                error: error.message
            });
        }
    }
}

module.exports = LessonSelectionController;
