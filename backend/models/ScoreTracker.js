const mongoose = require('mongoose');

const scoreTrackerSchema = new mongoose.Schema({
    // Link to the authenticated user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Document/Roadmap identifier
    roadmapId: {
        type: String,
        required: true
    },

    fileName: {
        type: String,
        default: 'Learning Roadmap'
    },

    learnerLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },

    // Overall statistics
    overallScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    totalQuestionsAttempted: {
        type: Number,
        default: 0
    },

    totalQuestionsCorrect: {
        type: Number,
        default: 0
    },

    // Phase-wise tracking
    phaseScores: [{
        phaseId: String,
        phaseNumber: Number,
        phaseName: String,
        moduleQuizzes: [{
            moduleId: String,
            moduleName: String,
            quizId: mongoose.Schema.Types.ObjectId,
            score: Number,
            percentageScore: Number,
            totalQuestions: Number,
            correctAnswers: Number,
            completedAt: Date
        }],
        phaseOverallQuiz: {
            quizId: mongoose.Schema.Types.ObjectId,
            score: Number,
            percentageScore: Number,
            totalQuestions: Number,
            correctAnswers: Number,
            completedAt: Date
        },
        phaseScore: Number, // Average of all quizzes in phase
        phaseCompletion: {
            type: String,
            enum: ['not-started', 'in-progress', 'completed'],
            default: 'not-started'
        }
    }],

    // Final assessment
    finalAssessment: {
        finalQuizId: mongoose.Schema.Types.ObjectId,
        score: Number,
        percentageScore: Number,
        totalQuestions: Number,
        correctAnswers: Number,
        completedAt: Date,
        status: {
            type: String,
            enum: ['not-started', 'completed'],
            default: 'not-started'
        }
    },

    // Performance metrics
    averageAccuracy: {
        type: Number,
        default: 0
    },

    mediumDifficultyScore: {
        type: Number,
        default: 0
    },

    hardDifficultyScore: {
        type: Number,
        default: 0
    },

    // Learning progress
    learningProgress: {
        totalPhases: Number,
        completedPhases: {
            type: Number,
            default: 0
        },
        overallCompletion: {
            type: Number,
            default: 0
        }
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update updatedAt and overall score
scoreTrackerSchema.pre('save', function() {
    this.updatedAt = Date.now();
    
    // Calculate overall score
    if (this.phaseScores && this.phaseScores.length > 0) {
        const phaseScoresArray = this.phaseScores
            .map(p => p.phaseScore || 0)
            .filter(score => score > 0);
        
        if (phaseScoresArray.length > 0) {
            this.overallScore = Math.round(
                phaseScoresArray.reduce((a, b) => a + b, 0) / phaseScoresArray.length
            );
        }

        // Calculate average accuracy
        let totalQuestions = 0;
        let totalCorrect = 0;
        
        this.phaseScores.forEach(phase => {
            phase.moduleQuizzes.forEach(mq => {
                totalQuestions += mq.totalQuestions || 0;
                totalCorrect += mq.correctAnswers || 0;
            });
            if (phase.phaseOverallQuiz) {
                totalQuestions += phase.phaseOverallQuiz.totalQuestions || 0;
                totalCorrect += phase.phaseOverallQuiz.correctAnswers || 0;
            }
        });

        this.totalQuestionsAttempted = totalQuestions;
        this.totalQuestionsCorrect = totalCorrect;
        this.averageAccuracy = totalQuestions > 0 
            ? Math.round((totalCorrect / totalQuestions) * 100)
            : 0;
    }

    if (this.finalAssessment && this.finalAssessment.status === 'completed') {
        this.learningProgress.overallCompletion = this.phaseScores.length === this.learningProgress.totalPhases ? 100 : 85;
    }
});

module.exports = mongoose.model('ScoreTracker', scoreTrackerSchema);
