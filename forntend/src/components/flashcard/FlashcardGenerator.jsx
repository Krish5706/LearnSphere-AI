/**
 * FlashcardGenerator Component
 * 
 * Embeddable component for generating flashcards from a document.
 * Can be added to the Document page for quick flashcard generation.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateFlashcards, generateFromKeyPoints } from '../../services/flashcardService';

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
                replaceExisting: true // Replace existing cards in this deck
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
        // Navigate directly to the deck to show generated cards
        navigate(`/flashcards/deck/${encodeURIComponent(deck)}`);
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl hover:from-purple-100 hover:to-blue-100 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎴</span>
                        <div className="text-left">
                            <div className="font-medium text-gray-800">Generate Flashcards</div>
                            <div className="text-sm text-gray-500">Create study cards with AI</div>
                        </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </button>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-purple-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🎴</span>
                    <h3 className="font-semibold text-gray-800">Generate Flashcards</h3>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Options */}
            <div className="p-4 space-y-4">
                {/* Count slider */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of cards: {count}
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="25"
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value))}
                        className="w-full"
                    />
                </div>

                {/* Difficulty */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty
                    </label>
                    <div className="flex gap-2">
                        {['easy', 'medium', 'hard'].map(level => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm capitalize transition ${
                                    difficulty === level
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Deck name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Save to deck
                    </label>
                    <input
                        type="text"
                        value={deck}
                        onChange={(e) => setDeck(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Deck name..."
                    />
                </div>

                {/* Result message */}
                {result && (
                    <div className={`p-3 rounded-lg ${
                        result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span>{result.success ? '✅' : '❌'} {result.message}</span>
                            {result.success && (
                                <button
                                    onClick={handleGoToFlashcards}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                                >
                                    View Deck →
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="p-4 bg-white/50 flex flex-col sm:flex-row gap-2">
                <button
                    onClick={handleGenerateFromContent}
                    disabled={isGenerating}
                    className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Generating...
                        </>
                    ) : (
                        <>🤖 Generate from Content</>
                    )}
                </button>

                {hasKeyPoints && (
                    <button
                        onClick={handleGenerateFromKeyPoints}
                        disabled={isGenerating}
                        className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Generating...
                            </>
                        ) : (
                            <>📝 From Key Points</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default FlashcardGenerator;
