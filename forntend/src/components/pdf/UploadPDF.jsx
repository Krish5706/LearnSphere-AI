import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, FileText, Sparkles, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const UploadPDF = () => {
    const { user, canUseAI } = useAuth();
    const navigate = useNavigate();
    
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError('');
        } else {
            setError('Please select a valid PDF file.');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !canUseAI) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const res = await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // On success, redirect to the new document workspace
            navigate(`/document/${res.data._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Credit Info Bar */}
            <div className="mb-8 p-5 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md">
                        <Sparkles size={20}/>
                    </div>
                    <div>
                        <p className="text-sm font-black text-blue-900 uppercase tracking-tight">
                            {user?.isSubscribed ? "Pro Plan Active" : "Free Tier Usage"}
                        </p>
                        <p className="text-xs text-blue-700 font-bold">
                            {user?.isSubscribed ? "Unlimited Access" : `${user?.credits || 0} AI Credits Remaining`}
                        </p>
                    </div>
                </div>
                {!user?.isSubscribed && (
                    <Link to="/pricing" className="px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100">
                        Upgrade
                    </Link>
                )}
            </div>

            {/* Upload Box */}
            <div className="bg-white p-10 rounded-[2rem] border-2 border-dashed border-slate-200 shadow-xl shadow-slate-100 text-center">
                {!file ? (
                    <label className="cursor-pointer group">
                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                        <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                            <Upload size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2">Upload your PDF</h2>
                        <p className="text-slate-500 text-sm mb-6">Gemini will analyze, summarize, and create a mind map for you.</p>
                        <span className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform inline-block">
                            Select File
                        </span>
                    </label>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
                            <div className="flex items-center gap-3">
                                <FileText className="text-blue-600" />
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{file.name}</p>
                                    <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button onClick={() => setFile(null)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-xs font-bold">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <button 
                            onClick={handleUpload}
                            disabled={isUploading || !canUseAI}
                            className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
                                canUseAI 
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Analyzing Context...
                                </>
                            ) : canUseAI ? (
                                'Process with Gemini'
                            ) : (
                                'Credits Exhausted'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadPDF;