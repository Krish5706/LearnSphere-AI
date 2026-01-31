import React, { useState, useEffect } from 'react';
import { Plus, Filter, Calendar, CheckCircle2, Circle, Clock, AlertTriangle, BookOpen } from 'lucide-react';
import TodoItem from './TodoItem';
import TodoFilters from './TodoFilters';
import AddEditTodoModal from './AddEditTodoModal';
import { getTodos, getTodoStats } from '../../services/todoService';

const TodoList = () => {
    const [todos, setTodos] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        sortBy: 'dueDate',
        sortOrder: 'asc'
    });
    const [showModal, setShowModal] = useState(false);
    const [editingTodo, setEditingTodo] = useState(null);

    useEffect(() => {
        loadTodos();
        loadStats();
    }, [filters]);

    const loadTodos = async () => {
        try {
            const response = await getTodos(filters);
            setTodos(response.data);
        } catch (error) {
            console.error('Error loading todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await getTodoStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleAddTodo = () => {
        setEditingTodo(null);
        setShowModal(true);
    };

    const handleEditTodo = (todo) => {
        setEditingTodo(todo);
        setShowModal(true);
    };

    const handleTodoSaved = () => {
        setShowModal(false);
        loadTodos();
        loadStats();
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Study Tasks</h1>
                    <p className="text-slate-500 mt-1">Plan and track your learning activities</p>
                </div>
                <button
                    onClick={handleAddTodo}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Task
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                            <BookOpen size={16} />
                            <span className="text-sm font-bold">Total Tasks</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">{stats.total}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <CheckCircle2 size={16} />
                            <span className="text-sm font-bold">Completed</span>
                        </div>
                        <p className="text-2xl font-black text-green-600">{stats.completed}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 text-orange-600 mb-2">
                            <Clock size={16} />
                            <span className="text-sm font-bold">Pending</span>
                        </div>
                        <p className="text-2xl font-black text-orange-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <Calendar size={16} />
                            <span className="text-sm font-bold">Due Today</span>
                        </div>
                        <p className="text-2xl font-black text-blue-600">{stats.dueToday}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <TodoFilters filters={filters} onFilterChange={handleFilterChange} />

            {/* Todo List */}
            <div className="space-y-3">
                {todos.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-600 mb-2">No study tasks yet</h3>
                        <p className="text-slate-500 mb-4">Create your first learning task to get started</p>
                        <button
                            onClick={handleAddTodo}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Add Your First Task
                        </button>
                    </div>
                ) : (
                    todos.map((todo) => (
                        <TodoItem
                            key={todo._id}
                            todo={todo}
                            onEdit={handleEditTodo}
                            onDelete={loadTodos}
                            onStatusChange={loadTodos}
                        />
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <AddEditTodoModal
                    isOpen={showModal}
                    todo={editingTodo}
                    onClose={() => setShowModal(false)}
                    onSaved={handleTodoSaved}
                />
            )}
        </div>
    );
};

export default TodoList;
