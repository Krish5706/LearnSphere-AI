import api from './api';

/**
 * Security Note:
 * This service handles sensitive credential exchange. 
 * It ensures that tokens are stored in localStorage and that 
 * the AuthContext is notified of changes.
 */

const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user and store token
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Optional: Store non-sensitive user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout user and purge local storage
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user profile (used to verify token validity)
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      // If token is invalid or expired, clear storage
      localStorage.removeItem('token');
      throw error;
    }
  },

  // Check if user is logged in based on token presence
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  }
};

export default authService;