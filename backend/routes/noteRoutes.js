const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

// Routes for notes related to a specific document
router.route('/').get(protect, getNotes).post(protect, createNote);

// Routes for a specific note (update and delete)
// Note: These routes are separate because they don't need the documentId from the URL
const noteRouter = express.Router();
noteRouter.route('/:noteId').put(protect, updateNote).delete(protect, deleteNote);

// We export both routers. The main router will be mounted under /api/documents/:documentId/notes
// and the noteRouter will be mounted under /api/notes
module.exports = { router, noteRouter };
