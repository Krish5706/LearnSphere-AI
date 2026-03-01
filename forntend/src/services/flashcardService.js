/**
 * Flashcard Service
 * 
 * Frontend API service for Spaced Repetition System (SRS)
 * Handles all flashcard-related API calls
 */

import api from './api';

// ==============================================
// FLASHCARD CRUD
// ==============================================

/**
 * Create a new flashcard
 */
export const createFlashcard = async (flashcardData) => {
    const response = await api.post('/flashcards', flashcardData);
    return response.data;
};

/**
 * Create multiple flashcards at once
 */
export const createBulkFlashcards = async (flashcards, deck, documentId) => {
    const response = await api.post('/flashcards/bulk', {
        flashcards,
        deck,
        documentId
    });
    return response.data;
};

/**
 * Get all flashcards with optional filters
 */
export const getFlashcards = async (params = {}) => {
    const response = await api.get('/flashcards', { params });
    return response.data;
};

/**
 * Get a single flashcard by ID
 */
export const getFlashcard = async (cardId) => {
    const response = await api.get(`/flashcards/${cardId}`);
    return response.data;
};

/**
 * Update a flashcard
 */
export const updateFlashcard = async (cardId, updates) => {
    const response = await api.put(`/flashcards/${cardId}`, updates);
    return response.data;
};

/**
 * Delete a flashcard
 */
export const deleteFlashcard = async (cardId) => {
    const response = await api.delete(`/flashcards/${cardId}`);
    return response.data;
};

// ==============================================
// AI GENERATION
// ==============================================

/**
 * Generate flashcards from document using AI
 */
export const generateFlashcards = async (options) => {
    const response = await api.post('/flashcards/generate', options);
    return response.data;
};

/**
 * Generate flashcards from document key points
 */
export const generateFromKeyPoints = async (documentId, deck) => {
    const response = await api.post('/flashcards/generate-from-keypoints', {
        documentId,
        deck
    });
    return response.data;
};

// ==============================================
// DECK MANAGEMENT
// ==============================================

/**
 * Get all decks with card counts
 */
export const getDecks = async () => {
    const response = await api.get('/flashcards/decks/list');
    return response.data;
};

/**
 * Delete all cards in a deck
 */
export const deleteDeck = async (deckName) => {
    const response = await api.delete(`/flashcards/deck/${encodeURIComponent(deckName)}`);
    return response.data;
};

/**
 * Rename a deck
 */
export const renameDeck = async (deckName, newName) => {
    const response = await api.patch(`/flashcards/deck/${encodeURIComponent(deckName)}/rename`, {
        newName
    });
    return response.data;
};

// ==============================================
// STUDY SESSION & SRS
// ==============================================

/**
 * Get cards due for review
 */
export const getDueCards = async (params = {}) => {
    const response = await api.get('/flashcards/study/due', { params });
    return response.data;
};

/**
 * Submit a review for a flashcard
 * 
 * Quality ratings:
 * 0 ("Again") - Complete blackout
 * 2 ("Hard")  - Difficult recall
 * 3 ("Good")  - Correct with effort
 * 5 ("Easy")  - Perfect instant recall
 */
export const submitReview = async (cardId, quality, responseTime = 0) => {
    const response = await api.post(`/flashcards/${cardId}/review`, {
        quality,
        responseTime
    });
    return response.data;
};

/**
 * Submit multiple reviews at once (for offline sync)
 */
export const submitBatchReviews = async (reviews) => {
    const response = await api.post('/flashcards/reviews/batch', { reviews });
    return response.data;
};

/**
 * Evaluate user's answer using AI
 * Handles typos, grammar mistakes, different wording
 */
export const evaluateAnswer = async (userAnswer, correctAnswer, question) => {
    const response = await api.post('/flashcards/evaluate-answer', {
        userAnswer,
        correctAnswer,
        question
    });
    return response.data;
};

// ==============================================
// STATISTICS
// ==============================================

/**
 * Get comprehensive study statistics
 */
export const getStudyStats = async (params = {}) => {
    const response = await api.get('/flashcards/stats/overview', { params });
    return response.data;
};

/**
 * Get review forecast for upcoming days
 */
export const getReviewForecast = async (days = 14) => {
    const response = await api.get('/flashcards/stats/forecast', {
        params: { days }
    });
    return response.data;
};

// ==============================================
// CARD MANAGEMENT
// ==============================================

/**
 * Archive or unarchive a flashcard
 */
export const toggleArchive = async (cardId, archive = true) => {
    const response = await api.patch(`/flashcards/${cardId}/archive`, { archive });
    return response.data;
};

/**
 * Suspend or unsuspend a flashcard
 */
export const toggleSuspend = async (cardId, suspend = true) => {
    const response = await api.patch(`/flashcards/${cardId}/suspend`, { suspend });
    return response.data;
};

/**
 * Reset flashcard progress
 */
export const resetFlashcard = async (cardId) => {
    const response = await api.post(`/flashcards/${cardId}/reset`);
    return response.data;
};

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Quality rating options for UI
 */
export const QUALITY_OPTIONS = [
    { 
        value: 0, 
        label: 'Again', 
        color: 'red',
        description: 'Complete blackout, could not recall',
        shortcut: '1'
    },
    { 
        value: 2, 
        label: 'Hard', 
        color: 'orange',
        description: 'Incorrect or very difficult recall',
        shortcut: '2'
    },
    { 
        value: 3, 
        label: 'Good', 
        color: 'green',
        description: 'Correct response after thinking',
        shortcut: '3'
    },
    { 
        value: 5, 
        label: 'Easy', 
        color: 'blue',
        description: 'Perfect, instant recall',
        shortcut: '4'
    }
];

/**
 * Get next interval preview for display
 */
export const getIntervalPreview = (card, quality) => {
    // Simplified preview calculation
    const currentInterval = card.interval || 0;
    const easeFactor = card.easeFactor || 2.5;
    
    switch (quality) {
        case 0: // Again
            return '< 1 day';
        case 2: // Hard
            return currentInterval <= 1 ? '1 day' : `${Math.max(1, Math.round(currentInterval * 0.8))} days`;
        case 3: // Good
            if (currentInterval === 0) return '1 day';
            if (currentInterval === 1) return '6 days';
            return `${Math.round(currentInterval * easeFactor)} days`;
        case 5: // Easy
            if (currentInterval === 0) return '4 days';
            return `${Math.round(currentInterval * easeFactor * 1.3)} days`;
        default:
            return 'Unknown';
    }
};

/**
 * Format interval for display
 */
export const formatInterval = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''}`;
    }
    if (days < 365) {
        const months = Math.floor(days / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
    }
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
};

/**
 * Get maturity color
 */
export const getMaturityColor = (maturityLevel) => {
    const colors = {
        'new': 'bg-blue-500',
        'young': 'bg-green-500',
        'mature': 'bg-purple-500',
        'mastered': 'bg-yellow-500'
    };
    return colors[maturityLevel] || 'bg-gray-500';
};

/**
 * Get status badge style
 */
export const getStatusBadgeStyle = (status) => {
    const styles = {
        'new': 'bg-blue-100 text-blue-800',
        'learning': 'bg-yellow-100 text-yellow-800',
        'review': 'bg-green-100 text-green-800',
        'relearning': 'bg-orange-100 text-orange-800',
        'graduated': 'bg-purple-100 text-purple-800',
        'suspended': 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
};

export default {
    createFlashcard,
    createBulkFlashcards,
    getFlashcards,
    getFlashcard,
    updateFlashcard,
    deleteFlashcard,
    generateFlashcards,
    generateFromKeyPoints,
    getDecks,
    deleteDeck,
    renameDeck,
    getDueCards,
    submitReview,
    submitBatchReviews,
    getStudyStats,
    getReviewForecast,
    toggleArchive,
    toggleSuspend,
    resetFlashcard,
    QUALITY_OPTIONS,
    getIntervalPreview,
    formatInterval,
    getMaturityColor,
    getStatusBadgeStyle
};
