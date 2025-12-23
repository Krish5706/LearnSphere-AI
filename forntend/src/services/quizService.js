import api from './api';

/**
 * Quiz Service
 * Manages quiz results and performance tracking.
 */
const quizService = {
  // Save a quiz result to the user's profile in MongoDB
  saveResult: async (docId, score, totalQuestions) => {
    try {
      const response = await api.post(`/api/quiz/results`, {
        documentId: docId,
        score,
        totalQuestions,
        completedAt: new Date()
      });
      return response.data;
    } catch (error) {
      console.error("Error saving quiz results:", error);
      throw error;
    }
  },

  // Retrieve past quiz performance for a specific document
  getQuizHistory: async (docId) => {
    const response = await api.get(`/api/quiz/history/${docId}`);
    return response.data;
  },

  // Fetch global stats for the Analytics component
  getUserStats: async () => {
    const response = await api.get('/api/users/stats');
    return response.data;
  }
};

export default quizService;