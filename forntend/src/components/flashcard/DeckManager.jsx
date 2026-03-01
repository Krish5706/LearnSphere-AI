/**
 * DeckManager Component
 * 
 * Shows all cards in a deck with edit/delete functionality.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getDueCards, deleteFlashcard, updateFlashcard } from '../../services/flashcardService';

// Edit Card Modal
const EditCardModal = ({ card, isOpen, onClose, onSave }) => {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (card) {
            setFront(card.front || '');
            setBack(card.back || '');
        }
    }, [card]);

    if (!isOpen || !card) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(card._id, { front, back });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Edit Card</h2>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question (Front)
                        </label>
                        <textarea
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer (Back)
                        </label>
                        <textarea
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="p-6 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !front.trim() || !back.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Single Card Item
const CardItem = ({ card, onEdit, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(card._id);
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    // Status badge colors
    const statusColors = {
        'new': 'bg-blue-100 text-blue-700',
        'learning': 'bg-yellow-100 text-yellow-700',
        'review': 'bg-green-100 text-green-700',
        'relearning': 'bg-orange-100 text-orange-700'
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Question */}
                    <div className="mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase">Question</span>
                        <p className="text-gray-800 mt-1">{card.front}</p>
                    </div>
                    
                    {/* Answer */}
                    <div className="mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase">Answer</span>
                        <p className="text-gray-600 mt-1">{card.back}</p>
                    </div>

                    {/* Status & Stats */}
                    <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2 py-1 rounded-full ${statusColors[card.status] || 'bg-gray-100 text-gray-600'}`}>
                            {card.status || 'new'}
                        </span>
                        {card.reviewCount > 0 && (
                            <span className="text-gray-500">
                                Reviewed {card.reviewCount}x
                            </span>
                        )}
                        {card.nextReviewDate && (
                            <span className="text-gray-500">
                                Next: {new Date(card.nextReviewDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => onEdit(card)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    
                    {showConfirm ? (
                        <div className="flex gap-1">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Confirm delete"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                title="Cancel"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main DeckManager Component
const DeckManager = ({ deckName, onClose, onStudy }) => {
    const [cards, setCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingCard, setEditingCard] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Load cards
    const loadCards = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await getDueCards({
                deck: deckName,
                limit: 500,
                includeNew: true
            });
            
            if (response.success) {
                setCards(response.data.cards || []);
            }
        } catch (err) {
            console.error('Error loading cards:', err);
            setError('Failed to load cards');
        } finally {
            setIsLoading(false);
        }
    }, [deckName]);

    useEffect(() => {
        loadCards();
    }, [loadCards]);

    // Handle edit
    const handleEdit = (card) => {
        setEditingCard(card);
    };

    // Handle save edit
    const handleSaveEdit = async (cardId, updates) => {
        try {
            await updateFlashcard(cardId, updates);
            loadCards(); // Refresh
        } catch (err) {
            console.error('Error updating card:', err);
            throw err;
        }
    };

    // Handle delete
    const handleDelete = async (cardId) => {
        try {
            await deleteFlashcard(cardId);
            setCards(prev => prev.filter(c => c._id !== cardId));
        } catch (err) {
            console.error('Error deleting card:', err);
        }
    };

    // Filter cards by search
    const filteredCards = cards.filter(card => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return card.front.toLowerCase().includes(query) || 
               card.back.toLowerCase().includes(query);
    });

    // Stats
    const stats = {
        total: cards.length,
        new: cards.filter(c => c.status === 'new').length,
        learning: cards.filter(c => c.status === 'learning').length,
        review: cards.filter(c => c.status === 'review').length
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading cards...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <div className="text-4xl mb-4">❌</div>
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                    onClick={loadCards}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{deckName}</h1>
                        <p className="text-gray-500 text-sm">{cards.length} cards</p>
                    </div>
                </div>
                
                <button
                    onClick={() => onStudy(deckName)}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Study Now
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
                    <div className="text-sm text-blue-600">New</div>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.learning}</div>
                    <div className="text-sm text-yellow-600">Learning</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.review}</div>
                    <div className="text-sm text-green-600">Review</div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cards..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Cards List */}
            {filteredCards.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-600">
                        {searchQuery ? 'No cards match your search' : 'No cards in this deck'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredCards.map(card => (
                        <CardItem
                            key={card._id}
                            card={card}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <EditCardModal
                card={editingCard}
                isOpen={!!editingCard}
                onClose={() => setEditingCard(null)}
                onSave={handleSaveEdit}
            />
        </div>
    );
};

export default DeckManager;
