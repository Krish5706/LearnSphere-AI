const express = require('express');
const router = express.Router();
const {
    createTodo,
    getTodos,
    updateTodo,
    markTodoDone,
    deleteTodo,
    getTodoStats
} = require('../controllers/todoController');
const { protect } = require('../middleware/authMiddleware');

// All todo routes require authentication
router.use(protect);

// @route   POST /api/todos
// @desc    Create a new todo task
// @access  Private
router.post('/', createTodo);

// @route   GET /api/todos
// @desc    Get all todos for the authenticated user
// @access  Private
router.get('/', getTodos);

// @route   GET /api/todos/stats
// @desc    Get todo statistics for dashboard
// @access  Private
router.get('/stats', getTodoStats);

// @route   PUT /api/todos/:id
// @desc    Update a todo task
// @access  Private
router.put('/:id', updateTodo);

// @route   PATCH /api/todos/:id/done
// @desc    Mark todo as completed
// @access  Private
router.patch('/:id/done', markTodoDone);

// @route   DELETE /api/todos/:id
// @desc    Delete a todo task
// @access  Private
router.delete('/:id', deleteTodo);

module.exports = router;
