import api from './api';

/**
 * AI Service
 * Handles all logic related to Gemini AI interactions.
 */

const aiService = {
  // Trigger the AI analysis for a specific document stored in MongoDB
  analyzeDocument: async (documentId) => {
    try {
      const response = await api.post(`/api/ai/analyze/${documentId}`);
      return response.data; // Returns { summary, mindMap, quizzes }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      throw error;
    }
  },

  // Ask a follow-up question (ChatBox logic)
  askQuestion: async (documentId, question) => {
    try {
      const response = await api.post('/api/ai/chat', { documentId, question });
      return response.data.answer;
    } catch (error) {
      console.error("AI Chat Error:", error);
      throw new Error("I couldn't process that question right now.");
    }
  },

  // Re-generate a quiz specifically if the user wants a new one
  regenerateQuiz: async (documentId) => {
    const response = await api.post(`/api/ai/quiz/generate/${documentId}`);
    return response.data.quizzes;
  }
};

export default aiService;