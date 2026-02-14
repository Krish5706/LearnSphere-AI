const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    // Link to the user who uploaded it
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String, // Path to the file stored on the server or cloud
        required: true
    },
    
    // PDF metadata
    pdfMetadata: {
        pages: { type: Number },
        fileSize: { type: String },
        extractedText: { type: String, maxlength: 50000 }, // Store first 50KB of text
    },

    // Processing status
    processingStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    processingType: {
        type: String,
        enum: ['summary', 'quiz', 'comprehensive', 'roadmap'],
        default: 'comprehensive'
    },
    
    // AI GENERATED DATA
    summary: {
        short: { type: String },
        medium: { type: String },
        detailed: { type: String }
    },
    
    keyPoints: [{
        type: String
    }],

    // Learning roadmap
    roadmap: [{
        step: { type: Number },
        title: { type: String },
        description: { type: String },
        estimatedTime: { type: String },
        resources: [{ type: String }],
        link: { type: String } // Link to existing website pages
    }],

    // Enhanced roadmap with topics
    enhancedRoadmap: {
        completed: { type: Boolean, default: false },
        roadmapId: { type: String },
        title: { type: String },
        description: { type: String },
        mainTopic: { type: String },
        subTopics: [{ type: String }],
        targetLevel: { type: String },
        learnerLevel: { type: String },
        generatedAt: { type: String },
        
        mainTopics: [{
            id: { type: String },
            name: { type: String },
            description: { type: String },
            importance: { type: String, enum: ['critical', 'important', 'optional'] },
            difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
        }],
        
        // Statistics object
        statistics: {
            totalPhases: { type: Number },
            totalModules: { type: Number },
            totalLessons: { type: Number },
            totalAssessmentQuestions: { type: Number },
            estimatedTotalHours: { type: Number },
            contentSourced: { type: String }
        },
        
        // Support both 'phases' and 'learningPath' for flexibility
        phases: [{
            phaseId: { type: String },
            phaseName: { type: String },
            phaseDescription: { type: String },
            phaseObjective: { type: String },
            estimatedDuration: { type: String },
            phaseTopics: [{
                id: { type: String },
                name: { type: String },
                description: { type: String },
                keyTerms: [{ type: String }],
                importance: { type: String },
                documentReference: { type: String },
                phase: { type: Number }
            }],
            
            modules: [{
                moduleId: { type: String },
                moduleTitle: { type: String },
                moduleDescription: { type: String },
                topicsCovered: [{ type: String }],
                estimatedTime: { type: String },
                estimatedDuration: { type: String },
                difficulty: { type: String },
                
                lessons: [{
                    lessonId: { type: String },
                    lessonTitle: { type: String },
                    lessonContent: { type: String },
                    introduction: { type: String },
                    learningObjectives: [{ type: String }],
                    orderInModule: { type: Number },
                    duration: { type: String },
                    keyPoints: [{ type: String }],
                    examples: [{ type: mongoose.Schema.Types.Mixed }],
                    prerequisites: [{ type: String }],
                    resources: [{ type: String }],
                    practiceActivities: [{ type: mongoose.Schema.Types.Mixed }],
                    commonMisconceptions: [{ type: String }],
                    summary: { type: String },
                    nextSteps: { type: String }
                }],
                
                assessment: {
                    type: { type: String },
                    description: { type: String },
                    questions: [{ type: mongoose.Schema.Types.Mixed }],
                    passingScore: { type: Number }
                },
                
                learningOutcomes: [{ type: mongoose.Schema.Types.Mixed }]
            }],
            
            completionCriteria: { type: String },
            summary: { type: String }
        }],
        
        learningPath: [{
            phaseId: { type: String },
            phaseName: { type: String },
            phaseDescription: { type: String },
            phaseObjective: { type: String },
            estimatedDuration: { type: String },
            phaseTopics: [{
                id: { type: String },
                name: { type: String },
                description: { type: String },
                keyTerms: [{ type: String }],
                importance: { type: String },
                documentReference: { type: String },
                phase: { type: Number }
            }],
            
            modules: [{
                moduleId: { type: String },
                moduleTitle: { type: String },
                moduleDescription: { type: String },
                topicsCovered: [{ type: String }],
                estimatedTime: { type: String },
                estimatedDuration: { type: String },
                difficulty: { type: String },
                
                lessons: [{
                    lessonId: { type: String },
                    lessonTitle: { type: String },
                    lessonContent: { type: String },
                    introduction: { type: String },
                    learningObjectives: [{ type: String }],
                    orderInModule: { type: Number },
                    duration: { type: String },
                    keyPoints: [{ type: String }],
                    examples: [{ type: mongoose.Schema.Types.Mixed }],
                    prerequisites: [{ type: String }],
                    resources: [{ type: String }],
                    practiceActivities: [{ type: mongoose.Schema.Types.Mixed }],
                    commonMisconceptions: [{ type: String }],
                    summary: { type: String },
                    nextSteps: { type: String }
                }],
                
                assessment: {
                    type: { type: String },
                    description: { type: String },
                    questions: [{ type: mongoose.Schema.Types.Mixed }],
                    passingScore: { type: Number }
                },
                
                learningOutcomes: [{ type: mongoose.Schema.Types.Mixed }]
            }],
            
            completionCriteria: { type: String },
            summary: { type: String }
        }],
        
        prerequisites: [{
            topic: { type: String },
            reason: { type: String }
        }],
        
        learningOutcomes: [{
            outcome: { type: String },
            description: { type: String }
        }],
        
        studyTimeline: {
            totalEstimatedHours: { type: Number },
            recommendedPacePerWeek: { type: String },
            phaseBreakdown: [{
                phase: { type: String },
                hours: { type: Number },
                percentage: { type: Number }
            }]
        },
        
        progressTracking: {
            currentPhase: { type: Number, default: 0 },
            completedModules: [{ type: String }],
            completedLessons: [{ type: String }],
            overallProgress: { type: Number, default: 0 }
        }
    },

    // Learner level for roadmap
    learnerLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },

    // Quiz array with scoring
    quizzes: [{
        id: { type: String },
        question: { type: String },
        options: [{ type: String }],
        correctAnswer: { type: String },
        explanation: { type: String }
    }],

    // Quiz results tracking
    quizResults: [{
        userAnswers: [{
            questionId: String,
            selectedAnswer: String,
            isCorrect: Boolean
        }],
        score: { type: Number },
        totalQuestions: { type: Number },
        percentage: { type: Number },
        performanceLevel: { type: String },
        topicsToFocus: [{
            topic: String,
            reason: String
        }],
        completedAt: { type: Date, default: Date.now }
    }],

    // Generated report PDFs
    generatedReports: [{
        type: { type: String, enum: ['summary', 'quiz', 'comprehensive', 'roadmap'] },
        filePath: { type: String },
        generatedAt: { type: Date, default: Date.now }
    }],

    // Processing metadata
    processingDetails: {
        processedAt: { type: Date },
        processingTime: { type: Number }, // in milliseconds
        error: { type: String }
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexing for faster searches by user
documentSchema.index({ user: 1 });

module.exports = mongoose.model('Document', documentSchema);