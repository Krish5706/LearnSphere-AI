import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserDocuments, deleteDocument } from '../services/api';
import { getTodoStats, getTodos } from '../services/todoService';
import { FileText, Trash2, Calendar, LayoutGrid, List, Search, Loader2, CheckCircle2, Clock, AlertCircle, BookMarked } from 'lucide-react';

const Dashboard = () => {
    const [docs, setDocs] = useState([]);
    const [todos, setTodos] = useState([]);
    const [todoStats, setTodoStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const resDoc = await getUserDocuments();
            setDocs(resDoc.data);
            
            // Try to fetch todos, but don't fail if it errors
            try {
                const resTodos = await getTodos({ status: 'pending', sortBy: 'dueDate', sortOrder: 'asc' });
                setTodos(resTodos.data.slice(0, 5));
            } catch (todoErr) {
                console.warn("Could not load todos:", todoErr);
                setTodos([]);
            }
            
            try {
                const resStats = await getTodoStats();
                setTodoStats(resStats.data);
            } catch (statsErr) {
                console.warn("Could not load todo stats:", statsErr);
                setTodoStats(null);
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setDocs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this document from your library?")) {
            try {
                await deleteDocument(id);
                setDocs(docs.filter(doc => doc._id !== id));
            } catch (err) {
                alert("Failed to delete document.");
            }
        }
    };

    const filteredDocs = docs.filter(doc => 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-500 font-medium">Accessing your secure library...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Your learning hub at a glance</p>
                </div>
            </div>

            {/* Study Progress Cards */}
            {todoStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-blue-700">Tasks Due Today</h3>
                            <Clock size={20} className="text-blue-600" />
                        </div>
                        <p className="text-3xl font-black text-blue-900">{todoStats.dueToday}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-purple-700">Pending Tasks</h3>
                            <AlertCircle size={20} className="text-purple-600" />
                        </div>
                        <p className="text-3xl font-black text-purple-900">{todoStats.pending}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-green-700">Completed Tasks</h3>
                            <CheckCircle2 size={20} className="text-green-600" />
                        </div>
                        <p className="text-3xl font-black text-green-900">{todoStats.completed}</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-orange-700">Completion Rate</h3>
                            <BookMarked size={20} className="text-orange-600" />
                        </div>
                        <p className="text-3xl font-black text-orange-900">{todoStats.completionRate}%</p>
                    </div>
                </div>
            )}

            {/* Upcoming Tasks Section */}
            {todos.length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Upcoming Study Tasks</h2>
                        <Link to="/todos" className="text-blue-600 font-bold text-sm hover:underline">
                            View All →
                        </Link>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {todos.map((todo) => (
                            <div key={todo._id} className="border-b border-slate-100 last:border-b-0 p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <div className={`w-3 h-3 rounded-full ${
                                            todo.priority === 'high' ? 'bg-red-500' :
                                            todo.priority === 'medium' ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`} />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-slate-800">{todo.title}</h3>
                                        {todo.description && (
                                            <p className="text-sm text-slate-500 mt-1">{todo.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(todo.dueDate).toLocaleDateString()}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded-full capitalize font-bold">
                                                {todo.priority}
                                            </span>
                                            {todo.linkedEntity && todo.linkedEntity.entityId && (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold truncate max-w-xs" title={todo.linkedEntity.entityName || todo.linkedEntity.type}>
                                                    {todo.linkedEntity.entityName || todo.linkedEntity.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Documents Section */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-800">My Documents</h2>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search documents..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {filteredDocs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 text-lg">No documents found matching your search.</p>
                        <Link to="/upload" className="text-blue-600 font-bold mt-4 inline-block hover:underline">
                            Upload your first PDF →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocs.map((doc) => (
                            <div key={doc._id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                                <div className="p-6 flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                            <FileText size={24} />
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(doc._id)}
                                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-2" title={doc.fileName}>
                                        {doc.fileName}
                                    </h3>
                                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} /> 
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded uppercase">
                                            {doc.pageCount || 0} Pages
                                        </span>
                                    </div>
                                </div>
                                <Link 
                                    to={`/document/${doc._id}`}
                                    className="w-full py-4 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-600 font-bold text-center transition-all border-t border-slate-100 group-hover:border-blue-600"
                                >
                                    View Analysis
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;