import api from './api';

/**
 * Roadmap Service - Handles all roadmap-related API calls
 */

export const roadmapService = {
    /**
     * Update roadmap progress when user completes a lesson
     */
    updateProgress: async (documentId, { lessonId, phaseId, moduleId }) => {
        try {
            const response = await api.put(`/documents/${documentId}/roadmap/progress`, {
                lessonId,
                phaseId,
                moduleId
            });
            return response.data;
        } catch (error) {
            console.error('Error updating progress:', error);
            throw error;
        }
    },

    /**
     * Get roadmap topics and dependencies
     */
    getTopics: async (documentId) => {
        try {
            const response = await api.get(`/documents/${documentId}/roadmap/topics`);
            return response.data;
        } catch (error) {
            console.error('Error fetching topics:', error);
            throw error;
        }
    },

    /**
     * Export roadmap as markdown or pdf
     */
    exportRoadmap: async (documentId, format = 'markdown') => {
        try {
            const response = await api.get(`/documents/${documentId}/roadmap/export`, {
                params: { format },
                responseType: format === 'pdf' ? 'blob' : 'json'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting roadmap:', error);
            throw error;
        }
    },

    /**
     * Download roadmap as file
     */
    downloadRoadmap: async (documentId, fileName, format = 'markdown') => {
        try {
            const response = await api.get(`/documents/${documentId}/roadmap/export`, {
                params: { format },
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { 
                type: format === 'pdf' ? 'application/pdf' : 'text/markdown' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}-roadmap.${format === 'pdf' ? 'pdf' : 'md'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading roadmap:', error);
            throw error;
        }
    }
};

export default roadmapService;
