const Todo = require('../models/Todo');
const asyncHandler = require('express-async-handler');

// @desc    Create a new todo task
// @route   POST /api/todos
// @access  Private
const createTodo = asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, linkedEntity } = req.body;

    // Validate required fields
    if (!title || !dueDate) {
        res.status(400);
        throw new Error('Title and due date are required');
    }

    // Validate due date is not in the past
    if (new Date(dueDate) < new Date()) {
        res.status(400);
        throw new Error('Due date cannot be in the past');
    }

    // Create the todo
    const todo = await Todo.create({
        user: req.user._id,
        title,
        description,
        priority: priority || 'medium',
        dueDate,
        linkedEntity
    });

    // Populate linked entity if provided
    if (linkedEntity && linkedEntity.type && linkedEntity.entityId) {
        await todo.populate('linkedEntity.entityId');
    }

    res.status(201).json({
        success: true,
        data: todo
    });
});

// @desc    Get all todos for the authenticated user
// @route   GET /api/todos
// @access  Private
const getTodos = asyncHandler(async (req, res) => {
    const { status, priority, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;

    // Build filter object
    const filter = { user: req.user._id };

    if (status) {
        filter.status = status;
    }

    if (priority) {
        filter.priority = priority;
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const todos = await Todo.find(filter)
        .populate('linkedEntity.entityId')
        .sort(sortOptions);

    res.status(200).json({
        success: true,
        count: todos.length,
        data: todos
    });
});

// @desc    Update a todo task
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, linkedEntity } = req.body;

    // Find the todo and check ownership
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        res.status(404);
        throw new Error('Todo not found');
    }

    // Check if user owns this todo
    if (todo.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this todo');
    }

    // Validate due date if provided
    if (dueDate && new Date(dueDate) < new Date()) {
        res.status(400);
        throw new Error('Due date cannot be in the past');
    }

    // Update the todo
    const updatedTodo = await Todo.findByIdAndUpdate(
        req.params.id,
        {
            title,
            description,
            priority,
            dueDate,
            linkedEntity,
            updatedAt: Date.now()
        },
        { new: true, runValidators: true }
    ).populate('linkedEntity.entityId');

    res.status(200).json({
        success: true,
        data: updatedTodo
    });
});

// @desc    Mark todo as completed
// @route   PATCH /api/todos/:id/done
// @access  Private
const markTodoDone = asyncHandler(async (req, res) => {
    // Find the todo and check ownership
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        res.status(404);
        throw new Error('Todo not found');
    }

    // Check if user owns this todo
    if (todo.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this todo');
    }

    // Update status and completion time
    const updateData = {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: Date.now()
    };

    const updatedTodo = await Todo.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
    ).populate('linkedEntity.entityId');

    res.status(200).json({
        success: true,
        data: updatedTodo
    });
});

// @desc    Delete a todo task
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = asyncHandler(async (req, res) => {
    // Find the todo and check ownership
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        res.status(404);
        throw new Error('Todo not found');
    }

    // Check if user owns this todo
    if (todo.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this todo');
    }

    // Delete the todo
    await Todo.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Todo deleted successfully'
    });
});

// @desc    Get todo statistics for dashboard
// @route   GET /api/todos/stats
// @access  Private
const getTodoStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get counts
    const [totalTodos, completedTodos, pendingTodos, todayTodos] = await Promise.all([
        Todo.countDocuments({ user: userId }),
        Todo.countDocuments({ user: userId, status: 'completed' }),
        Todo.countDocuments({ user: userId, status: 'pending' }),
        Todo.countDocuments({
            user: userId,
            dueDate: { $gte: today, $lt: tomorrow }
        })
    ]);

    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    res.status(200).json({
        success: true,
        data: {
            total: totalTodos,
            completed: completedTodos,
            pending: pendingTodos,
            dueToday: todayTodos,
            completionRate
        }
    });
});

module.exports = {
    createTodo,
    getTodos,
    updateTodo,
    markTodoDone,
    deleteTodo,
    getTodoStats
};
