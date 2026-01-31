import api from './api';

// Create a new todo
export const createTodo = async (todoData) => {
    try {
        const response = await api.post('/todos', todoData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get all todos with filters
export const getTodos = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

        const response = await api.get(`/todos?${params.toString()}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Get todo statistics
export const getTodoStats = async () => {
    try {
        const response = await api.get('/todos/stats');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Update a todo
export const updateTodo = async (id, todoData) => {
    try {
        const response = await api.put(`/todos/${id}`, todoData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Mark todo as completed
export const markTodoComplete = async (id) => {
    try {
        const response = await api.patch(`/todos/${id}/done`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Delete a todo
export const deleteTodo = async (id) => {
    try {
        const response = await api.delete(`/todos/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
