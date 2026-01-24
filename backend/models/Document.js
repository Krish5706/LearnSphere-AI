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
        enum: ['summary', 'quiz', 'comprehensive'],
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
        type: { type: String, enum: ['summary', 'quiz', 'comprehensive'] },
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