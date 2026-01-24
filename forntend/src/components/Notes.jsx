import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import noteService from '../services/noteService';
import api from '../services/api';
import WordStyleEditor from './WordStyleEditor';
import './Editor.css';

const Notes = ({ documentId, token }) => {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveAttempted, setIsSaveAttempted] = useState(false);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await noteService.getNotes(documentId, search);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
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
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }
    try {
      setIsLoading(true);
      const response = await noteService.createNote(documentId, { title, content });
      setNotes([response.data, ...notes]);
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    
    // Safety check: Only allow save if explicitly triggered by Save button
    if (!isSaveAttempted) {
      console.warn('⚠️ Save attempt without explicit button click - blocked');
      return;
    }
    
    if (!editingTitle.trim() || !editingContent.trim()) {
      alert('Please fill in both title and content');
      setIsSaveAttempted(false);
      return;
    }
    try {
      setIsLoading(true);
      // Update the note on the server
      const response = await noteService.updateNote(editingNote._id, { 
        title: editingTitle, 
        content: editingContent 
      });
      // Update the notes list with the saved response
      setNotes(notes.map(note => (note._id === editingNote._id ? response.data : note)));
      
      // Clear edit state ONLY after successful save
      setEditingNote(null);
      setEditingTitle('');
      setEditingContent('');
      setIsSaveAttempted(false);
      
      // No alert - silent save (banner message is shown instead)
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note. Please try again.');
      setIsSaveAttempted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        setIsLoading(true);
        await noteService.deleteNote(noteId);
        setNotes(notes.filter(note => note._id !== noteId));
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startEditing = (note) => {
    setEditingNote(note);
    setEditingTitle(note.title);
    setEditingContent(note.content);
    setIsSaveAttempted(false);
  };

  const cancelEditing = () => {
    // Don't save - just discard changes and exit edit mode
    setEditingNote(null);
    setEditingTitle('');
    setEditingContent('');
    setIsSaveAttempted(false);
  };

  const handleContentChange = (newContent) => {
    // Only update the local state, don't trigger any saves
    // Changes are ONLY saved when user explicitly clicks the Save button
    setEditingContent(newContent);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 mb-2">My Notes</h2>
        <p className="text-slate-500 font-medium">Create, edit, and organize your study notes</p>
      </div>

      {/* Create Note Section */}
      <form onSubmit={handleCreateNote} className="mb-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus size={22} className="text-blue-600" />
          Add New Note
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Note Title</label>
            <input
              type="text"
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
            <WordStyleEditor content={content} onChange={setContent} />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button 
              type="submit" 
              className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <Plus size={18} />
              Create Note
            </button>
          </div>
        </div>
      </form>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search notes by title or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      {/* Notes List */}
      {isLoading && notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 font-medium">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-slate-500 font-medium">No notes yet. Create your first note!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notes.map(note => (
            <div key={note._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
              {editingNote && editingNote._id === note._id ? (
                // Edit Mode
                <form onSubmit={handleUpdateNote} className="p-6 bg-blue-50 border-l-4 border-blue-600">
                  {/* Information Banner */}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Content</label>
                      <WordStyleEditor content={editingContent} onChange={handleContentChange} />
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t border-slate-200">
                      <button 
                        type="submit" 
                        onClick={() => setIsSaveAttempted(true)}
                        className="flex items-center gap-2 bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                      >
                        <Check size={16} />
                        Save
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsSaveAttempted(false);
                          cancelEditing();
                        }}
                        className="flex items-center gap-2 bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-lg hover:bg-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                // View Mode
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-800">{note.title}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {new Date(note.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="prose prose-sm max-w-none text-slate-700 mb-4 bg-slate-50 rounded-lg p-4">
                    <div dangerouslySetInnerHTML={{ __html: note.content }} />
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <button 
                      onClick={() => startEditing(note)} 
                      className="flex items-center gap-2 bg-blue-100 text-blue-600 font-bold px-4 py-2 rounded-lg hover:bg-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteNote(note._id)} 
                      className="flex items-center gap-2 bg-red-100 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notes;
