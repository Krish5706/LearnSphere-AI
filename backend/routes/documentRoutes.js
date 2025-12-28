const express = require('express');
const router = express.Router();
const docController = require('../controllers/documentControllerNew');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/**
 * PATH: /api/documents
 */

// Get all documents for the dashboard
router.get('/', protect, docController.getUserDocuments);

// Upload PDF (Step 1: Just upload, no processing) - MUST BE BEFORE /:id
// ✅ Validation: Max 30 pages, 10MB size
router.post('/upload', protect, upload.single('pdf'), docController.uploadPDF);

// Process PDF with selected options (Step 2: User chooses summary/quiz/mindmap)
router.post('/process', protect, docController.processPDF);

// Submit quiz answers (Step 3: User submits quiz) - MUST BE BEFORE /:id
// Routes: /api/documents/submit-quiz (matches frontend API call)
router.post('/submit-quiz', protect, docController.submitQuizAnswers);
router.post('/quiz/submit', protect, docController.submitQuizAnswers); // Alternative route

// Generate report PDF (Step 4: Export results as PDF)
router.post('/report/generate', protect, docController.generateReportPDF);

// BACKWARD COMPATIBILITY - Old upload & analyze endpoint
router.post('/upload-and-analyze', protect, upload.single('pdf'), docController.uploadAndAnalyze);

// Get single document - MUST BE LAST (catches /:id)
router.get('/:id', protect, docController.getDocument);

// Delete a document - MUST BE LAST (catches /:id)
router.delete('/:id', protect, docController.deleteDocument);

module.exports = router;
