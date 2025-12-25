import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserDocuments, deleteDocument } from '../services/api';
import { FileText, Trash2, Calendar, LayoutGrid, List, Search, Loader2 } from 'lucide-react';

const Dashboard = () => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await getUserDocuments();
            setDocs(res.data);
        } catch (err) {
            console.error("Error fetching library:", err);
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
                    <h1 className="text-3xl font-bold text-slate-900">My Library</h1>
                    <p className="text-slate-500 mt-1">Manage your AI-analyzed documents</p>
                </div>

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
    );
};

export default Dashboard;