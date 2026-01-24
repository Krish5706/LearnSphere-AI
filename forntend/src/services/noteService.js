import api from './api';

const getNotes = (documentId, search) => {
  return api.get(`/documents/${documentId}/notes?search=${search}`);
};

const createNote = (documentId, noteData) => {
  return api.post(`/documents/${documentId}/notes`, noteData);
};

const updateNote = (noteId, noteData) => {
  return api.put(`/notes/${noteId}`, noteData);
};

const deleteNote = (noteId) => {
  return api.delete(`/notes/${noteId}`);
};

const noteService = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};

export default noteService;
