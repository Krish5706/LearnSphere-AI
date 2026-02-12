const Todo = require('../models/Todo');

// Simple async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Create a new todo task
// @route   POST /api/todos
// @access  Private
const createTodo = asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, linkedEntity } = req.body;
    const Document = require('../models/Document');
    const Note = require('../models/Note');

    console.log('📝 Creating todo with data:', { title, description, priority, dueDate, linkedEntity, userId: req.user._id });

    // Validate required fields
    if (!title || !dueDate) {
        return res.status(400).json({ success: false, message: 'Title and due date are required' });
    }

    // Validate due date is not in the past
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    dueDateObj.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    
    if (dueDateObj < now) {
        return res.status(400).json({ success: false, message: 'Due date cannot be in the past' });
    }

    // Build todo data object
    const todoData = {
        user: req.user._id,
        title,
        description,
        priority: priority || 'medium',
        dueDate: dueDateObj
    };

    // Only add linkedEntity if it has a type (is not just an empty object)
    if (linkedEntity && linkedEntity.type) {
        todoData.linkedEntity = {
            type: linkedEntity.type,
            entityId: linkedEntity.entityId || null,
            entityTitle: linkedEntity.entityTitle || null
        };
    }

    try {
        const todo = await Todo.create(todoData);
        console.log('✅ Todo created successfully:', todo._id);
        
        // Enrich linkedEntity with actual name
        const todoObj = todo.toObject();
        if (todoObj.linkedEntity && todoObj.linkedEntity.entityId) {
            try {
                if (todoObj.linkedEntity.type === 'document') {
                    const doc = await Document.findById(todoObj.linkedEntity.entityId).select('fileName');
                    if (doc) {
                        todoObj.linkedEntity.entityName = doc.fileName;
                    }
                } else if (todoObj.linkedEntity.type === 'note') {
                    const note = await Note.findById(todoObj.linkedEntity.entityId).select('title');
                    if (note) {
                        todoObj.linkedEntity.entityName = note.title;
                    }
                }
            } catch (error) {
                console.error('Error fetching linked entity:', error.message);
            }
        }
        
        res.status(201).json({
            success: true,
            data: todoObj
        });
    } catch (error) {
        console.error('❌ Todo creation error:', error.message, error);
        return res.status(400).json({ success: false, message: error.message });
    }
});

// @desc    Get all todos for the authenticated user
// @route   GET /api/todos
// @access  Private
const getTodos = asyncHandler(async (req, res) => {
    const { status, priority, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;
    const Document = require('../models/Document');
    const Note = require('../models/Note');

    // Auto-mark overdue pending tasks as missed
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    await Todo.updateMany(
        {
            user: req.user._id,
            status: 'pending',
            dueDate: { $lt: now }
        },
        { status: 'missed', updatedAt: Date.now() }
    );

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

    const todos = await Todo.find(filter).sort(sortOptions);

    // Populate linkedEntity with actual document/note/quiz name
    const enrichedTodos = await Promise.all(
        todos.map(async (todo) => {
            const todoObj = todo.toObject();
            
            if (todoObj.linkedEntity && todoObj.linkedEntity.entityId) {
                try {
                    if (todoObj.linkedEntity.type === 'document') {
                        const doc = await Document.findById(todoObj.linkedEntity.entityId).select('fileName');
                        if (doc) {
                            todoObj.linkedEntity.entityName = doc.fileName;
                        }
                    } else if (todoObj.linkedEntity.type === 'note') {
                        const note = await Note.findById(todoObj.linkedEntity.entityId).select('title');
                        if (note) {
                            todoObj.linkedEntity.entityName = note.title;
                        }
                    }
                } catch (error) {
                    console.error('Error fetching linked entity:', error.message);
                }
            }
            
            return todoObj;
        })
    );

    res.status(200).json({
        success: true,
        count: enrichedTodos.length,
        data: enrichedTodos
    });
});

// @desc    Update a todo task
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, linkedEntity } = req.body;
    const Document = require('../models/Document');
    const Note = require('../models/Note');

    // Find the todo and check ownership
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Check if user owns this todo
    if (todo.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this todo' });
    }

    // Validate due date if provided
    if (dueDate) {
        const dueDateObj = new Date(dueDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        dueDateObj.setHours(0, 0, 0, 0);
        
        if (dueDateObj < now) {
            return res.status(400).json({ success: false, message: 'Due date cannot be in the past' });
        }
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
    );

    // Enrich linkedEntity with actual name
    const todoObj = updatedTodo.toObject();
    if (todoObj.linkedEntity && todoObj.linkedEntity.entityId) {
        try {
            if (todoObj.linkedEntity.type === 'document') {
                const doc = await Document.findById(todoObj.linkedEntity.entityId).select('fileName');
                if (doc) {
                    todoObj.linkedEntity.entityName = doc.fileName;
                }
            } else if (todoObj.linkedEntity.type === 'note') {
                const note = await Note.findById(todoObj.linkedEntity.entityId).select('title');
                if (note) {
                    todoObj.linkedEntity.entityName = note.title;
                }
            }
        } catch (error) {
            console.error('Error fetching linked entity:', error.message);
        }
    }

    res.status(200).json({
        success: true,
        data: todoObj
    });
});

// @desc    Mark todo as completed
// @route   PATCH /api/todos/:id/done
// @access  Private
const markTodoDone = asyncHandler(async (req, res) => {
    const Document = require('../models/Document');
    const Note = require('../models/Note');

    // Find the todo and check ownership
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Check if user owns this todo
    if (todo.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this todo' });
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
    );

    // Enrich linkedEntity with actual name
    const todoObj = updatedTodo.toObject();
    if (todoObj.linkedEntity && todoObj.linkedEntity.entityId) {
        try {
            if (todoObj.linkedEntity.type === 'document') {
                const doc = await Document.findById(todoObj.linkedEntity.entityId).select('fileName');
                if (doc) {
                    todoObj.linkedEntity.entityName = doc.fileName;
                }
            } else if (todoObj.linkedEntity.type === 'note') {
                const note = await Note.findById(todoObj.linkedEntity.entityId).select('title');
                if (note) {
                    todoObj.linkedEntity.entityName = note.title;
                }
            }
        } catch (error) {
            console.error('Error fetching linked entity:', error.message);
        }
    }

    res.status(200).json({
        success: true,
        data: todoObj
    });
});

// @desc    Delete a todo task
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = asyncHandler(async (req, res) => {
    // Find the todo and check ownership
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Check if user owns this todo
    if (todo.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this todo' });
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

    // Auto-mark overdue pending tasks as missed
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    await Todo.updateMany(
        {
            user: userId,
            status: 'pending',
            dueDate: { $lt: now }
        },
        { status: 'missed', updatedAt: Date.now() }
    );

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get counts
    const [totalTodos, completedTodos, pendingTodos, missedTodos, todayTodos] = await Promise.all([
        Todo.countDocuments({ user: userId }),
        Todo.countDocuments({ user: userId, status: 'completed' }),
        Todo.countDocuments({ user: userId, status: 'pending' }),        Todo.countDocuments({ user: userId, status: 'missed' }),        Todo.countDocuments({
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
            missed: missedTodos,
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
