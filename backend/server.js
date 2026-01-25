// Load environment variables FIRST, before any other imports
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
const { router: documentNoteRouter, noteRouter: individualNoteRouter } = require('./routes/noteRoutes');

// Import Middleware
const globalErrorHandler = require('./middleware/errorMiddleware');
const app = express();

// 1. GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json()); // Crucial: must be before routes to parse JSON bodies
app.use(morgan('dev'));  // Logs requests to the console for easier debugging

// Serve uploaded PDFs as static files
// This allows the frontend to display the PDF using a URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug: Log all incoming requests BEFORE routes
app.use((req, res, next) => {
    if (req.path.includes('documents')) {
        console.log('🔍 INCOMING REQUEST - Method:', req.method, 'Path:', req.path, 'Original URL:', req.originalUrl);
    }
    next();
});

// 3. MOUNT API ROUTES
app.use('/api/auth', authRoutes);         // Login & Registration
app.use('/api/documents', documentRoutes); // AI PDF Analysis & History
app.use('/api/users', userRoutes);         // Profile & Credits
app.use('/api/notes', individualNoteRouter); // Update/Delete individual notes

// 4. CATCH-ALL 404 HANDLER
// If a request hits this, it means no route above matched
app.use((req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.statusCode = 404;
    next(err); // Pass error to the Global Error Handler below
});

// 5. GLOBAL ERROR HANDLING MIDDLEWARE
// This catches all errors (AI failures, DB issues, etc.) and sends clean JSON to frontend
app.use(globalErrorHandler);

// 6. DATABASE CONNECTION & START SERVER
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // FIX: Force DNS to Google Public DNS to bypass local ISP/Network blocks on SRV records
        dns.setServers(['8.8.8.8', '8.8.4.4']);

        // Attempt to connect with IPv4 forced (fixes some querySrv errors)
        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4, 
        });

        console.log('✅ MongoDB Connected: Study Vault is Ready');
        app.listen(PORT, () => {
            console.log(`🚀 LearnSphere-AI Backend spinning on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1); // Exit immediately so we don't hang on requests
    }
};

startServer();