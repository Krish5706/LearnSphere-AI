const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    // Link to the authenticated user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Quiz metadata
    quizTitle: {
        type: String,
        required: [true, 'Please provide a quiz title'],
        trim: true
    },

    quizType: {
        type: String,
        enum: ['module-quiz', 'phase-quiz', 'final-quiz'],
        default: 'module-quiz',
        required: true
    },

    // Link to roadmap and phase/module
    roadmapId: {
        type: String,
        required: true
    },

    phaseId: {
        type: String,
        required: true
    },

    phaseNumber: {
        type: Number,
        required: true
    },

    phaseName: {
        type: String,
        required: true
    },

    moduleId: {
        type: String,
        default: null
    },

    moduleName: {
        type: String,
        default: null
    },

    topicsCovered: [{
        type: String
    }],

    // Quiz questions and structure
    questions: [{
        questionId: String,
        questionText: String,
        questionType: {
            type: String,
            enum: ['mcq'],
            default: 'mcq'
        },
        options: [String],
        correctAnswer: String,
        explanation: String,
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        topic: String
    }],

    totalQuestions: {
        type: Number,
        default: 0
    },

    // User attempt data
    attempts: [{
        attemptNumber: Number,
        totalScore: Number,
        percentageScore: Number,
        timeTaken: Number, // in minutes
        answers: [{
            questionId: String,
            selectedAnswer: String,
            isCorrect: Boolean,
            markedTime: Number // in milliseconds from start
        }],
        completedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Best attempt tracking
    bestAttempt: {
        attemptNumber: Number,
        score: Number,
        percentageScore: Number,
        completedAt: Date
    },

    // Quiz status
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed'],
        default: 'not-started'
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

// Middleware to update updatedAt
quizSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Quiz', quizSchema);
