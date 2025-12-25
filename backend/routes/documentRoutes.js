const express = require('express');
const router = express.Router();
const docController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * PATH: /api/documents
 */

// 1. Get all documents for the dashboard
router.get('/', protect, docController.getUserDocuments);

// 2. Upload and Analyze PDF
// Note: 'pdf' must match the name in your Frontend FormData: formData.append('pdf', file)
router.post('/upload', protect, upload.single('pdf'), docController.uploadAndAnalyze);

// 3. Delete an analysis
router.delete('/:id', protect, docController.deleteDocument);

module.exports = router;