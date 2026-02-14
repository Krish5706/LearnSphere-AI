/**
 * Enhanced Document Controller
 * Integrates Improved Roadmap Service with PDF-based dynamic content generation
 */

const ImprovedRoadmapService = require("../services/improvedRoadmapService");
const pdfParseService = require("../services/pdfParseService");
const Document = require("../models/Document");
const User = require("../models/User");
const fs = require("fs");

class EnhancedDocumentController {
    /**
     * Generate Improved Roadmap with PDF-based content
     * This replaces the old static roadmap generation
     */
    static async generateImprovedRoadmap(req, res) {
        try {
            const { documentId, learnerLevel = 'beginner' } = req.body;

            if (!documentId) {
                return res.status(400).json({ 
                    message: "Document ID is required" 
                });
            }

            if (!process.env.GEMINI_API_KEY) {
                return res.status(500).json({ 
                    message: "Gemini API not configured" 
                });
            }

            // Validate learner level
            const validLevels = ['beginner', 'intermediate', 'advanced'];
            if (!validLevels.includes(learnerLevel)) {
                return res.status(400).json({ 
                    message: "Invalid learner level. Must be: beginner, intermediate, or advanced" 
                });
            }

            // Get document
            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({ 
                    message: "Document not found" 
                });
            }

            // Verify document belongs to user
            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ 
                    message: "Unauthorized: This is not your document" 
                });
            }

            // Check if PDF file exists
            const pdfPath = document.filePath;
            if (!fs.existsSync(pdfPath)) {
                return res.status(404).json({ 
                    message: "PDF file not found on server" 
                });
            }

            console.log(`\n🔄 Generating improved roadmap for: ${document.fileName}`);
            console.log(`   User: ${req.user._id}`);
            console.log(`   Learner Level: ${learnerLevel}`);

            // Extract PDF content
            const pdfContent = await pdfParseService.extractPdfText(pdfPath);
            
            if (!pdfContent || pdfContent.length < 100) {
                return res.status(400).json({ 
                    message: "PDF content is too short or empty. Minimum 100 characters required." 
                });
            }

            // Initialize improved roadmap service
            const roadmapService = new ImprovedRoadmapService(process.env.GEMINI_API_KEY);

            // Generate improved roadmap
            console.log('🚀 Starting AI-powered roadmap generation...');
            const improvedRoadmap = await roadmapService.generateCompleteRoadmapImproved(
                pdfContent,
                learnerLevel
            );

            // Save roadmap to document
            document.roadmap = improvedRoadmap;
            document.roadmapGeneratedAt = new Date();
            document.roadmapGenerationMethod = 'improved-dynamic-pdf-based';
            await document.save();

            console.log(`✅ Roadmap successfully generated and saved`);

            return res.status(200).json({
                message: "Improved roadmap generated successfully",
                success: true,
                roadmap: improvedRoadmap,
                documentId: document._id,
                isEmpty: false
            });

        } catch (error) {
            console.error('❌ Enhanced roadmap generation error:', error);
            return res.status(500).json({
                message: `Failed to generate roadmap: ${error.message}`,
                error: error.message
            });
        }
    }

    /**
     * Get roadmap generation status
     */
    static async getRoadmapStatus(req, res) {
        try {
            const { documentId } = req.params;

            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({ message: "Document not found" });
            }

            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized" });
            }

            return res.status(200).json({
                hasRoadmap: !!document.roadmap,
                generatedAt: document.roadmapGeneratedAt,
                method: document.roadmapGenerationMethod || 'unknown',
                structure: document.roadmap ? {
                    mainTopic: document.roadmap.mainTopic,
                    phases: document.roadmap.phases?.length || 0,
                    modules: document.roadmap.statistics?.totalModules || 0,
                    lessons: document.roadmap.statistics?.totalLessons || 0
                } : null
            });
        } catch (error) {
            console.error('Error getting roadmap status:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get detailed roadmap for a document
     */
    static async getDetailedRoadmap(req, res) {
        try {
            const { documentId } = req.params;

            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({ message: "Document not found" });
            }

            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized" });
            }

            if (!document.roadmap) {
                return res.status(404).json({ 
                    message: "No roadmap available for this document",
                    empty: true 
                });
            }

            return res.status(200).json({
                success: true,
                roadmap: document.roadmap,
                isEmpty: false
            });

        } catch (error) {
            console.error('Error getting detailed roadmap:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get roadmap phase details
     */
    static async getRoadmapPhase(req, res) {
        try {
            const { documentId, phaseId } = req.params;

            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({ message: "Document not found" });
            }

            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized" });
            }

            if (!document.roadmap) {
                return res.status(404).json({ message: "No roadmap available" });
            }

            const phase = document.roadmap.phases.find(p => p.phaseId === phaseId);
            if (!phase) {
                return res.status(404).json({ message: "Phase not found" });
            }

            return res.status(200).json({
                success: true,
                phase: phase
            });

        } catch (error) {
            console.error('Error getting phase details:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get module details with all lessons
     */
    static async getModuleDetails(req, res) {
        try {
            const { documentId, phaseId, moduleId } = req.params;

            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({ message: "Document not found" });
            }

            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized" });
            }

            if (!document.roadmap) {
                return res.status(404).json({ message: "No roadmap available" });
            }

            const phase = document.roadmap.phases.find(p => p.phaseId === phaseId);
            if (!phase) {
                return res.status(404).json({ message: "Phase not found" });
            }

            const module = phase.modules.find(m => m.moduleId === moduleId);
            if (!module) {
                return res.status(404).json({ message: "Module not found" });
            }

            return res.status(200).json({
                success: true,
                module: module
            });

        } catch (error) {
            console.error('Error getting module details:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Regenerate roadmap with different learner level
     */
    static async regenerateRoadmap(req, res) {
        try {
            const { documentId } = req.params;
            const { learnerLevel = 'beginner' } = req.body;

            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({ message: "Document not found" });
            }

            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized" });
            }

            const pdfPath = document.filePath;
            if (!fs.existsSync(pdfPath)) {
                return res.status(404).json({ message: "PDF file not found" });
            }

            // Extract PDF content
            const pdfContent = await pdfParseService.extractPdfText(pdfPath);
            
            if (!pdfContent || pdfContent.length < 100) {
                return res.status(400).json({ 
                    message: "PDF content is too short or empty." 
                });
            }

            // Generate new roadmap
            const roadmapService = new ImprovedRoadmapService(process.env.GEMINI_API_KEY);
            const improvedRoadmap = await roadmapService.generateCompleteRoadmapImproved(
                pdfContent,
                learnerLevel
            );

            // Save updated roadmap
            document.roadmap = improvedRoadmap;
            document.roadmapGeneratedAt = new Date();
            await document.save();

            return res.status(200).json({
                message: "Roadmap regenerated successfully",
                success: true,
                roadmap: improvedRoadmap
            });

        } catch (error) {
            console.error('Error regenerating roadmap:', error);
            return res.status(500).json({ 
                message: `Failed to regenerate roadmap: ${error.message}`
            });
        }
    }

    /**
     * Get roadmap statistics
     */
    static async getRoadmapStats(req, res) {
        try {
            const { documentId } = req.params;

            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({ message: "Document not found" });
            }

            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized" });
            }

            if (!document.roadmap) {
                return res.status(404).json({ 
                    message: "No roadmap available",
                    stats: null 
                });
            }

            return res.status(200).json({
                success: true,
                stats: document.roadmap.statistics || {
                    message: "Statistics not available"
                }
            });

        } catch (error) {
            console.error('Error getting roadmap stats:', error);
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Export roadmap as JSON
     */
    static async exportRoadmapJSON(req, res) {
        try {
            const { documentId } = req.params;

            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({ message: "Document not found" });
            }

            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized" });
            }

            if (!document.roadmap) {
                return res.status(404).json({ message: "No roadmap available" });
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="roadmap-${documentId}.json"`);
            
            res.send(JSON.stringify(document.roadmap, null, 2));

        } catch (error) {
            console.error('Error exporting roadmap:', error);
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = EnhancedDocumentController;
