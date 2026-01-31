import React from 'react';
import { Filter, X } from 'lucide-react';

const TodoFilters = ({ filters, onFilterChange }) => {
    const handleStatusChange = (status) => {
        onFilterChange({
            ...filters,
            status: filters.status === status ? '' : status
        });
    };

    const handlePriorityChange = (priority) => {
        onFilterChange({
            ...filters,
            priority: filters.priority === priority ? '' : priority
        });
    };

    const handleSortChange = (sortBy) => {
        const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
        onFilterChange({
            ...filters,
            sortBy,
            sortOrder: newSortOrder
        });
    };

    const clearFilters = () => {
        onFilterChange({
            status: '',
            priority: '',
            sortBy: 'dueDate',
            sortOrder: 'asc'
        });
    };

    const hasActiveFilters = filters.status || filters.priority ||
        filters.sortBy !== 'dueDate' || filters.sortOrder !== 'asc';

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-600" />
                    <h3 className="font-bold text-slate-800">Filters & Sort</h3>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-bold"
                    >
                        <X size={14} />
                        Clear
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                    <div className="flex gap-2">
                        {['pending', 'completed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${
                                    filters.status === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {status === 'pending' ? 'Pending' : 'Completed'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Priority Filter */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                    <div className="flex gap-2">
                        {['low', 'medium', 'high'].map((priority) => (
                            <button
                                key={priority}
                                onClick={() => handlePriorityChange(priority)}
                                className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${
                                    filters.priority === priority
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort Options */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Sort By</label>
                    <div className="flex gap-2">
                        {[
                            { key: 'dueDate', label: 'Due Date' },
                            { key: 'priority', label: 'Priority' },
                            { key: 'createdAt', label: 'Created' }
                        ].map((option) => (
                            <button
                                key={option.key}
                                onClick={() => handleSortChange(option.key)}
                                className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${
                                    filters.sortBy === option.key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {option.label}
                                {filters.sortBy === option.key && (
                                    <span className="ml-1">
                                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TodoFilters;
