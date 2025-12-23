import api from './api';

/**
 * PDF Service
 * Handles file-specific operations and secure downloads.
 */
const pdfService = {
  // Fetch metadata for a specific PDF from MongoDB
  getMetadata: async (docId) => {
    const response = await api.get(`/api/documents/${docId}/metadata`);
    return response.data;
  },

  // Securely download the PDF file
  downloadPDF: async (docId, fileName) => {
    try {
      const response = await api.get(`/api/documents/${docId}/download`, {
        responseType: 'blob', // Important for handling binary data
      });

      // Create a secure Blob URL
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document.pdf');
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup: Revoke the object URL to free up memory/security
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw new Error("Could not download the file securely.");
    }
  }
};

export default pdfService;