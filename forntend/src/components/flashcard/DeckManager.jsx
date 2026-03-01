/**
 * DeckManager Component
 * 
 * Shows all cards in a deck with edit/delete functionality.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getDueCards, deleteFlashcard, updateFlashcard } from '../../services/flashcardService';
import { 
    Loader2, 
    AlertCircle, 
    X, 
    ChevronLeft, 
    Play,
    Search,
    Edit3,
    Trash2,
    Check,
    BookOpen
} from 'lucide-react';

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
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Edit3 size={20} className="text-blue-600" />
                        Edit Card
                    </h2>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Question (Front)
                        </label>
                        <textarea
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            rows={3}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Answer (Back)
                        </label>
                        <textarea
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !front.trim() || !back.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin h-4 w-4" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                Save
                            </>
                        )}
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
        <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Question */}
                    <div className="mb-3">
                        <span className="text-xs font-medium text-slate-500 uppercase">Question</span>
                        <p className="text-slate-800 mt-1">{card.front}</p>
                    </div>
                    
                    {/* Answer */}
                    <div className="mb-3">
                        <span className="text-xs font-medium text-slate-500 uppercase">Answer</span>
                        <p className="text-slate-600 mt-1">{card.back}</p>
                    </div>

                    {/* Status & Stats */}
                    <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2 py-1 rounded-full ${statusColors[card.status] || 'bg-slate-100 text-slate-600'}`}>
                            {card.status || 'new'}
                        </span>
                        {card.reviewCount > 0 && (
                            <span className="text-slate-500">
                                Reviewed {card.reviewCount}x
                            </span>
                        )}
                        {card.nextReviewDate && (
                            <span className="text-slate-500">
                                Next: {new Date(card.nextReviewDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => onEdit(card)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        title="Edit"
                    >
                        <Edit3 size={18} />
                    </button>
                    
                    {showConfirm ? (
                        <div className="flex gap-1">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition"
                                title="Confirm delete"
                            >
                                <Check size={18} />
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                                title="Cancel"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Delete"
                        >
                            <Trash2 size={18} />
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
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-600 font-medium">Loading cards...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="text-red-600 mb-4" size={40} />
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                    onClick={loadCards}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
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
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{deckName}</h1>
                        <p className="text-slate-500 text-sm">{cards.length} cards</p>
                    </div>
                </div>
                
                <button
                    onClick={() => onStudy(deckName)}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
                >
                    <Play size={18} />
                    Study Now
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center shadow-sm">
                    <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                    <div className="text-sm text-slate-500">Total</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
                    <div className="text-sm text-blue-600">New</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 border border-yellow-200 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.learning}</div>
                    <div className="text-sm text-yellow-600">Learning</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.review}</div>
                    <div className="text-sm text-green-600">Review</div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search cards..."
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Cards List */}
            {filteredCards.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-slate-400" size={32} />
                    </div>
                    <p className="text-slate-600">
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
