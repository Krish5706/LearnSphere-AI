import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createTodo, updateTodo } from '../../services/todoService';

const AddEditTodoModal = ({ isOpen, todo, onClose, onSaved }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        linkedEntity: {
            type: '',
            entityId: ''
        }
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (todo) {
            setFormData({
                title: todo.title || '',
                description: todo.description || '',
                priority: todo.priority || 'medium',
                dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
                linkedEntity: todo.linkedEntity || {
                    type: '',
                    entityId: ''
                }
            });
            setError('');
        } else {
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                dueDate: '',
                linkedEntity: {
                    type: '',
                    entityId: ''
                }
            });
            setError('');
        }
    }, [todo, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'title' || name === 'description' || name === 'priority' || name === 'dueDate') {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        } else if (name.startsWith('linkedEntity.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                linkedEntity: {
                    ...prev.linkedEntity,
                    [field]: value
                }
            }));
        }
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Task title is required');
            return false;
        }

        if (!formData.dueDate) {
            setError('Due date is required');
            return false;
        }

        const selectedDate = new Date(formData.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!todo && selectedDate < today) {
            setError('Due date cannot be in the past');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Prepare data for submission
            const submitData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                priority: formData.priority,
                dueDate: new Date(formData.dueDate).toISOString()
            };

            // Only include linkedEntity if type is selected
            if (formData.linkedEntity.type && formData.linkedEntity.entityId) {
                submitData.linkedEntity = formData.linkedEntity;
            }

            if (todo) {
                // Update existing todo
                await updateTodo(todo._id, submitData);
            } else {
                // Create new todo
                await createTodo(submitData);
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error('Error saving todo:', err);
            setError(err.message || 'Failed to save task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">
                        {todo ? 'Edit Task' : 'Add New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-2">
                            Task Title *
                        </label>
                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Read Chapter 5 Summary"
                            maxLength={100}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {formData.title.length}/100
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-bold text-slate-700 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Add notes or context..."
                            maxLength={500}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            disabled={loading}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {formData.description.length}/500
                        </p>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-bold text-slate-700 mb-2">
                            Due Date *
                        </label>
                        <input
                            id="dueDate"
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label htmlFor="priority" className="block text-sm font-bold text-slate-700 mb-2">
                            Priority
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    {/* Linked Entity Type */}
                    <div>
                        <label htmlFor="linkedType" className="block text-sm font-bold text-slate-700 mb-2">
                            Link to Resource (Optional)
                        </label>
                        <select
                            id="linkedType"
                            name="linkedEntity.type"
                            value={formData.linkedEntity.type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            <option value="">None</option>
                            <option value="document">PDF Document</option>
                            <option value="quiz">Quiz</option>
                            <option value="note">Note</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            Link this task to existing study material
                        </p>
                    </div>

                    {/* Linked Entity ID */}
                    {formData.linkedEntity.type && (
                        <div>
                            <label htmlFor="linkedId" className="block text-sm font-bold text-slate-700 mb-2">
                                {formData.linkedEntity.type.charAt(0).toUpperCase() + formData.linkedEntity.type.slice(1)} ID
                            </label>
                            <input
                                id="linkedId"
                                type="text"
                                name="linkedEntity.entityId"
                                value={formData.linkedEntity.entityId}
                                onChange={handleChange}
                                placeholder="Paste the ID here"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : todo ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditTodoModal;
