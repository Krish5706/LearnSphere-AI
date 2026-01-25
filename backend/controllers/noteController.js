const asyncHandler = require('express-async-handler');
const Note = require('../models/Note');
const Document = require('../models/Document');

// Helper to escape regex special characters for safe search
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// @desc    Get notes for a document
// @route   GET /api/documents/:documentId/notes
// @access  Private
const getNotes = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { search } = req.query;

  // Check if document exists and belongs to the user
  const document = await Document.findById(documentId);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  if (document.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  let query = { document: documentId, user: req.user.id };

  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { content: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const notes = await Note.find(query).sort({ createdAt: -1 });

  res.status(200).json(notes);
});

// @desc    Create a new note
// @route   POST /api/documents/:documentId/notes
// @access  Private
const createNote = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('Please provide title and content');
  }

  // Check if document exists and belongs to the user
  const document = await Document.findById(documentId);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  if (document.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  const note = await Note.create({
    user: req.user.id,
    document: documentId,
    title,
    content,
  });

  res.status(201).json(note);
});

// @desc    Update a note
// @route   PUT /api/notes/:noteId
// @access  Private
const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { title, content } = req.body;

  const note = await Note.findById(noteId);

  if (!note) {
    res.status(404);
    throw new Error('Note not found');
  }

  // Make sure the logged in user matches the note user
  if (note.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  note.title = title || note.title;
  note.content = content || note.content;

  const updatedNote = await note.save();

  res.status(200).json(updatedNote);
});

// @desc    Delete a note
// @route   DELETE /api/notes/:noteId
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findById(noteId);

  if (!note) {
    res.status(404);
    throw new Error('Note not found');
  }

  // Make sure the logged in user matches the note user
  if (note.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  await note.deleteOne();

  res.status(200).json({ id: noteId });
});

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};
