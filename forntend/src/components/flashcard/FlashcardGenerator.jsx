/**
 * FlashcardGenerator Component
 * 
 * Embeddable component for generating flashcards from a document.
 * Can be added to the Document page for quick flashcard generation.
 * Matching existing website UI: LearnSphere AI
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateFlashcards, generateFromKeyPoints } from '../../services/flashcardService';
import { Sparkles, Loader2 } from 'lucide-react';

const FlashcardGenerator = ({ documentId, documentName, hasKeyPoints = false }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [count, setCount] = useState(10);
    const [difficulty, setDifficulty] = useState('medium');
    const [deck, setDeck] = useState(documentName || 'AI Generated');
    const [result, setResult] = useState(null);

    const handleGenerateFromContent = async () => {
        setIsGenerating(true);
        setResult(null);
        
        try {
            const response = await generateFlashcards({
                documentId,
                count,
                difficulty,
                deck,
                autoSave: true,
                replaceExisting: true
            });
            
            const cardCount = response?.data?.count || response?.count || count;
            setResult({
                success: true,
                count: cardCount,
                message: `Generated ${cardCount} flashcards!`
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to generate flashcards'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateFromKeyPoints = async () => {
        setIsGenerating(true);
        setResult(null);
        
        try {
            const response = await generateFromKeyPoints(documentId, deck);
            
            setResult({
                success: true,
                count: response.data.count,
                message: `Generated ${response.data.count} flashcards from key points!`
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to generate flashcards'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGoToFlashcards = () => {
        navigate(`/flashcards/deck/${encodeURIComponent(deck)}`);
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Sparkles size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-slate-800">Generate Flashcards</div>
                            <div className="text-sm text-slate-500">Create study cards with AI</div>
                        </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </button>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Sparkles size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">Generate Flashcards</h3>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Options */}
            <div className="p-5 space-y-5">
                {/* Count slider */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Number of Cards: {count}
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="25"
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 font-medium mt-1">
                        <span>5</span>
                        <span>25</span>
                    </div>
                </div>

                {/* Difficulty */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Difficulty Level
                    </label>
                    <div className="flex gap-2">
                        {['easy', 'medium', 'hard'].map(level => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-sm capitalize font-semibold transition ${
                                    difficulty === level
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Save to Deck
                    </label>
                    <input
                        type="text"
                        value={deck}
                        onChange={(e) => setDeck(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                        placeholder="Deck name..."
                    />
                </div>

                {/* Result message */}
                {result && (
                    <div className={`p-4 rounded-xl ${
                        result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-medium text-sm">
                                {result.success ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                                {result.message}
                            </span>
                            {result.success && (
                                <button
                                    onClick={handleGoToFlashcards}
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition font-semibold"
                                >
                                    View Deck →
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2">
                <button
                    onClick={handleGenerateFromContent}
                    disabled={isGenerating}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin h-4 w-4" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Generate from Content
                        </>
                    )}
                </button>

                {hasKeyPoints && (
                    <button
                        onClick={handleGenerateFromKeyPoints}
                        disabled={isGenerating}
                        className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-sm"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin h-4 w-4" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                From Key Points
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default FlashcardGenerator;
