import React, { useState, useEffect } from "react";
import {
  Plus,
  Filter,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import TodoItem from "./TodoItem";
import TodoFilters from "./TodoFilters";
import AddEditTodoModal from "./AddEditTodoModal";
import { getTodos, getTodoStats } from "../../services/todoService";

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    sortBy: "dueDate",
    sortOrder: "asc",
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
      console.error("Error loading todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getTodoStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
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
          <p className="text-slate-500 mt-1">
            Plan and track your learning activities
          </p>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {/* Total Tasks */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <BookOpen size={16} />
              <span className="text-sm font-medium">Total Tasks</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {stats.total || 0}
            </div>
          </div>

          {/* Completed */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed || 0}
            </div>
          </div>

          {/* Pending */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <Clock size={16} />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pending || 0}
            </div>
          </div>

          {/* Missed */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border border-red-200">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">Missed</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.missed || 0}
            </div>
          </div>

          {/* Due Today */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Calendar size={16} />
              <span className="text-sm font-medium">Due Today</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.dueToday || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <TodoFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Todo List */}
      <div className="space-y-1">
        {todos.length === 0 ? (
          <div className="flex items-center justify-center py-1">
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-20 text-center shadow-sm">
              {/* Icon */}
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={40} className="text-slate-400" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                No Study Tasks Yet
              </h2>

              {/* Description */}
              <p className="text-slate-600 mb-10 max-w-sm mx-auto">
                Create your first learning task to start tracking your progress.
              </p>

              {/* Button */}
              <button
                onClick={handleAddTodo}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Add Your First Task
              </button>
            </div>
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
