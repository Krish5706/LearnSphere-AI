const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // Prevents password from being sent in API responses
    },
    credits: {
        type: Number,
        default: 5 // Default free credits for new users
    },
    isSubscribed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
    // Only hash password if it's been modified (or is new)
    if (!this.isModified('password')) {
        if (next && typeof next === 'function') {
            return next();
        }
        return;
    }
    this.password = await bcrypt.hash(this.password, 12);
    if (next && typeof next === 'function') {
        next();
    }
});

// Method to verify password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);