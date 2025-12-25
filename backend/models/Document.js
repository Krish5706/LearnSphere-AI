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
    
    // AI GENERATED DATA
    summary: {
        short: { type: String },
        long: { type: String },
        medium: { type: String }
    },
    
    // Key insights array (the bullet points we used in Document.jsx)
    keyPoints: [{
        type: String
    }],

    // Mind Map data structure (to be consumed by React Flow)
    mindMap: {
        nodes: { type: Array, default: [] },
        edges: { type: Array, default: [] }
    },

    // Quiz array
    quizzes: [{
        question: { type: String },
        options: [{ type: String }],
        correctAnswer: { type: String },
        explanation: { type: String }
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexing for faster searches by user
documentSchema.index({ user: 1 });

module.exports = mongoose.model('Document', documentSchema);