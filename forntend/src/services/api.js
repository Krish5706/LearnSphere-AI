import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
});

// Interceptor to add token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Document Services
export const getUserDocuments = () => api.get('/documents');
export const getDocumentById = (id) => api.get(`/documents/${id}`);
export const uploadDocument = (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

// Processing Services
export const processPDF = (documentId, processingType) => 
    api.post('/documents/process', { documentId, processingType });

// Quiz Services
export const submitQuizAnswers = (documentId, answers) => 
    api.post('/documents/submit-quiz', { documentId, answers });

export const getQuizData = (documentId) =>
    api.get(`/documents/${documentId}/quiz`);


export default api;