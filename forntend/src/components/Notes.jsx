import React, { useState, useEffect } from 'react';
import noteService from '../services/noteService';
import api from '../services/api'; // Import the api instance
import WordStyleEditor from './WordStyleEditor';
import './Editor.css';

const Notes = ({ documentId, token }) => {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [search, setSearch] = useState('');

    const fetchNotes = async () => {
    try {
      const response = await noteService.getNotes(documentId, search);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchNotes();
    }
  }, [documentId, search]);

  useEffect(() => {
    // Set the token for all API requests from this component
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

    const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      const response = await noteService.createNote(documentId, { title, content });
      setNotes([response.data, ...notes]);
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

    const handleUpdateNote = async (e) => {
    e.preventDefault();
    try {
      const response = await noteService.updateNote(editingNote._id, { title: editingNote.title, content: editingContent });
      setNotes(notes.map(note => (note._id === editingNote._id ? response.data : note)));
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

    const handleDeleteNote = async (noteId) => {
    try {
      await noteService.deleteNote(noteId);
      setNotes(notes.filter(note => note._id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

    const startEditing = (note) => {
    setEditingNote({ ...note });
    setEditingContent(note.content);
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">My Notes</h2>
      
      {/* Search Notes */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      {/* Create Note Form */}
      <form onSubmit={handleCreateNote} className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Add a New Note</h3>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <WordStyleEditor content={content} onChange={setContent} />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Add Note
        </button>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map(note => (
          <div key={note._id} className="bg-white p-4 rounded-lg shadow">
            {editingNote && editingNote._id === note._id ? (
              <form onSubmit={handleUpdateNote}>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded mb-2"
                />
                <WordStyleEditor content={editingContent} onChange={setEditingContent} />
                <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded mr-2">Save</button>
                <button onClick={() => setEditingNote(null)} className="bg-gray-500 text-white px-3 py-1 rounded">Cancel</button>
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-bold">{note.title}</h3>
                <p className="text-gray-500 text-sm mb-2">{new Date(note.createdAt).toLocaleDateString()}</p>
                <div className="prose" dangerouslySetInnerHTML={{ __html: note.content }} />
                <div className="mt-4">
                  <button onClick={() => startEditing(note)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Edit</button>
                  <button onClick={() => handleDeleteNote(note._id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notes;
