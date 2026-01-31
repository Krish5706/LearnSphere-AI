import React from 'react';
import { Trash2, Edit2, CheckCircle2, Circle, AlertTriangle, Calendar, BookOpen } from 'lucide-react';
import { markTodoComplete, deleteTodo } from '../../services/todoService';

const TodoItem = ({ todo, onEdit, onDelete, onStatusChange }) => {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'text-red-600 bg-red-50';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50';
            case 'low':
                return 'text-green-600 bg-green-50';
            default:
                return 'text-slate-600 bg-slate-50';
        }
    };

    const getPriorityLabel = (priority) => {
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);

        if (d.getTime() === today.getTime()) {
            return 'Today';
        } else if (d.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const isOverdue = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(todo.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return todo.status === 'pending' && dueDate < today;
    };

    const handleMarkComplete = async () => {
        try {
            await markTodoComplete(todo._id);
            onStatusChange();
        } catch (error) {
            console.error('Error marking todo complete:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTodo(todo._id);
                onDelete();
            } catch (error) {
                console.error('Error deleting todo:', error);
            }
        }
    };

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                todo.status === 'completed'
                    ? 'bg-slate-50 border-slate-200'
                    : isOverdue()
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
        >
            {/* Checkbox */}
            <button
                onClick={handleMarkComplete}
                className="mt-1 flex-shrink-0 focus:outline-none"
                title={todo.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
            >
                {todo.status === 'completed' ? (
                    <CheckCircle2 size={24} className="text-green-600" />
                ) : (
                    <Circle size={24} className="text-slate-300 hover:text-blue-600 transition-colors" />
                )}
            </button>

            {/* Content */}
            <div className="flex-grow min-w-0">
                <div className="flex items-start gap-2 mb-1">
                    <h3
                        className={`font-bold flex-grow ${
                            todo.status === 'completed'
                                ? 'line-through text-slate-500'
                                : 'text-slate-800'
                        }`}
                    >
                        {todo.title}
                    </h3>
                    {isOverdue() && (
                        <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
                    )}
                </div>

                {todo.description && (
                    <p className={`text-sm mb-2 ${
                        todo.status === 'completed'
                            ? 'text-slate-400'
                            : 'text-slate-600'
                    }`}>
                        {todo.description}
                    </p>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Due Date */}
                    <div className={`flex items-center gap-1 ${
                        isOverdue() ? 'text-red-600' : 'text-slate-500'
                    }`}>
                        <Calendar size={14} />
                        <span>{formatDate(todo.dueDate)}</span>
                    </div>

                    {/* Priority */}
                    <span className={`px-2 py-1 rounded-full font-bold ${getPriorityColor(todo.priority)}`}>
                        {getPriorityLabel(todo.priority)}
                    </span>

                    {/* Linked Entity */}
                    {todo.linkedEntity && todo.linkedEntity.entityId && (
                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            <BookOpen size={14} />
                            <span className="capitalize">{todo.linkedEntity.type}</span>
                        </div>
                    )}

                    {/* Status Badge */}
                    {todo.status === 'completed' && (
                        <span className="px-2 py-1 rounded-full text-green-700 bg-green-50 font-bold">
                            Completed
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            {todo.status !== 'completed' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => onEdit(todo)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit task"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete task"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TodoItem;
