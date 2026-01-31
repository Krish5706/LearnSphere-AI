// --------------------
// server.js
// --------------------

// Load environment variables FIRST
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dns = require('dns');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const userRoutes = require('./routes/userRoutes');
const todoRoutes = require('./routes/todoRoutes');
const { router: documentNoteRouter, noteRouter: individualNoteRouter } = require('./routes/noteRoutes');

// Import Middleware
const globalErrorHandler = require('./middleware/errorMiddleware');

const app = express();

// --------------------
// 1. GLOBAL MIDDLEWARE
// --------------------
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug logging for document-related requests
app.use((req, res, next) => {
    if (req.path.includes('documents')) {
        console.log('🔍 INCOMING REQUEST - Method:', req.method, 'Path:', req.path, 'Original URL:', req.originalUrl);
    }
    next();
});

// --------------------
// 2. ROUTES
// --------------------
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notes', individualNoteRouter);

// --------------------
// 3. CATCH-ALL 404
// --------------------
app.use((req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.statusCode = 404;
    next(err);
});

// --------------------
// 4. GLOBAL ERROR HANDLER
// --------------------
app.use(globalErrorHandler);

// --------------------
// 5. CONNECT TO MONGODB & START SERVER
// --------------------
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnsphere';

// Force Node to use Google DNS (bypass local DNS issues with SRV)
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Disable Mongoose buffering (fail fast if connection fails)
mongoose.set('bufferCommands', false);

const startServer = async () => {
    try {
        await mongoose.connect(DB_URI, {
            family: 4,               // Force IPv4 (fixes some querySrv errors)
            serverSelectionTimeoutMS: 10000, // 10 seconds to fail fast
        });

        console.log('✅ MongoDB Connected: Study Vault is Ready');

        app.listen(PORT, () => {
            console.log(`🚀 LearnSphere-AI Backend spinning on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1); // Exit immediately if connection fails
    }
};

// Start the server
startServer();