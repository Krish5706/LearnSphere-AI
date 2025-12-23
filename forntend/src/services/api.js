import axios from 'axios';

/**
 * Security Note:
 * Using an Axios instance allows us to centralize security headers.
 * In a production environment, you would use an environment variable (import.meta.env.VITE_API_URL).
 */
const api = axios.create({
    baseURL: 'http://localhost:3000', // Matches your Backend port
    timeout: 30000, // 30 seconds timeout to prevent hanging requests
});

// Interceptor for security: Attach JWT tokens to every request once Auth is implemented
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * API Methods
 */

// PDF Uploading (uses Multipart/Form-Data)
export const uploadPDF = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
        headers: { 
            'Content-Type': 'multipart/form-data' 
        }
    });
};

// Document Management
export const getDocuments = () => api.get('/api/documents');
export const getDocumentById = (id) => api.get(`/api/documents/${id}`);
export const deleteDocument = (id) => api.delete(`/api/documents/${id}`);

export default api;