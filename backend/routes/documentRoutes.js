const express = require('express');
const router = express.Router();
const docController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Route for uploading a new document
// protect -> upload.single -> controller
router.post('/upload', protect, upload.single('pdf'), docController.uploadAndAnalyze);

// Route for getting all documents for the logged-in user
router.get('/', protect, docController.getUserDocuments);

router.delete('/:id', protect, docController.deleteDocument);

module.exports = router;