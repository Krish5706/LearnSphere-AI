/**
 * FlashcardDeck Component
 * 
 * Displays deck overview with card counts and statistics.
 * Provides access to study sessions and deck management.
 */

import React, { useState } from 'react';
import { formatInterval, getMaturityColor } from '../../services/flashcardService';

// Deck card component
const DeckCard = ({ deck, onStudy, onManage, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (window.confirm(`Delete deck "${deck.name}" and all ${deck.count} cards?`)) {
            setIsDeleting(true);
            await onDelete(deck.name);
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100">
            {/* Deck header */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 truncate pr-4">
                        {deck.name}
                    </h3>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onManage(deck.name)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Manage deck"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete deck"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* Card counts */}
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-gray-600">{deck.newCount} new</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span className="text-gray-600">{deck.dueCount} due</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        <span className="text-gray-600">{deck.count} total</span>
                    </div>
                </div>
            </div>

            {/* Study button */}
            <div className="p-4 bg-gray-50">
                <button
                    onClick={() => onStudy(deck.name)}
                    disabled={deck.count === 0}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                        deck.count > 0
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {deck.count > 0 
                        ? `Study Now (${deck.count} cards)` 
                        : 'No Cards Yet'}
                </button>
            </div>
        </div>
    );
};

// Create card modal - Clean UI
const CreateCardModal = ({ isOpen, onClose, onSave, decks }) => {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [hint, setHint] = useState('');
    const [selectedDeck, setSelectedDeck] = useState('');
    const [newDeckName, setNewDeckName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!front.trim() || !back.trim()) {
            setError('Please fill in both question and answer');
            return;
        }
        
        setIsSaving(true);
        setError(null);
        
        try {
            await onSave({
                front: front.trim(),
                back: back.trim(),
                hint: hint.trim() || null,
                deck: newDeckName.trim() || selectedDeck || 'Default Deck'
            });
            
            // Reset form
            setFront('');
            setBack('');
            setHint('');
            setNewDeckName('');
            setSelectedDeck('');
            onClose();
        } catch (err) {
            console.error('Error saving flashcard:', err);
            // Check for specific error types
            if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Failed to create flashcard. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setFront('');
        setBack('');
        setHint('');
        setNewDeckName('');
        setSelectedDeck('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Add Flashcard</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Question */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Question *
                        </label>
                        <textarea
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                            rows="2"
                            placeholder="What do you want to remember?"
                            autoFocus
                        />
                    </div>

                    {/* Answer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Answer *
                        </label>
                        <textarea
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                            rows="2"
                            placeholder="The answer or explanation"
                        />
                    </div>

                    {/* Hint - optional */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Hint <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={hint}
                            onChange={(e) => setHint(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="A clue to help remember"
                        />
                    </div>

                    {/* Deck */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Deck
                        </label>
                        {decks.length > 0 ? (
                            <select
                                value={selectedDeck}
                                onChange={(e) => {
                                    setSelectedDeck(e.target.value);
                                    if (e.target.value) setNewDeckName('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                <option value="">Create new deck...</option>
                                {decks.map(d => (
                                    <option key={d.name} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        ) : null}
                        
                        {(decks.length === 0 || !selectedDeck) && (
                            <input
                                type="text"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${decks.length > 0 ? 'mt-2' : ''}`}
                                placeholder="Enter deck name"
                            />
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                            <span className="text-red-500">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!front.trim() || !back.trim() || isSaving}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Saving...
                            </>
                        ) : (
                            'Add Card'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Compact Stats Widget - only shows when there's meaningful data
const StatsWidget = ({ stats, onStudyAll }) => {
    if (!stats) return null;

    // Check if user has any review history
    const hasStudyHistory = stats.totalReviews > 0;
    const hasCards = stats.totalCards > 0;

    if (!hasCards) return null;

    return (
        <div className="mb-6">
            {/* Compact stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Due Today - Primary action card */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white">
                    <div className="text-3xl font-bold">{stats.dueToday}</div>
                    <div className="text-sm opacity-90">Due Today</div>
                </div>
                
                {/* Total Cards */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="text-3xl font-bold text-gray-800">{stats.totalCards}</div>
                    <div className="text-sm text-gray-500">Total Cards</div>
                </div>
                
                {/* Retention - only show if they've done reviews */}
                {hasStudyHistory ? (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-green-600">{stats.overallRetention}%</span>
                        </div>
                        <div className="text-sm text-gray-500">Retention Rate</div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-4 text-white">
                        <div className="text-lg font-medium">📚 New!</div>
                        <div className="text-sm opacity-90">Start studying</div>
                    </div>
                )}
                
                {/* Reviews Done OR Streak info */}
                {hasStudyHistory ? (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-3xl font-bold text-purple-600">{stats.totalReviews}</div>
                        <div className="text-sm text-gray-500">Reviews Done</div>
                    </div>
                ) : (
                    <div className="bg-gray-100 rounded-xl p-4">
                        <div className="text-lg font-medium text-gray-600">🎯 Goal</div>
                        <div className="text-sm text-gray-500">{stats.dueToday} cards today</div>
                    </div>
                )}
            </div>

            {/* Maturity progress bar - only show if there's meaningful data */}
            {hasStudyHistory && stats.maturity && (
                <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Learning Progress</span>
                        <span className="text-xs text-gray-500">
                            {Math.round(((stats.maturity.mature + stats.maturity.mastered) / stats.totalCards) * 100) || 0}% mastered
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
                        <div 
                            className="bg-blue-400 transition-all" 
                            style={{ width: `${(stats.maturity.new / stats.totalCards) * 100 || 0}%` }}
                            title={`New: ${stats.maturity.new}`}
                        />
                        <div 
                            className="bg-green-400 transition-all" 
                            style={{ width: `${(stats.maturity.young / stats.totalCards) * 100 || 0}%` }}
                            title={`Learning: ${stats.maturity.young}`}
                        />
                        <div 
                            className="bg-purple-500 transition-all" 
                            style={{ width: `${(stats.maturity.mature / stats.totalCards) * 100 || 0}%` }}
                            title={`Mature: ${stats.maturity.mature}`}
                        />
                        <div 
                            className="bg-yellow-400 transition-all" 
                            style={{ width: `${(stats.maturity.mastered / stats.totalCards) * 100 || 0}%` }}
                            title={`Mastered: ${stats.maturity.mastered}`}
                        />
                    </div>
                    <div className="flex justify-between text-xs mt-2 text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span> New ({stats.maturity.new})
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span> Learning ({stats.maturity.young})
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Mature ({stats.maturity.mature})
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Mastered ({stats.maturity.mastered})
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main component
const FlashcardDeck = ({ 
    decks, 
    stats, 
    onStudy, 
    onManage,
    onCreateCard,
    onDeleteDeck,
    onRefresh 
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const totalDue = decks.reduce((sum, d) => sum + d.dueCount, 0);
    const totalNew = decks.reduce((sum, d) => sum + d.newCount, 0);

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Flashcards</h1>
                    <p className="text-gray-500">
                        {totalDue + totalNew > 0 
                            ? `${totalDue + totalNew} cards to review today`
                            : 'All caught up! 🎉'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onRefresh}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Card
                    </button>
                </div>
            </div>

            {/* Stats - compact and dynamic */}
            <StatsWidget stats={stats} onStudyAll={() => onStudy(null)} />

            {/* Quick study button */}
            {(totalDue > 0 || totalNew > 0) && (
                <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 mb-6 text-white">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold">Ready to Study?</h3>
                            <p className="opacity-90">
                                {totalDue + totalNew} cards from all your decks combined
                            </p>
                        </div>
                        <button
                            onClick={() => onStudy(null)}
                            className="px-8 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition"
                            title="Study cards from all decks in one session"
                        >
                            Study All Cards
                        </button>
                    </div>
                </div>
            )}

            {/* Decks grid */}
            {decks.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {decks.map(deck => (
                        <DeckCard 
                            key={deck.name}
                            deck={deck}
                            onStudy={onStudy}
                            onManage={onManage}
                            onDelete={onDeleteDeck}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <div className="text-5xl mb-4">📚</div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">No Flashcards Yet</h3>
                    <p className="text-gray-500 mb-6">
                        Create your first flashcard to start learning with spaced repetition.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Create Your First Card
                    </button>
                </div>
            )}

            {/* Create card modal */}
            <CreateCardModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={onCreateCard}
                decks={decks}
            />
        </div>
    );
};

export default FlashcardDeck;
