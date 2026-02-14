/**
 * Quiz Controller
 * Handles quiz operations: creation, retrieval, submission, and scoring
 */

const Quiz = require('../models/Quiz');
const ScoreTracker = require('../models/ScoreTracker');
const Document = require('../models/Document');
const QuizService = require('../services/quizService');

// Initialize Quiz Service
const quizService = new QuizService(process.env.GEMINI_API_KEY);

/**
 * Create quiz for a module
 * POST /api/quizzes/module
 */
exports.createModuleQuiz = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roadmapId, phaseId, phaseNumber, phaseName, moduleId, moduleName, topicsCovered, phaseObjective, documentContent } = req.body;

        // Validate required fields
        if (!roadmapId || !phaseId || !moduleId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: roadmapId, phaseId, moduleId' 
            });
        }

        console.log(`🎯 Creating module quiz for: ${moduleName}`);

        // Get document content if not provided
        let pdfContent = documentContent || '';
        if (!pdfContent) {
            try {
                const document = await Document.findById(roadmapId);
                if (document && document.pdfMetadata && document.pdfMetadata.extractedText) {
                    pdfContent = document.pdfMetadata.extractedText;
                    console.log(`📄 Using PDF content (${pdfContent.length} chars)`);
                }
            } catch (docErr) {
                console.log('⚠️ Could not fetch document content:', docErr.message);
            }
        }

        // Generate quiz questions
        const module = { moduleTitle: moduleName };
        const questions = await quizService.generateModuleQuiz(
            module, 
            topicsCovered || [], 
            phaseObjective || '',
            pdfContent
        );

        // Create quiz document
        const quiz = await Quiz.create({
            user: userId,
            quizTitle: `${moduleName} Quiz`,
            quizType: 'module-quiz',
            roadmapId,
            phaseId,
            phaseNumber,
            phaseName,
            moduleId,
            moduleName,
            topicsCovered: topicsCovered || [],
            questions,
            totalQuestions: questions.length,
            status: 'not-started'
        });

        res.status(201).json({
            success: true,
            message: 'Module quiz created successfully',
            data: {
                quizId: quiz._id,
                quizTitle: quiz.quizTitle,
                quizType: quiz.quizType,
                totalQuestions: quiz.totalQuestions,
                questions: questions.map(q => ({
                    questionId: q.questionId,
                    questionText: q.questionText,
                    options: q.options,
                    difficulty: q.difficulty,
                    topic: q.topic
                    // Note: Don't send correctAnswer yet
                }))
            }
        });
    } catch (error) {
        console.error('❌ Error creating module quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create module quiz',
            error: error.message
        });
    }
};

/**
 * Create phase-end quiz covering all topics in phase
 * POST /api/quizzes/phase
 */
exports.createPhaseQuiz = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roadmapId, phaseId, phaseNumber, phaseName, phaseObjective, modulesInPhase, allTopicsInPhase, phaseTopics, documentContent } = req.body;

        if (!roadmapId || !phaseId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: roadmapId, phaseId'
            });
        }

        console.log(`📚 Creating phase quiz for: ${phaseName}`);
        console.log(`   Topics for this phase: ${allTopicsInPhase?.join(', ') || 'none specified'}`);

        // Get document content if not provided
        let pdfContent = documentContent || '';
        if (!pdfContent) {
            try {
                // roadmapId might be the document ID
                const document = await Document.findById(roadmapId);
                if (document && document.pdfMetadata && document.pdfMetadata.extractedText) {
                    pdfContent = document.pdfMetadata.extractedText;
                    console.log(`📄 Using PDF content (${pdfContent.length} chars)`);
                }
            } catch (docErr) {
                console.log('⚠️ Could not fetch document content:', docErr.message);
            }
        }

        // Build phase object with phase-specific topics
        const phase = { 
            phaseName, 
            phaseObjective,
            phaseTopics: phaseTopics || [] // Pass full topic objects for better quiz generation
        };
        
        const questions = await quizService.generatePhaseQuiz(
            phase,
            allTopicsInPhase || [],
            modulesInPhase || [],
            pdfContent
        );

        const quiz = await Quiz.create({
            user: userId,
            quizTitle: `${phaseName} - Comprehensive Assessment`,
            quizType: 'phase-quiz',
            roadmapId,
            phaseId,
            phaseNumber,
            phaseName,
            moduleId: null,
            moduleName: null,
            topicsCovered: allTopicsInPhase || [],
            questions,
            totalQuestions: questions.length,
            status: 'not-started'
        });

        res.status(201).json({
            success: true,
            message: 'Phase quiz created successfully',
            data: {
                quizId: quiz._id,
                quizTitle: quiz.quizTitle,
                quizType: quiz.quizType,
                totalQuestions: quiz.totalQuestions,
                questions: questions.map(q => ({
                    questionId: q.questionId,
                    questionText: q.questionText,
                    options: q.options,
                    difficulty: q.difficulty,
                    topic: q.topic
                }))
            }
        });
    } catch (error) {
        console.error('❌ Error creating phase quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create phase quiz',
            error: error.message
        });
    }
};

/**
 * Create final comprehensive quiz
 * POST /api/quizzes/final
 */
exports.createFinalQuiz = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roadmapId, allPhases, allTopics } = req.body;

        if (!roadmapId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: roadmapId'
            });
        }

        console.log('🏆 Creating final comprehensive quiz');

        const questions = await quizService.generateFinalQuiz(
            allPhases || [],
            allTopics || []
        );

        const quiz = await Quiz.create({
            user: userId,
            quizTitle: 'Final Comprehensive Assessment',
            quizType: 'final-quiz',
            roadmapId,
            phaseId: 'final',
            phaseNumber: -1,
            phaseName: 'Final Assessment',
            moduleId: null,
            moduleName: null,
            topicsCovered: (allTopics || []).map(t => t.name),
            questions,
            totalQuestions: questions.length,
            status: 'not-started'
        });

        res.status(201).json({
            success: true,
            message: 'Final quiz created successfully',
            data: {
                quizId: quiz._id,
                quizTitle: quiz.quizTitle,
                quizType: quiz.quizType,
                totalQuestions: quiz.totalQuestions,
                questions: questions.map(q => ({
                    questionId: q.questionId,
                    questionText: q.questionText,
                    options: q.options,
                    difficulty: q.difficulty,
                    topic: q.topic
                }))
            }
        });
    } catch (error) {
        console.error('❌ Error creating final quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create final quiz',
            error: error.message
        });
    }
};

/**
 * Get quiz details (without showing answers)
 * GET /api/quizzes/:quizId
 */
exports.getQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                quizId: quiz._id,
                quizTitle: quiz.quizTitle,
                quizType: quiz.quizType,
                phaseName: quiz.phaseName,
                moduleName: quiz.moduleName,
                totalQuestions: quiz.totalQuestions,
                status: quiz.status,
                bestAttempt: quiz.bestAttempt,
                questions: quiz.questions.map(q => ({
                    questionId: q.questionId,
                    questionText: q.questionText,
                    options: q.options,
                    difficulty: q.difficulty,
                    topic: q.topic
                }))
            }
        });
    } catch (error) {
        console.error('❌ Error fetching quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz',
            error: error.message
        });
    }
};

/**
 * Submit quiz answers and calculate score
 * POST /api/quizzes/:quizId/submit
 */
exports.submitQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        const { answers, timeTaken } = req.body;

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid answers format'
            });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        // Verify user owns this quiz
        if (quiz.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Calculate score
        const attemptNumber = (quiz.attempts?.length || 0) + 1;
        let correctCount = 0;
        const processedAnswers = [];

        answers.forEach(answer => {
            const question = quiz.questions.find(q => q.questionId === answer.questionId);
            const isCorrect = question && answer.selectedAnswer === question.correctAnswer;
            
            if (isCorrect) correctCount++;

            processedAnswers.push({
                questionId: answer.questionId,
                selectedAnswer: answer.selectedAnswer,
                isCorrect,
                markedTime: answer.markedTime || 0
            });
        });

        const totalScore = correctCount;
        const percentageScore = Math.round((correctCount / quiz.totalQuestions) * 100);

        // Add attempt
        const attempt = {
            attemptNumber,
            totalScore,
            percentageScore,
            timeTaken: timeTaken || 0,
            answers: processedAnswers,
            completedAt: new Date()
        };

        quiz.attempts.push(attempt);
        quiz.status = 'completed';

        // Update best attempt
        if (!quiz.bestAttempt || percentageScore > quiz.bestAttempt.percentageScore) {
            quiz.bestAttempt = {
                attemptNumber,
                score: totalScore,
                percentageScore,
                completedAt: new Date()
            };
        }

        await quiz.save();

        // Update score tracker
        await updateScoreTracker(userId, quiz, percentageScore, correctCount);

        res.status(200).json({
            success: true,
            message: 'Quiz submitted successfully',
            data: {
                attemptNumber,
                totalScore,
                percentageScore,
                totalQuestions: quiz.totalQuestions,
                correctCount,
                timeTaken: timeTaken || 0,
                bestScore: quiz.bestAttempt.percentageScore,
                review: processedAnswers.map(answer => {
                    const question = quiz.questions.find(q => q.questionId === answer.questionId);
                    return {
                        questionId: answer.questionId,
                        questionText: question?.questionText,
                        yourAnswer: answer.selectedAnswer,
                        correctAnswer: question?.correctAnswer,
                        isCorrect: answer.isCorrect,
                        explanation: question?.explanation,
                        difficulty: question?.difficulty
                    };
                })
            }
        });
    } catch (error) {
        console.error('❌ Error submitting quiz:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit quiz',
            error: error.message
        });
    }
};

/**
 * Get user's score tracker for a roadmap
 * GET /api/quizzes/tracker/:roadmapId
 */
exports.getScoreTracker = async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const userId = req.user.id;

        let tracker = await ScoreTracker.findOne({ user: userId, roadmapId });

        if (!tracker) {
            // Create new tracker
            tracker = await ScoreTracker.create({
                user: userId,
                roadmapId,
                phaseScores: [],
                learningProgress: {
                    totalPhases: 0,
                    completedPhases: 0,
                    overallCompletion: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            data: tracker
        });
    } catch (error) {
        console.error('❌ Error fetching score tracker:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch score tracker',
            error: error.message
        });
    }
};

/**
 * Helper function to update score tracker
 */
async function updateScoreTracker(userId, quiz, percentageScore, correctCount) {
    try {
        let tracker = await ScoreTracker.findOne({ user: userId, roadmapId: quiz.roadmapId });

        if (!tracker) {
            tracker = new ScoreTracker({
                user: userId,
                roadmapId: quiz.roadmapId,
                fileName: 'Learning Roadmap',
                learnerLevel: 'beginner',
                phaseScores: [],
                learningProgress: {
                    totalPhases: 0,
                    completedPhases: 0,
                    overallCompletion: 0
                }
            });
        }

        // Find or create phase score entry
        let phaseScoreIndex = tracker.phaseScores.findIndex(ps => ps.phaseId === quiz.phaseId);
        
        if (phaseScoreIndex === -1) {
            tracker.phaseScores.push({
                phaseId: quiz.phaseId,
                phaseNumber: quiz.phaseNumber,
                phaseName: quiz.phaseName,
                moduleQuizzes: [],
                phaseOverallQuiz: null,
                phaseScore: 0,
                phaseCompletion: 'in-progress'
            });
            phaseScoreIndex = tracker.phaseScores.length - 1;
        }

        // Get reference from the Mongoose array
        const phaseScore = tracker.phaseScores[phaseScoreIndex];

        // Update based on quiz type
        if (quiz.quizType === 'module-quiz') {
            const existingModuleQuiz = phaseScore.moduleQuizzes.find(mq => mq.moduleId === quiz.moduleId);
            
            if (existingModuleQuiz) {
                existingModuleQuiz.score = percentageScore;
                existingModuleQuiz.percentageScore = percentageScore;
                existingModuleQuiz.correctAnswers = correctCount;
                existingModuleQuiz.completedAt = new Date();
            } else {
                phaseScore.moduleQuizzes.push({
                    moduleId: quiz.moduleId,
                    moduleName: quiz.moduleName,
                    quizId: quiz._id,
                    score: percentageScore,
                    percentageScore: percentageScore,
                    totalQuestions: quiz.totalQuestions,
                    correctAnswers: correctCount,
                    completedAt: new Date()
                });
            }

            // Calculate phase score from module quizzes
            const moduleScores = phaseScore.moduleQuizzes.map(mq => mq.percentageScore);
            if (moduleScores.length > 0) {
                phaseScore.phaseScore = Math.round(
                    moduleScores.reduce((a, b) => a + b, 0) / moduleScores.length
                );
            }

        } else if (quiz.quizType === 'phase-quiz') {
            phaseScore.phaseOverallQuiz = {
                quizId: quiz._id,
                score: percentageScore,
                percentageScore: percentageScore,
                totalQuestions: quiz.totalQuestions,
                correctAnswers: correctCount,
                completedAt: new Date()
            };
            phaseScore.phaseCompletion = 'completed';
            
            // Phase score is the phase quiz score (or average if module quizzes exist)
            const scores = [];
            phaseScore.moduleQuizzes.forEach(mq => scores.push(mq.percentageScore));
            scores.push(percentageScore); // Add the current phase quiz score
            
            phaseScore.phaseScore = Math.round(
                scores.reduce((a, b) => a + b, 0) / scores.length
            );
        }

        // Mark the phaseScores array as modified for Mongoose
        tracker.markModified('phaseScores');

        // Update learning progress
        const completedPhases = tracker.phaseScores.filter(ps => ps.phaseCompletion === 'completed').length;
        tracker.learningProgress.completedPhases = completedPhases;
        
        // Recalculate overall score
        const allPhaseScores = tracker.phaseScores
            .map(ps => ps.phaseScore || 0)
            .filter(score => score > 0);
        
        if (allPhaseScores.length > 0) {
            tracker.overallScore = Math.round(
                allPhaseScores.reduce((a, b) => a + b, 0) / allPhaseScores.length
            );
        }
        
        // Recalculate total questions and correct
        let totalQuestions = 0;
        let totalCorrect = 0;
        tracker.phaseScores.forEach(phase => {
            phase.moduleQuizzes.forEach(mq => {
                totalQuestions += mq.totalQuestions || 0;
                totalCorrect += mq.correctAnswers || 0;
            });
            if (phase.phaseOverallQuiz) {
                totalQuestions += phase.phaseOverallQuiz.totalQuestions || 0;
                totalCorrect += phase.phaseOverallQuiz.correctAnswers || 0;
            }
        });
        tracker.totalQuestionsAttempted = totalQuestions;
        tracker.totalQuestionsCorrect = totalCorrect;
        tracker.averageAccuracy = totalQuestions > 0 
            ? Math.round((totalCorrect / totalQuestions) * 100)
            : 0;

        await tracker.save();
        console.log(`✅ Score tracker updated: Overall ${tracker.overallScore}%, Questions ${totalCorrect}/${totalQuestions}`);
        return tracker;
    } catch (error) {
        console.error('❌ Error updating score tracker:', error);
    }
}

/**
 * Get all quizzes for a roadmap
 * GET /api/quizzes/roadmap/:roadmapId
 */
exports.getQuizzesByRoadmap = async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const userId = req.user.id;

        const quizzes = await Quiz.find({ user: userId, roadmapId })
            .select('quizTitle quizType phaseId phaseName moduleId moduleName status bestAttempt totalQuestions');

        res.status(200).json({
            success: true,
            data: quizzes
        });
    } catch (error) {
        console.error('❌ Error fetching quizzes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quizzes',
            error: error.message
        });
    }
};

// Exports are already defined using exports.functionName above
// No need for additional module.exports
