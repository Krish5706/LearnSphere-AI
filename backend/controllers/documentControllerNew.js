const { GoogleGenerativeAI } = require("@google/generative-ai");
const Document = require("../models/Document");
const User = require("../models/User");
const Quiz = require("../models/Quiz");
const fs = require("fs");
const path = require("path");
const GeminiProcessor = require("../services/geminiProcessor");
const RoadmapService = require("../services/roadmapService");
const ImprovedRoadmapService = require("../services/improvedRoadmapService"); // NEW: Enhanced roadmap with detailed lessons
const QuizService = require("../services/quizService");
const pdfParseService = require("../services/pdfParseService");
const pdfExporter = require("../services/pdfExporter");

// Validate API key before initializing
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing from environment variables!");
    console.error("Please add GEMINI_API_KEY to your .env file in the backend directory.");
}

// ============================================
// 1. UPLOAD & CREATE PROCESSING SESSION
// ============================================
exports.uploadPDF = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No PDF file uploaded" });

        // ✅ VALIDATION: Check PDF size (max 10MB)
        const fileSizeInMB = req.file.size / (1024 * 1024);
        if (fileSizeInMB > 10) {
            // Delete the uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                message: `PDF file is too large (${fileSizeInMB.toFixed(2)}MB). Maximum size allowed is 10MB.` 
            });
        }

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                message: "AI service is not configured. Please set GEMINI_API_KEY in your .env file." 
            });
        }

        const user = await User.findById(req.user._id);
        
        // Try to extract PDF metadata
        let pdfMetadata = {};
        try {
            const pdfData = await pdfParseService.extractPdfToJson(req.file.path);
            
            // ✅ VALIDATION: Check PDF pages (max 30 pages)
            if (pdfData.metadata.pages > 30) {
                // Delete the uploaded file
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ 
                    message: `PDF has too many pages (${pdfData.metadata.pages} pages). Maximum allowed is 30 pages.` 
                });
            }
            
            pdfMetadata = {
                pages: pdfData.metadata.pages,
                fileSize: pdfParseService.getPdfFileSize(req.file.path),
                extractedText: pdfData.fullText.substring(0, 50000), // Store first 50KB
            };
        } catch (error) {
            console.warn('Could not extract PDF metadata:', error.message);
        }

        // Create document with pending status
        const newDoc = await Document.create({
            user: user._id,
            fileName: req.file.originalname,
            fileUrl: req.file.path,
            pdfMetadata,
            processingStatus: 'pending',
        });

        res.status(201).json({
            _id: newDoc._id,
            fileName: newDoc.fileName,
            message: "PDF uploaded successfully. Choose processing options.",
        });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ message: "Upload failed. Please try again." });
    }
};

// ============================================
// 2. PROCESS PDF WITH SELECTED OPTIONS
// ============================================
exports.processPDF = async (req, res) => {
    try {
        const { documentId, processingType } = req.body; // 'summary', 'quiz', 'roadmap', or 'comprehensive'

        if (!documentId || !processingType) {
            return res.status(400).json({ message: "Document ID and processing type required" });
        }

        // Validate processingType
        const allowedTypes = ['summary', 'quiz', 'roadmap', 'comprehensive'];
        if (!allowedTypes.includes(processingType)) {
            return res.status(400).json({ message: "Invalid processing type" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                message: "AI service is not configured." 
            });
        }

        const doc = await Document.findOne({ _id: documentId, user: req.user._id });
        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        const user = await User.findById(req.user._id);
        
        // Check credits
        if (user.credits <= 0 && !user.isSubscribed) {
            return res.status(403).json({ message: "No credits left." });
        }

        const startTime = Date.now();

        try {
            // Initialize Gemini processor
            const processor = new GeminiProcessor(process.env.GEMINI_API_KEY);

            // Extract PDF text
            const pdfText = await pdfParseService.extractPdfText(doc.fileUrl);
            
            if (!pdfText || pdfText.trim().length === 0) {
                throw new Error("Could not extract text from PDF");
            }

            // Process based on type
            const results = {};

            if (processingType === 'summary' || processingType === 'comprehensive') {
                console.log('📝 Generating summaries...');
                const summaryType = req.body.summaryType;
                results.summary = {};

                if (processingType === 'comprehensive') {
                    // Generate all summaries for comprehensive analysis
                    results.summary.short = await processor.generateSummary(pdfText, 'short');
                    results.summary.medium = await processor.generateSummary(pdfText, 'medium');
                    results.summary.detailed = await processor.generateSummary(pdfText, 'detailed');
                } else if (summaryType) {
                    // Generate only the selected summary type
                    results.summary[summaryType] = await processor.generateSummary(pdfText, summaryType);
                }
                results.keyPoints = await processor.extractKeyPoints(pdfText, 8);
            }

            if (processingType === 'quiz' || processingType === 'comprehensive') {
                console.log('🎯 Generating quiz...');
                results.quizzes = await processor.generateQuiz(pdfText, 5);
            }

            if (processingType === 'roadmap') {
                console.log('🗺️ Generating enhanced learning roadmap with detailed AI-generated content...');
                const learnerLevel = req.body.learnerLevel || 'beginner';
                
                try {
                    // Use the NEW ImprovedRoadmapService for detailed, PDF-based content generation
                    const improvedRoadmapService = new ImprovedRoadmapService(process.env.GEMINI_API_KEY);
                    results.enhancedRoadmap = await improvedRoadmapService.generateCompleteRoadmapImproved(
                        pdfText, 
                        learnerLevel
                    );
                    console.log('✅ Enhanced roadmap with detailed lessons generated successfully');
                    
                    // Pre-generate quizzes for each phase
                    console.log('📝 Pre-generating phase quizzes...');
                    const quizService = new QuizService(process.env.GEMINI_API_KEY);
                    const preGeneratedQuizzes = [];
                    
                    if (results.enhancedRoadmap?.phases) {
                        for (const [phaseIdx, phase] of results.enhancedRoadmap.phases.entries()) {
                            try {
                                console.log(`📚 Generating quiz for phase: ${phase.phaseName}`);
                                
                                // Get all topics from this phase's modules
                                const allTopicsInPhase = phase.modules?.flatMap(m => m.topicsCovered || []) || [];
                                
                                // Generate quiz questions using PDF content
                                const questions = await quizService.generatePhaseQuiz(
                                    { phaseName: phase.phaseName, phaseObjective: phase.phaseObjective },
                                    results.enhancedRoadmap.subTopics || [],
                                    phase.modules || [],
                                    pdfText
                                );
                                
                                // Create quiz record in database
                                const quiz = await Quiz.create({
                                    user: req.user._id,
                                    quizTitle: `${phase.phaseName} - Comprehensive Assessment`,
                                    quizType: 'phase-quiz',
                                    roadmapId: documentId,
                                    phaseId: phase.phaseId,
                                    phaseNumber: phaseIdx + 1,
                                    phaseName: phase.phaseName,
                                    moduleId: null,
                                    moduleName: null,
                                    topicsCovered: allTopicsInPhase,
                                    questions,
                                    totalQuestions: questions.length,
                                    status: 'not-started'
                                });
                                
                                preGeneratedQuizzes.push({
                                    phaseId: phase.phaseId,
                                    quizId: quiz._id,
                                    totalQuestions: questions.length
                                });
                                
                                console.log(`✅ Generated ${questions.length} questions for ${phase.phaseName}`);
                            } catch (quizError) {
                                console.error(`⚠️ Failed to pre-generate quiz for ${phase.phaseName}:`, quizError.message);
                                // Continue with other phases even if one fails
                            }
                        }
                    }
                    
                    results.preGeneratedQuizzes = preGeneratedQuizzes;
                    console.log(`✅ Pre-generated ${preGeneratedQuizzes.length} phase quizzes`);
                    
                } catch (roadmapError) {
                    console.error('❌ Roadmap generation error:', roadmapError.message);
                    throw roadmapError;
                }
                
                results.learnerLevel = learnerLevel;
            }

            
            // Update document with results
            // Merge new summary results with existing ones to avoid overwriting.
            if (results.summary) {
                // Convert Mongoose subdocument to a plain object before merging to ensure atomicity
                const existingSummary = doc.summary ? doc.summary.toObject() : {};
                doc.summary = { ...existingSummary, ...results.summary };
            }
            doc.keyPoints = results.keyPoints || doc.keyPoints;
            doc.quizzes = results.quizzes || doc.quizzes;
            doc.roadmap = results.roadmap || doc.roadmap;
            doc.enhancedRoadmap = results.enhancedRoadmap || doc.enhancedRoadmap;
            doc.learnerLevel = results.learnerLevel || doc.learnerLevel || 'beginner';
            doc.processingStatus = 'completed';
            doc.processingType = processingType;
            doc.processingDetails = {
                processedAt: new Date(),
                processingTime: Date.now() - startTime,
            };

            await doc.save();

            // Deduct credits
            if (!user.isSubscribed) {
                await User.findByIdAndUpdate(user._id, { $inc: { credits: -1 } });
            }

            res.status(200).json({
                _id: doc._id,
                message: "Processing completed successfully!",
                processingTime: doc.processingDetails.processingTime,
                results // Return results so frontend can render immediately
            });

        } catch (error) {
            console.error("Processing Error:", error);
            
            doc.processingStatus = 'failed';
            doc.processingDetails = {
                processedAt: new Date(),
                processingTime: Date.now() - startTime,
                error: error.message,
            };
            await doc.save();

            let errorMessage = "Processing failed";
            let statusCode = 500;

            if (error.message?.includes("quota")) {
                statusCode = 429;
                errorMessage = `API quota exceeded. Please try again later or upgrade your plan.`;
            } else if (error.message?.includes("API key")) {
                errorMessage = "Invalid API key configuration.";
            } else {
                errorMessage = `Processing error: ${error.message}`;
            }

            res.status(statusCode).json({ message: errorMessage });
        }
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ message: "Server error during processing" });
    }
};

// ============================================
// 3. SUBMIT QUIZ ANSWERS
// ============================================
exports.submitQuizAnswers = async (req, res) => {
    try {
        const { documentId, answers } = req.body; // answers: [{questionId, selectedAnswer}, ...]

        if (!documentId || !answers) {
            return res.status(400).json({ message: "Document ID and answers required" });
        }

        const doc = await Document.findOne({ _id: documentId, user: req.user._id });
        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        if (!doc.quizzes || doc.quizzes.length === 0) {
            return res.status(400).json({ message: "No quiz found for this document" });
        }

        // Calculate score and identify wrong answers
        let correctCount = 0;
        const wrongAnswers = [];

        doc.quizzes.forEach(question => {
            const userAnswer = answers.find(a => a.questionId === question.id);
            
            if (userAnswer) {
                if (userAnswer.selectedAnswer === question.correctAnswer) {
                    correctCount++;
                } else {
                    wrongAnswers.push({
                        questionId: question.id,
                        question: question.question,
                        userAnswer: userAnswer.selectedAnswer,
                        correctAnswer: question.correctAnswer,
                        explanation: question.explanation
                    });
                }
            } else {
                // Unanswered question counts as wrong
                wrongAnswers.push({
                    questionId: question.id,
                    question: question.question,
                    userAnswer: 'Not answered',
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation
                });
            }
        });

        const percentage = Math.round((correctCount / doc.quizzes.length) * 100);

        // Store quiz result
        if (!doc.quizResults) {
            doc.quizResults = [];
        }

        doc.quizResults.push({
            userAnswers: answers,
            score: correctCount,
            totalQuestions: doc.quizzes.length,
            percentage,
            completedAt: new Date(),
        });

        await doc.save();

        res.status(200).json({
            correctAnswers: correctCount,
            wrongAnswers,
            totalQuestions: doc.quizzes.length,
            percentage,
            message: "Quiz submitted successfully!"
        });

    } catch (err) {
        console.error("Quiz Submission Error:", err);
        res.status(500).json({ message: "Failed to submit quiz" });
    }
};

// ============================================
// 4. GENERATE REPORT PDF
// ============================================
exports.generateReportPDF = async (req, res) => {
    try {
        const { documentId, reportType } = req.body; // 'summary', 'quiz', 'comprehensive'

        if (!documentId) {
            return res.status(400).json({ message: "Document ID required" });
        }

        const doc = await Document.findOne({ _id: documentId, user: req.user._id });
        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Prepare data for export
        const exportData = {
            fileName: doc.fileName,
            summary: doc.summary,
            keyPoints: doc.keyPoints,
            roadmap: doc.roadmap,
            quizAnalysis: doc.quizResults?.[doc.quizResults.length - 1] || null, // Latest quiz result
            answeredQuestions: doc.quizzes?.map((q, idx) => ({
                ...q,
                userAnswer: doc.quizResults?.[0]?.userAnswers?.[idx]?.selectedAnswer,
                isCorrect: doc.quizResults?.[0]?.userAnswers?.[idx]?.selectedAnswer === q.correctAnswer,
            })) || [],
        };

        // Generate PDF
        const pdfBuffer = await pdfExporter.generateReportBuffer(exportData, reportType || 'comprehensive');

        // Check if PDF was generated successfully
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Failed to generate PDF report - buffer is empty');
        }

        // Store reference in document (optional - could be removed if not needed)
        // Since we're not saving to disk, we can skip this
        // doc.generatedReports.push({
        //     type: reportType || 'comprehensive',
        //     generatedAt: new Date(),
        // });
        // await doc.save();

        // Send PDF buffer as response
        const fileName = `${doc.fileName.replace(/[^a-zA-Z0-9]/g, '_')}_${reportType || 'comprehensive'}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(pdfBuffer);

    } catch (err) {
        console.error("PDF Generation Error:", err);
        res.status(500).json({ message: "Error generating PDF report" });
    }
};

// ============================================
// 5. FETCH USER DOCUMENTS
// ============================================
exports.getUserDocuments = async (req, res) => {
    try {
        const docs = await Document.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(docs);
    } catch (err) {
        res.status(500).json({ message: "Error fetching documents" });
    }
};

// ============================================
// 6. GET SINGLE DOCUMENT
// ============================================
exports.getDocument = async (req, res) => {
    try {
        const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }
        res.status(200).json(doc);
    } catch (err) {
        res.status(500).json({ message: "Error fetching document" });
    }
};

// ============================================
// 7. DELETE DOCUMENT
// ============================================
exports.deleteDocument = async (req, res) => {
    try {
        const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Delete local file from uploads folder
        if (fs.existsSync(doc.fileUrl)) {
            fs.unlinkSync(doc.fileUrl);
        }

        // Delete generated reports
        if (doc.generatedReports && doc.generatedReports.length > 0) {
            doc.generatedReports.forEach(report => {
                const reportPath = path.join(__dirname, '../uploads/generated-reports', report.filePath);
                if (fs.existsSync(reportPath)) {
                    fs.unlinkSync(reportPath);
                }
            });
        }

        await Document.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Document deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting document" });
    }
};

// ============================================
// 8. GET MIND MAP (FETCH EXISTING)
// ============================================

// ============================================
// 9. GENERATE MIND MAP (LLM-FREE)
// ============================================

// ============================================
// 10. UPDATE MIND MAP (MANUAL EDITS)
// ============================================

// ============================================
// BACKWARD COMPATIBILITY - OLD UPLOAD & ANALYZE
// ============================================
exports.uploadAndAnalyze = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No PDF file uploaded" });

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                message: "AI service is not configured. Please set GEMINI_API_KEY in your .env file." 
            });
        }

        const user = await User.findById(req.user._id);
        if (user.credits <= 0 && !user.isSubscribed) {
            return res.status(403).json({ message: "No credits left." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";
        console.log(`🤖 Using Gemini model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const pdfData = fs.readFileSync(req.file.path).toString("base64");

        const prompt = `
            Analyze this PDF and provide:
            1. A short summary (max 3 sentences).
            2. 5 key bullet points.
            3. A quiz with 3 MCQs.
                        
            Return ONLY a valid JSON object like this:
            {
              "summary": "...",
              "keyPoints": ["..."],
              "quizzes": [...],
                          }
        `;

        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { data: pdfData, mimeType: "application/pdf" } }
                ]
            }]
        });

        let textResponse = result.response.text();
        const cleanJson = textResponse.replace(/```json|```/gi, "").trim();
        const aiResponse = JSON.parse(cleanJson);

        const newDoc = await Document.create({
            user: user._id,
            fileName: req.file.originalname,
            fileUrl: req.file.path,
            summary: { short: aiResponse.summary },
            keyPoints: aiResponse.keyPoints,
            quizzes: aiResponse.quizzes,
                        processingStatus: 'completed',
            processingType: 'comprehensive',
        });

        if (!user.isSubscribed) {
            await User.findByIdAndUpdate(user._id, { $inc: { credits: -1 } });
        }

        res.status(201).json(newDoc);
    } catch (err) {
        console.error("AI Error:", err);
        
        let errorMessage = "Analysis failed";
        let statusCode = 500;
        
        if (err.status === 429 || (err.message && err.message.includes("quota"))) {
            statusCode = 429;
            const retryDelay = err.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay || "a few seconds";
            errorMessage = `API quota exceeded. The model "${process.env.GEMINI_MODEL || 'gemini-1.5-pro'}" is not available on your current plan. Please try: 1) Wait ${retryDelay} and retry, 2) Use a free-tier model (gemini-1.5-pro, gemini-1.5-flash), or 3) Upgrade your Google AI Studio plan.`;
        } else if (err.message && err.message.includes("API key not valid")) {
            errorMessage = "Invalid API key. Please check your GEMINI_API_KEY in the .env file.";
        } else if (err.message && err.message.includes("API_KEY_INVALID")) {
            errorMessage = "Invalid or expired API key. Please update your GEMINI_API_KEY in the .env file.";
        } else if (err.message && (err.message.includes("not found") || err.message.includes("404"))) {
            errorMessage = `Model not found. The model "${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}" may not be available. Try: gemini-1.5-flash, gemini-1.5-pro, or gemini-2.5-flash. Run "node list-models.js" to see available models for your API key.`;
        } else if (err.message) {
            errorMessage = `Analysis failed: ${err.message}`;
        }
        
        res.status(statusCode).json({ message: errorMessage });
    }
};
// ============================================
// UPDATE ROADMAP PROGRESS
// ============================================
exports.updateRoadmapProgress = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { lessonId, phaseId, moduleId } = req.body;

        const doc = await Document.findOne({ _id: documentId, user: req.user._id });
        if (!doc || !doc.enhancedRoadmap) {
            return res.status(404).json({ message: "Enhanced roadmap not found" });
        }

        // Mark lesson as completed
        if (lessonId && !doc.enhancedRoadmap.progressTracking.completedLessons.includes(lessonId)) {
            doc.enhancedRoadmap.progressTracking.completedLessons.push(lessonId);
        }

        // Calculate total lessons
        const totalLessons = doc.enhancedRoadmap.learningPath.reduce((total, phase) => 
            total + (phase.modules?.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0) || 0), 0
        );

        // Update overall progress
        doc.enhancedRoadmap.progressTracking.overallProgress = Math.round(
            (doc.enhancedRoadmap.progressTracking.completedLessons.length / totalLessons) * 100
        );

        // Update current phase
        if (phaseId) {
            const phaseIndex = doc.enhancedRoadmap.learningPath.findIndex(p => p.phaseId === phaseId);
            if (phaseIndex >= 0) {
                doc.enhancedRoadmap.progressTracking.currentPhase = phaseIndex;
            }
        }

        // Mark module as completed
        if (moduleId && !doc.enhancedRoadmap.progressTracking.completedModules.includes(moduleId)) {
            doc.enhancedRoadmap.progressTracking.completedModules.push(moduleId);
        }

        await doc.save();

        res.status(200).json({
            message: "Progress updated successfully",
            progress: doc.enhancedRoadmap.progressTracking
        });
    } catch (error) {
        console.error("Update Progress Error:", error);
        res.status(500).json({ message: "Failed to update progress" });
    }
};

// ============================================
// GET ROADMAP TOPIC DEPENDENCIES
// ============================================
exports.getRoadmapTopics = async (req, res) => {
    try {
        const { documentId } = req.params;

        const doc = await Document.findOne({ _id: documentId, user: req.user._id });
        if (!doc || !doc.enhancedRoadmap) {
            return res.status(404).json({ message: "Enhanced roadmap not found" });
        }

        res.status(200).json({
            mainTopics: doc.enhancedRoadmap.mainTopics,
            learningOutcomes: doc.enhancedRoadmap.learningOutcomes,
            prerequisites: doc.enhancedRoadmap.prerequisites,
            progressTracking: doc.enhancedRoadmap.progressTracking
        });
    } catch (error) {
        console.error("Get Topics Error:", error);
        res.status(500).json({ message: "Failed to fetch topics" });
    }
};

// ============================================
// EXPORT ROADMAP AS MARKDOWN/PDF
// ============================================
exports.exportRoadmap = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { format } = req.query; // 'markdown' or 'pdf'

        const doc = await Document.findOne({ _id: documentId, user: req.user._id });
        if (!doc || !doc.enhancedRoadmap) {
            return res.status(404).json({ message: "Enhanced roadmap not found" });
        }

        // Initialize RoadmapService
        const RoadmapService = require("../services/roadmapService");
        const roadmapService = new RoadmapService(process.env.GEMINI_API_KEY);

        // Generate markdown summary
        const summary = roadmapService.generateRoadmapSummary(doc.enhancedRoadmap);

        if (format === 'markdown') {
            res.setHeader('Content-Type', 'text/markdown');
            res.setHeader('Content-Disposition', `attachment; filename="roadmap-${doc.fileName.replace(/\.pdf$/, '')}.md"`);
            res.send(summary);
        } else {
            // For PDF, we would need additional library
            res.status(200).json({
                message: "Roadmap export",
                content: summary,
                fileName: `roadmap-${doc.fileName.replace(/\.pdf$/, '')}`,
                format: 'markdown'
            });
        }
    } catch (error) {
        console.error("Export Roadmap Error:", error);
        res.status(500).json({ message: "Failed to export roadmap" });
    }
};

// ============================================
// DIAGNOSTIC ROADMAP TEST (Debug)
// ============================================
exports.testRoadmapGeneration = async (req, res) => {
    try {
        const { content, learnerLevel } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Content is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'GEMINI_API_KEY not configured' });
        }

        console.log('\n🔬 DIAGNOSTIC ROADMAP TEST STARTED');
        console.log(`   Content length: ${content.length}`);
        console.log(`   Learner level: ${learnerLevel || 'beginner'}`);

        const startTime = Date.now();
        const RoadmapService = require("../services/roadmapService");
        const roadmapService = new RoadmapService(process.env.GEMINI_API_KEY);
        
        const testRoadmap = await roadmapService.generateEnhancedRoadmap(
            content,
            learnerLevel || 'beginner'
        );

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        const diagnosticResult = {
            success: true,
            generationTime: `${elapsed}s`,
            stats: {
                topicsCount: testRoadmap.mainTopics?.length || 0,
                phasesCount: testRoadmap.learningPath?.length || 0,
                totalModules: testRoadmap.learningPath?.reduce((sum, p) => sum + (p.modules?.length || 0), 0) || 0,
                totalLessons: testRoadmap.learningPath?.reduce((sum, p) => 
                    sum + (p.modules?.reduce((m, mod) => m + (mod.lessons?.length || 0), 0) || 0), 0
                ) || 0,
                totalEstimatedHours: testRoadmap.studyTimeline?.totalEstimatedHours || 0
            },
            mainTopics: testRoadmap.mainTopics || [],
            phaseNames: testRoadmap.learningPath?.map(p => p.phaseName) || [],
            samplePhase: testRoadmap.learningPath?.[0] ? {
                name: testRoadmap.learningPath[0].phaseName,
                modulesCount: testRoadmap.learningPath[0].modules?.length || 0,
                firstModule: testRoadmap.learningPath[0].modules?.[0] ? {
                    name: testRoadmap.learningPath[0].modules[0].moduleTitle,
                    lessonsCount: testRoadmap.learningPath[0].modules[0].lessons?.length || 0
                } : null
            } : null
        };

        console.log('✅ Diagnostic test successful');
        res.status(200).json(diagnosticResult);

    } catch (error) {
        console.error('❌ Diagnostic test error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.message
        });
    }
};