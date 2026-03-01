/**
 * Flashcards Page
 * 
 * Main page for Spaced Repetition System (SRS).
 * Provides deck management, study sessions, and AI card generation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import FlashcardDeck from '../components/flashcard/FlashcardDeck';
import StudySession from '../components/flashcard/StudySession';
import DeckManager from '../components/flashcard/DeckManager';
import {
    getDecks,
    getStudyStats,
    createFlashcard,
    deleteDeck,
    generateFlashcards
} from '../services/flashcardService';

// AI Generation Modal
const AIGenerationModal = ({ isOpen, onClose, onGenerate, documents }) => {
    const [selectedDoc, setSelectedDoc] = useState('');
    const [count, setCount] = useState(10);
    const [difficulty, setDifficulty] = useState('medium');
    const [deck, setDeck] = useState('AI Generated');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!selectedDoc) return;

        setIsGenerating(true);
        setResult(null);

        try {
            const response = await generateFlashcards({
                documentId: selectedDoc,
                count,
                difficulty,
                deck,
                autoSave: true
            });

            setResult({
                success: true,
                message: `Generated ${response.data.count} flashcards!`
            });

            setTimeout(() => {
                onGenerate();
                onClose();
            }, 1500);

        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to generate flashcards'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">
                        Generate Flashcards with AI
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Automatically create flashcards from your documents
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {/* Document selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Select Document *
                        </label>
                        <select
                            value={selectedDoc}
                            onChange={(e) => setSelectedDoc(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                            <option value="">Choose a document...</option>
                            {documents.map(doc => (
                                <option key={doc._id} value={doc._id}>
                                    {doc.fileName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Number of cards */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Number of Cards: {count}
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="30"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-medium mt-1">
                            <span>5</span>
                            <span>30</span>
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Difficulty Level
                        </label>
                        <div className="flex gap-2">
                            {['easy', 'medium', 'hard'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                    className={`flex-1 py-2.5 px-4 rounded-xl capitalize font-bold text-sm transition ${difficulty === level
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Deck name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Save to Deck
                        </label>
                        <input
                            type="text"
                            value={deck}
                            onChange={(e) => setDeck(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            placeholder="AI Generated"
                        />
                    </div>

                    {/* Result message */}
                    {result && (
                        <div className={`p-4 rounded-xl ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            <div className="flex items-center gap-2 font-medium">
                                {result.success ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                                {result.message}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!selectedDoc || isGenerating}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold shadow-md"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Generating...
                            </>
                        ) : (
                            <>Generate Cards</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Flashcards page
const Flashcards = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [decks, setDecks] = useState([]);
    const [stats, setStats] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State
    const [view, setView] = useState('decks'); // 'decks' | 'study' | 'manage'
    const [studyDeck, setStudyDeck] = useState(null);
    const [manageDeck, setManageDeck] = useState(null);
    const [showAIModal, setShowAIModal] = useState(false);

    // Parse URL to detect deck management route
    useEffect(() => {
        const pathMatch = location.pathname.match(/\/flashcards\/deck\/(.+)/);
        if (pathMatch) {
            const deckName = decodeURIComponent(pathMatch[1]);
            setManageDeck(deckName);
            setView('manage');
        } else if (location.pathname === '/flashcards') {
            setManageDeck(null);
            if (view === 'manage') {
                setView('decks');
            }
        }
    }, [location.pathname]);

    // Load data
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [decksRes, statsRes] = await Promise.all([
                getDecks(),
                getStudyStats()
            ]);

            if (decksRes.success) setDecks(decksRes.data);
            if (statsRes.success) setStats(statsRes.data);

            // Load documents for AI generation
            try {
                const response = await fetch('http://localhost:3000/api/documents', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const docsData = await response.json();
                // Handle both formats: array directly or {success, data} wrapper
                if (Array.isArray(docsData)) {
                    setDocuments(docsData);
                } else if (docsData.success) {
                    setDocuments(docsData.data || []);
                } else if (docsData.data) {
                    setDocuments(docsData.data);
                }
            } catch (docErr) {
                console.log('Could not load documents:', docErr);
            }

        } catch (err) {
            console.error('Error loading flashcard data:', err);
            setError('Failed to load flashcard data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStudy = (deckName) => {
        setStudyDeck(deckName);
        setView('study');
        setSearchParams({ mode: 'study', ...(deckName && { deck: deckName }) });
    };

    const handleCloseStudy = () => {
        setView('decks');
        setStudyDeck(null);
        setSearchParams({});
        navigate('/flashcards');
        loadData(); // Refresh data after study session
    };

    const handleManageDeck = (deckName) => {
        navigate(`/flashcards/deck/${encodeURIComponent(deckName)}`);
    };

    const handleCloseManage = () => {
        setManageDeck(null);
        setView('decks');
        navigate('/flashcards');
        loadData(); // Refresh data
    };

    const handleStudyFromManage = (deckName) => {
        setStudyDeck(deckName);
        setView('study');
        navigate('/flashcards?mode=study&deck=' + encodeURIComponent(deckName));
    };

    const handleCreateCard = async (cardData) => {
        // createFlashcard throws on axios error, returns response.data on success
        const result = await createFlashcard(cardData);
        loadData();
        return result;
    };

    const handleDeleteDeck = async (deckName) => {
        try {
            await deleteDeck(deckName);
            loadData();
        } catch (err) {
            console.error('Error deleting deck:', err);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading flashcards...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-16">
                <div className="text-4xl mb-4">❌</div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={loadData}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {view === 'study' ? (
                <StudySession
                    deck={studyDeck}
                    onClose={handleCloseStudy}
                />
            ) : view === 'manage' && manageDeck ? (
                <DeckManager
                    deckName={manageDeck}
                    onClose={handleCloseManage}
                    onStudy={handleStudyFromManage}
                />
            ) : (
                <>
                    {/* AI Generate button */}
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2 shadow-md"
                            aria-label="Generate with AI"
                        >
                            AI Generate
                        </button>
                    </div>

                    <FlashcardDeck
                        decks={decks}
                        stats={stats}
                        onStudy={handleStudy}
                        onManage={handleManageDeck}
                        onCreateCard={handleCreateCard}
                        onDeleteDeck={handleDeleteDeck}
                        onRefresh={loadData}
                    />

                    <AIGenerationModal
                        isOpen={showAIModal}
                        onClose={() => setShowAIModal(false)}
                        onGenerate={loadData}
                        documents={documents}
                    />
                </>
            )}
        </div>
    );
};

export default Flashcards;
