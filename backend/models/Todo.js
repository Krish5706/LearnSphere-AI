const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    // Link to the authenticated user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Task details
    title: {
        type: String,
        required: [true, 'Please provide a task title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },

    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },

    // Task status and priority
    status: {
        type: String,
        enum: ['pending', 'completed', 'missed'],
        default: 'pending'
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    // Due date for the task
    dueDate: {
        type: Date,
        required: [true, 'Please provide a due date']
    },

    // Optional links to learning entities
    linkedEntity: {
        type: {
            type: String,
            enum: ['document', 'quiz', 'note'],
            default: null
        },
        entityId: {
            type: String,  // Store as string to be flexible with validation
            default: null
        },
        entityTitle: {
            type: String,
            default: null
        }
    },

    // Completion tracking
    completedAt: {
        type: Date
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes for better performance
todoSchema.index({ user: 1, status: 1 });
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ user: 1, priority: 1 });

// Update the updatedAt field before saving
todoSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (next && typeof next === 'function') {
        next();
    }
});

module.exports = mongoose.model('Todo', todoSchema);
