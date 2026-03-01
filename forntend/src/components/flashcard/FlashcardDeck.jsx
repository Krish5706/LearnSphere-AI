/**
 * FlashcardDeck Component
 * 
 * Displays deck overview with card counts and statistics.
 * Provides access to study sessions and deck management.
 */

import React, { useState } from 'react';
import { Trash2, Settings, Plus, RefreshCw, BookOpen } from 'lucide-react';

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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            {/* Deck header */}
            <div className="p-5 border-b border-slate-100">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-800 truncate pr-4">
                        {deck.name}
                    </h3>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onManage(deck.name)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                            title="Manage deck"
                        >
                            <Settings size={18} />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                            title="Delete deck"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                
                {/* Card counts */}
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-slate-600">{deck.newCount} new</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span className="text-slate-600">{deck.dueCount} due</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span className="text-slate-600">{deck.count} total</span>
                    </div>
                </div>
            </div>

            {/* Study button */}
            <div className="p-4 bg-slate-50">
                <button
                    onClick={() => onStudy(deck.name)}
                    disabled={deck.count === 0}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        deck.count > 0
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
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
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Plus size={20} className="text-blue-600" />
                        Add Flashcard
                    </h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Question */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Question *
                        </label>
                        <textarea
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                            rows="2"
                            placeholder="What do you want to remember?"
                            autoFocus
                        />
                    </div>

                    {/* Answer */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Answer *
                        </label>
                        <textarea
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                            rows="2"
                            placeholder="The answer or explanation"
                        />
                    </div>

                    {/* Hint - optional */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Hint <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={hint}
                            onChange={(e) => setHint(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            placeholder="A clue to help remember"
                        />
                    </div>

                    {/* Deck */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Deck
                        </label>
                        {decks.length > 0 ? (
                            <select
                                value={selectedDeck}
                                onChange={(e) => {
                                    setSelectedDeck(e.target.value);
                                    if (e.target.value) setNewDeckName('');
                                }}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
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
                                className={`w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${decks.length > 0 ? 'mt-2' : ''}`}
                                placeholder="Enter deck name"
                            />
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl transition text-sm font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!front.trim() || !back.trim() || isSaving}
                        className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="animate-spin h-4 w-4" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Add Card
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main FlashcardDeck component
const FlashcardDeck = ({ decks, stats, onStudy, onManage, onCreateCard, onDeleteDeck, onRefresh, onAIGenerate }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Calculate totals for quick study
    const totalDue = decks.reduce((sum, d) => sum + d.dueCount, 0);
    const totalNew = decks.reduce((sum, d) => sum + d.newCount, 0);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Flashcards</h2>
                    <p className="text-slate-500">Manage and study your flashcard decks</p>
                </div>
                <div className="flex gap-2">
                    {onAIGenerate && (
                        <button
                            onClick={onAIGenerate}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI Generate
                        </button>
                    )}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
                    >
                        <Plus size={18} />
                        Add Card
                    </button>
                </div>
            </div>

            {/* Quick study - only show if there are cards due or new */}
            {totalDue + totalNew > 0 && (
                <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <BookOpen className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Ready to Study?</h3>
                                <p className="text-slate-600">
                                    {totalDue + totalNew} cards from all your decks combined
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => onStudy(null)}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
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
                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Flashcards Yet</h3>
                    <p className="text-slate-500 mb-10">
                        Create your first flashcard to start learning with spaced repetition.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold inline-flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create Your Flashcard
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
