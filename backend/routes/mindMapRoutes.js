const express = require('express');
const router = express.Router();

const mindMapController = require('../controllers/mindMapController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, mindMapController.generateMindMap);
router.post('/save', protect, mindMapController.saveMindMap);
router.get('/:docId', protect, mindMapController.getMindMapByDocument);

module.exports = router;
