const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // Security: Never return the password in API responses
    },
    // --- CREDIT & SUBSCRIPTION LOGIC ---
    credits: {
        type: Number,
        default: 5 // Every new user starts with 5 free attempts
    },
    isSubscribed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// SECURITY: Hash the password before saving it to the database
userSchema.pre('save', async function() {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return;

    // Hash the password with a cost of 12
    this.password = await bcrypt.hash(this.password, 12);
});

// SECURITY: Method to check if the entered password matches the hashed password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;