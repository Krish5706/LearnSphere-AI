import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getDocumentById } from '../services/api';
import ShortSummary from '../components/summary/ShortSummary';
import MediumSummary from '../components/summary/MediumSummary';
import DetailedSummary from '../components/summary/DetailedSummary';
import QuizListNew from '../components/quiz/QuizListNew';
import Notes from '../components/Notes';
import Roadmap from '../components/Roadmap';
import EnhancedRoadmap from '../components/EnhancedRoadmap';
import { FileText, BrainCircuit, GraduationCap, Loader2, ChevronLeft, Lock, Sparkles, BarChart3, BookText, Map } from 'lucide-react';

const Document = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, canUseAI } = useAuth(); // Get credit status from Auth
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('summary');
    const [summaryType, setSummaryType] = useState('short');

    const handleDownloadReport = async (reportType) => {
        try {
            const response = await api.post('/documents/report/generate', {
                documentId: id,
                reportType: reportType || 'comprehensive'
            }, {
                responseType: 'blob'
            });

            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Get filename from response headers
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'report.pdf';
            if (contentDisposition) {
                const matches = contentDisposition.match(/filename="([^"]+)"/);
                if (matches && matches[1]) {
                    filename = matches[1];
                }
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const res = await getDocumentById(id);
                setDoc(res.data);
            } catch (err) {
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDoc();
    }, [id, navigate]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

    // Logic: If user has 0 credits and isn't pro, they are restricted
    const isRestricted = !canUseAI;

    return (
        <div className="min-h-screen bg-white">
            {/* Sub-Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 line-clamp-1">{doc.fileName}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Analysis Ready</span>
                            {isRestricted && <span className="text-[10px] text-amber-600 font-bold uppercase bg-amber-50 px-2 py-0.5 rounded">Free Preview</span>}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-200 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('summary')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-white text-blue-600' : 'text-slate-600'}`}>
                        <FileText size={16} /> Summary
                    </button>
                    <button onClick={() => setActiveTab('roadmap')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'roadmap' ? 'bg-white text-blue-600' : 'text-slate-600'}`}>
                        <Map size={16} /> Roadmap
                    </button>
                    <button onClick={() => setActiveTab('quiz')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'quiz' ? 'bg-white text-blue-600' : 'text-slate-600'}`}>
                        <GraduationCap size={16} /> Quiz {isRestricted && <Lock size={12} />}
                    </button>
                    <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-white text-blue-600' : 'text-slate-600'}`}>
                        <BookText size={16} /> Notes
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8 max-w-7xl mx-auto">
                {activeTab === 'roadmap' && (
                    <>
                        {doc.enhancedRoadmap ? (
                            <EnhancedRoadmap
                                enhancedRoadmap={doc.enhancedRoadmap}
                                fileName={doc.fileName}
                                learnerLevel={doc.learnerLevel}
                                documentId={id}
                                onNavigateToTab={setActiveTab}
                                onProgressUpdate={(progress) => {
                                    console.log('Progress updated:', progress);
                                    // Optional: Update local state if needed
                                }}
                            />
                        ) : (
                            <Roadmap
                                roadmap={doc.roadmap}
                                fileName={doc.fileName}
                                learnerLevel={doc.learnerLevel}
                                onNavigateToTab={setActiveTab}
                            />
                        )}
                    </>
                )}

                {activeTab === 'summary' && (
                    <div className="space-y-6">
                        {/* Summary Type Selector */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4">Choose Summary Length</h3>
                                <div className="flex bg-slate-100 p-1 rounded-xl max-w-md">
                                    <button
                                        onClick={() => setSummaryType('short')}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${summaryType === 'short'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        Short
                                    </button>
                                    <button
                                        onClick={() => setSummaryType('medium')}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${summaryType === 'medium'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        Medium
                                    </button>
                                    <button
                                        onClick={() => setSummaryType('detailed')}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${summaryType === 'detailed'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        Detailed
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Content */}
                        {summaryType === 'short' && (
                            <ShortSummary
                                text={doc.summary?.short || 'Short summary not available'}
                                fileName={doc.fileName}
                                onDownloadReport={handleDownloadReport}
                            />
                        )}
                        {summaryType === 'medium' && (
                            <MediumSummary
                                content={doc.summary?.medium || 'Medium summary not available'}
                                keyInsights={doc.keyPoints || []}
                                fileName={doc.fileName}
                                onDownloadReport={handleDownloadReport}
                            />
                        )}
                        {summaryType === 'detailed' && (
                            <DetailedSummary
                                content={doc.summary?.detailed || 'Detailed summary not available'}
                                fileName={doc.fileName}
                                keyInsights={doc.keyPoints || []}
                                onDownloadReport={handleDownloadReport}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <Notes documentId={id} token={localStorage.getItem('token')} />
                )}

                {activeTab === 'quiz' && (
                    <div className="relative">
                        {/* THE PAYWALL OVERLAY - Only for Quiz */}
                        {isRestricted && (
                            <div className="absolute inset-0 z-50 flex items-start justify-center bg-white/60 backdrop-blur-md rounded-3xl border-2 border-dashed border-slate-200 pt-24">
                                <div className="text-center p-8 bg-white shadow-2xl rounded-3xl max-w-md border border-slate-100">
                                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles size={32} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                                        Unlock Pro Analysis
                                    </h2>
                                    <p className="text-slate-500 mb-6 text-sm">
                                        You've used your 5 free credits. Subscribe now to unlock Quizzes and Unlimited PDF processing.
                                    </p>
                                    <Link
                                        to="/pricing"
                                        className="block w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                                    >
                                        Upgrade to Pro
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Actual Content (Blurred if restricted) */}
                        <div className={isRestricted ? "blur-lg grayscale pointer-events-none select-none" : ""}>
                            <QuizListNew
                                quizzes={doc.quizzes}
                                documentId={doc._id}
                                onDownloadReport={handleDownloadReport}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Document;