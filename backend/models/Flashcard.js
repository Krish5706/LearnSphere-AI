/**
 * Flashcard Model - Spaced Repetition System (SRS)
 * 
 * Implements SM-2 algorithm for scientifically-proven memory retention.
 * Each flashcard tracks its own learning progress and scheduling.
 * 
 * SM-2 Algorithm Overview:
 * - Ease Factor (EF): Difficulty multiplier (starts at 2.5)
 * - Interval: Days until next review
 * - Repetitions: Number of successful recalls in a row
 * - Quality: User rating (0-5) determining recall quality
 */

const mongoose = require('mongoose');

// Individual review history entry
const reviewHistorySchema = new mongoose.Schema({
    reviewedAt: {
        type: Date,
        default: Date.now
    },
    quality: {
        type: Number,
        min: 0,
        max: 5,
        required: true
    },
    responseTime: {
        type: Number, // milliseconds to respond
        default: 0
    },
    previousInterval: Number,
    newInterval: Number,
    previousEaseFactor: Number,
    newEaseFactor: Number
}, { _id: false });

// Main Flashcard Schema
const flashcardSchema = new mongoose.Schema({
    // Ownership
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Optional link to source document
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        default: null
    },

    // Deck organization
    deck: {
        type: String,
        required: true,
        trim: true,
        default: 'Default Deck'
    },

    // Card content
    front: {
        type: String,
        required: [true, 'Front side content is required'],
        trim: true,
        maxlength: 2000
    },
    back: {
        type: String,
        required: [true, 'Back side content is required'],
        trim: true,
        maxlength: 5000
    },

    // Optional extras
    hint: {
        type: String,
        trim: true,
        maxlength: 500
    },
    explanation: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],

    // Source metadata (for AI-generated cards)
    source: {
        type: {
            type: String,
            enum: ['manual', 'ai-generated', 'imported'],
            default: 'manual'
        },
        context: String,  // Surrounding text from document
        pageNumber: Number,
        sectionTitle: String
    },

    // ==========================================
    // SM-2 ALGORITHM PARAMETERS
    // ==========================================

    // Ease Factor (EF) - Reflects card difficulty
    // Range: 1.3 (hardest) to 2.5+ (easiest)
    // Initial: 2.5
    easeFactor: {
        type: Number,
        default: 2.5,
        min: 1.3
    },

    // Interval - Days until next review
    interval: {
        type: Number,
        default: 0  // 0 = new card, needs first review
    },

    // Repetitions - Consecutive correct recalls
    repetitions: {
        type: Number,
        default: 0
    },

    // Learning status
    status: {
        type: String,
        enum: ['new', 'learning', 'review', 'relearning', 'graduated', 'suspended'],
        default: 'new'
    },

    // Card maturity level
    maturityLevel: {
        type: String,
        enum: ['new', 'young', 'mature', 'mastered'],
        default: 'new'
    },

    // ==========================================
    // SCHEDULING
    // ==========================================

    // Next scheduled review date
    nextReviewDate: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Last review date
    lastReviewDate: {
        type: Date,
        default: null
    },

    // ==========================================
    // STATISTICS
    // ==========================================

    // Total review count
    totalReviews: {
        type: Number,
        default: 0
    },

    // Correct answer count
    correctCount: {
        type: Number,
        default: 0
    },

    // Incorrect answer count (quality < 3)
    incorrectCount: {
        type: Number,
        default: 0
    },

    // Average response time (ms)
    averageResponseTime: {
        type: Number,
        default: 0
    },

    // Lapses - Times card went from graduated back to learning
    lapses: {
        type: Number,
        default: 0
    },

    // Streak - Current consecutive correct answers
    streak: {
        type: Number,
        default: 0
    },

    // Longest streak ever achieved
    longestStreak: {
        type: Number,
        default: 0
    },

    // Review history (last 50 reviews for analysis)
    reviewHistory: {
        type: [reviewHistorySchema],
        default: [],
        validate: [arrayLimit, 'Review history exceeds 50 entries limit']
    },

    // ==========================================
    // METADATA
    // ==========================================

    isArchived: {
        type: Boolean,
        default: false
    },

    isFavorite: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Limit review history to 50 entries
function arrayLimit(val) {
    return val.length <= 50;
}

// Indexes for efficient querying
flashcardSchema.index({ user: 1, deck: 1 });
flashcardSchema.index({ user: 1, nextReviewDate: 1 });
flashcardSchema.index({ user: 1, status: 1 });
flashcardSchema.index({ user: 1, document: 1 });
flashcardSchema.index({ user: 1, tags: 1 });

// Update timestamp on save
flashcardSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Virtual for retention rate
flashcardSchema.virtual('retentionRate').get(function() {
    const total = this.correctCount + this.incorrectCount;
    if (total === 0) return 0;
    return Math.round((this.correctCount / total) * 100);
});

// Virtual for days until due
flashcardSchema.virtual('daysUntilDue').get(function() {
    const now = new Date();
    const diff = this.nextReviewDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for due status
flashcardSchema.virtual('isDue').get(function() {
    return new Date() >= this.nextReviewDate;
});

// Method to check if card is overdue
flashcardSchema.methods.isOverdue = function() {
    return new Date() > this.nextReviewDate;
};

// Method to get difficulty label
flashcardSchema.methods.getDifficultyLabel = function() {
    if (this.easeFactor >= 2.4) return 'Easy';
    if (this.easeFactor >= 2.0) return 'Medium';
    if (this.easeFactor >= 1.7) return 'Hard';
    return 'Very Hard';
};

// Enable virtuals in JSON output
flashcardSchema.set('toJSON', { virtuals: true });
flashcardSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Flashcard', flashcardSchema);
