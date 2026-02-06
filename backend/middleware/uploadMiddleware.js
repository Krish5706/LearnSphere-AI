const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename to prevent path traversal and injection attacks
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const ext = path.extname(originalName).toLowerCase();

        // Only allow .pdf extension
        if (ext !== '.pdf') {
            return cb(new Error('Invalid file extension. Only PDF files are allowed.'), false);
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeName = `pdf-${uniqueSuffix}.pdf`;
        cb(null, safeName);
    }
});

const fileFilter = (req, file, cb) => {
    // Strict MIME type validation
    const allowedMimes = ['application/pdf', 'application/x-pdf'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only allow 1 file per request
    }
});

module.exports = upload;
