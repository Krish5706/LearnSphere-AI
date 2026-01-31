import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Trash2, Save, 
  FileText, Clock, ChevronRight,
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, 
  Quote, Code, Undo, Redo,
  Palette, Highlighter
} from 'lucide-react';
import api from '../services/api';
import WordStyleEditor from './WordStyleEditor';

const Notes = ({ documentId, token }) => {
  // State
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    try {
      // Ensure token is set if passed
      if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const res = await api.get(`/documents/${documentId}/notes?search=${searchQuery}`);
      setNotes(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch notes", err);
      setLoading(false);
    }
  }, [documentId, searchQuery, token]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Handlers
  const handleCreateNew = () => {
    const newNote = { _id: 'new', title: '', content: '' };
    setActiveNote(newNote);
    setFormData({ title: '', content: '' });
  };

  const handleSelectNote = (note) => {
    setActiveNote(note);
    setFormData({ title: note.title, content: note.content });
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    setSaveStatus('saving');
    try {
      if (activeNote._id === 'new') {
        const res = await api.post(`/documents/${documentId}/notes`, formData);
        setNotes([res.data, ...notes]);
      } else {
        const res = await api.put(`/notes/${activeNote._id}`, formData);
        setNotes(notes.map(n => n._id === activeNote._id ? res.data : n));
      }
      setSaveStatus('saved');
      setActiveNote(null);
      setFormData({ title: '', content: '' });
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Save failed", err);
      setSaveStatus('error');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this note?")) return;
    
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(n => n._id !== id));
      if (activeNote?._id === id) {
        setActiveNote(null);
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Toolbar Helper
  const ToolbarBtn = ({ onClick, isActive, icon: Icon, title }) => (
    <button 
      onClick={onClick} 
      className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
      title={title}
    >
      <Icon size={16} />
    </button>
  );

  const ToolbarSelect = ({ value, onChange, options, width = "w-24" }) => (
    <select
      value={value}
      onChange={onChange}
      className={`h-8 ${width} text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-500 px-1 cursor-pointer hover:border-blue-300 transition-colors`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  return (
    <div className="h-[600px] bg-white rounded-3xl border border-slate-200 shadow-lg flex overflow-hidden animate-in fade-in duration-500">
      {/* LEFT SIDEBAR - LIST */}
      <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <FileText size={20} className="text-blue-600" />
              My Notes
            </h3>
            <button 
              onClick={handleCreateNew}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
              title="New Note"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm transition-all outline-none border"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FileText size={24} />
              </div>
              <p className="text-slate-500 text-sm font-medium">No notes yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first note to get started</p>
            </div>
          ) : (
            notes.map(note => (
              <div 
                key={note._id}
                onClick={() => handleSelectNote(note)}
                className={`group p-4 rounded-xl cursor-pointer transition-all border relative ${
                  activeNote?._id === note._id 
                    ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-100' 
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-bold text-sm line-clamp-1 pr-6 ${activeNote?._id === note._id ? 'text-blue-700' : 'text-slate-700'}`}>
                    {note.title || 'Untitled Note'}
                  </h4>
                  <button 
                    onClick={(e) => handleDelete(e, note._id)}
                    className="absolute top-4 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 font-medium mb-3 h-8">
                  {note.content ? note.content.replace(/<[^>]*>?/gm, '') : 'No content'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock size={10} />
                    <span>{new Date(note.updatedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  {activeNote?._id === note._id && (
                    <ChevronRight size={14} className="text-blue-500" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT MAIN - EDITOR */}
      <div className="flex-1 flex flex-col bg-white h-full relative">
        {activeNote ? (
          <>
            {/* 1. Header: Title & Save */}
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 z-20">
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Note Title"
                className="text-lg font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent flex-1 mr-4"
              />
              
              <button 
                onClick={handleSave}
                disabled={saveStatus === 'saving' || (!formData.title && !formData.content)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  saveStatus === 'saved' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <span className="animate-pulse">Saving...</span>
                ) : saveStatus === 'saved' ? (
                  <>Saved</>
                ) : (
                  <>
                    <Save size={16} /> Save
                  </>
                )}
              </button>
            </div>

            {/* 2. Toolbar Row (Fixed Position) */}
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 flex items-center gap-2 shrink-0 z-10 overflow-x-auto custom-scrollbar">
              
              {/* Font Controls */}
              <div className="flex items-center gap-2 px-1">
                 <ToolbarSelect 
                    value={editor?.getAttributes('textStyle').fontFamily || 'Inter'} 
                    onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
                    width="w-32"
                    options={[
                      { value: 'Inter', label: 'Inter' },
                      { value: 'Arial', label: 'Arial' },
                      { value: 'Helvetica', label: 'Helvetica' },
                      { value: 'Times New Roman', label: 'Times' },
                      { value: 'Georgia', label: 'Georgia' },
                      { value: 'Garamond', label: 'Garamond' },
                      { value: 'Courier New', label: 'Courier' },
                      { value: 'Verdana', label: 'Verdana' },
                      { value: 'Trebuchet MS', label: 'Trebuchet' },
                      { value: 'Comic Sans MS', label: 'Comic Sans' },
                      { value: 'Impact', label: 'Impact' },
                      { value: 'Monaco', label: 'Monaco' }
                    ]}
                  />
                  <ToolbarSelect 
                    value={editor?.getAttributes('textStyle').fontSize || '16px'} 
                    onChange={(e) => editor?.chain().focus().setFontSize(e.target.value).run()}
                    width="w-16"
                    options={[
                      { value: '12px', label: '12' },
                      { value: '14px', label: '14' },
                      { value: '16px', label: '16' },
                      { value: '18px', label: '18' },
                      { value: '20px', label: '20' },
                      { value: '24px', label: '24' },
                      { value: '30px', label: '30' },
                      { value: '36px', label: '36' },
                      { value: '48px', label: '48' },
                      { value: '60px', label: '60' },
                      { value: '72px', label: '72' },
                    ]}
                  />
                  
                  {/* Color Pickers */}
                  <div className="flex items-center gap-1">
                     <div className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-200 cursor-pointer" title="Text Color">
                        <Palette size={16} className="text-slate-600 pointer-events-none" />
                        <input 
                          type="color" 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onInput={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                          value={editor?.getAttributes('textStyle').color || '#000000'}
                        />
                     </div>
                     <div className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-200 cursor-pointer" title="Highlight Color">
                        <Highlighter size={16} className="text-slate-600 pointer-events-none" />
                        <input 
                          type="color" 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onInput={(e) => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                          value={editor?.getAttributes('highlight')?.color || '#ffff00'}
                        />
                     </div>
                  </div>
              </div>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <div className="flex items-center gap-0.5 px-1">
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive('bold')} icon={Bold} title="Bold" />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive('italic')} icon={Italic} title="Italic" />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} isActive={editor?.isActive('underline')} icon={Underline} title="Underline" />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleStrike().run()} isActive={editor?.isActive('strike')} icon={Strikethrough} title="Strikethrough" />
              </div>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <div className="flex items-center gap-0.5 px-1">
                <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign('left').run()} isActive={editor?.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Align Left" />
                <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign('center').run()} isActive={editor?.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Align Center" />
                <ToolbarBtn onClick={() => editor?.chain().focus().setTextAlign('right').run()} isActive={editor?.isActive({ textAlign: 'right' })} icon={AlignRight} title="Align Right" />
              </div>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <div className="flex items-center gap-2 px-1">
                 <ToolbarSelect 
                    value={editor?.getAttributes('paragraph').lineHeight || editor?.getAttributes('heading').lineHeight || '1.0'} 
                    onChange={(e) => editor?.chain().focus().setLineHeight(e.target.value).run()}
                    width="w-16"
                    options={[
                      { value: '1.0', label: '1.0' },
                      { value: '1.5', label: '1.5' },
                      { value: '2.0', label: '2.0' },
                      { value: '2.5', label: '2.5' },
                      { value: '3.0', label: '3.0' },
                    ]}
                  />
              </div>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <div className="flex items-center gap-0.5 px-1">
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive('bulletList')} icon={List} title="Bullet List" />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={editor?.isActive('orderedList')} icon={ListOrdered} title="Ordered List" />
              </div>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <div className="flex items-center gap-0.5 px-1">
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={editor?.isActive('blockquote')} icon={Quote} title="Quote" />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleCodeBlock().run()} isActive={editor?.isActive('codeBlock')} icon={Code} title="Code Block" />
              </div>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <div className="flex items-center gap-0.5 px-1 mr-2 ml-auto">
                <ToolbarBtn onClick={() => editor?.chain().focus().undo().run()} icon={Undo} title="Undo" />
                <ToolbarBtn onClick={() => editor?.chain().focus().redo().run()} icon={Redo} title="Redo" />
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto flex flex-col relative bg-white">
              <WordStyleEditor 
                content={formData.content} 
                onChange={(newContent) => setFormData({...formData, content: newContent})} 
                onEditorReady={setEditor}
                hideToolbar={true}
              />
            </div>
            
            {/* Footer Status */}
            <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between font-medium uppercase tracking-wider">
              <span>Rich Text Editor</span>
              <span>{formData.content.length} characters</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 bg-slate-50/50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <FileText size={48} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Select a note to view</h3>
            <p className="text-slate-400 max-w-xs text-center text-sm">
              Choose a note from the sidebar or create a new one to start writing.
            </p>
            <button 
              onClick={handleCreateNew}
              className="mt-8 flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={18} /> Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
