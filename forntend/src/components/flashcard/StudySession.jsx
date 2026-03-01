/**
 * StudySession Component
 * 
 * Interactive flashcard study with AI-powered answer testing.
 * User types their answer, AI evaluates if it's correct (handles typos, grammar).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getDueCards, submitReview, evaluateAnswer } from '../../services/flashcardService';
import { 
    Loader2, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Pencil,
    Eye,
    ChevronLeft,
    ChevronRight,
    Shuffle,
    RotateCcw,
    X,
    Sparkles,
    ArrowRight,
    Trophy,
    Star,
    BookOpen
} from 'lucide-react';
import './Flashcard.css';

// Mode selection screen (shown BEFORE study starts)
const ModeSelectionScreen = ({ onSelectMode, deckName, cardCount }) => {
    return (
        <div className="max-w-lg mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Choose Study Mode</h2>
                <p className="text-slate-500">{deckName || 'All Cards'} • {cardCount} cards</p>
            </div>

            <div className="space-y-4">
                {/* Test Mode */}
                <button
                    onClick={() => onSelectMode('test')}
                    className="w-full p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <Pencil className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-blue-800 group-hover:text-blue-900">
                                Test Mode
                            </h3>
                            <p className="text-blue-600 mt-1">
                                Type your answer and get AI feedback
                            </p>
                            <p className="text-sm text-blue-500 mt-2">
                                Handles typos and different wording
                            </p>
                        </div>
                    </div>
                </button>

                {/* Review Mode */}
                <button
                    onClick={() => onSelectMode('review')}
                    className="w-full p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl hover:border-purple-500 hover:shadow-lg transition-all text-left group"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <Eye className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-purple-800 group-hover:text-purple-900">
                                Review Mode
                            </h3>
                            <p className="text-purple-600 mt-1">
                                Flip cards to study at your own pace
                            </p>
                            <p className="text-sm text-purple-500 mt-2">
                                No scoring, just for learning
                            </p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
};

// Question Card with answer input (Test Mode) - with AI evaluation
const TestCard = ({ card, userAnswer, setUserAnswer, onSubmit, isAnswered, result, isChecking }) => {
    const inputRef = useRef(null);
    
    useEffect(() => {
        if (!isAnswered && !isChecking && inputRef.current) {
            inputRef.current.focus();
        }
    }, [card, isAnswered, isChecking]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isAnswered && !isChecking) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Question */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl p-8 border-2 border-blue-200 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold uppercase">
                        Question
                    </span>
                </div>
                <p className="text-xl text-slate-800 text-center leading-relaxed font-medium py-6">
                    {card.front}
                </p>
            </div>

            {/* Answer Input or Result */}
            {!isAnswered ? (
                <div className="space-y-4">
                    <textarea
                        ref={inputRef}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your answer here..."
                        className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
                        rows="3"
                        disabled={isChecking}
                    />
                    <button
                        onClick={onSubmit}
                        disabled={isChecking}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5" /> 
                                AI is checking...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Check Answer
                            </>
                        )}
                    </button>
                    <p className="text-center text-slate-400 text-sm">
                        Press Enter to submit • AI handles typos and different wording
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Your Answer */}
                    {userAnswer.trim() && (
                        <div className={`p-6 rounded-2xl border-2 ${
                            result.correct 
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-red-50 border-red-300'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {result.correct ? (
                                    <CheckCircle className="text-green-600" size={24} />
                                ) : (
                                    <XCircle className="text-red-600" size={24} />
                                )}
                                <span className="font-semibold text-slate-700">Your Answer:</span>
                            </div>
                            <p className="text-lg text-slate-800">{userAnswer}</p>
                            {result.feedback && (
                                <p className="mt-2 text-sm text-slate-600 italic flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-500" />
                                    {result.feedback}
                                </p>
                            )}
                        </div>
                    )}
                    
                    {/* Correct Answer */}
                    <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="text-emerald-600" size={24} />
                            <span className="font-semibold text-emerald-700">Correct Answer:</span>
                        </div>
                        <p className="text-lg text-slate-800 font-medium">{card.back}</p>
                        {card.explanation && (
                            <p className="mt-3 text-sm text-slate-600 border-t border-emerald-200 pt-3">
                                <span className="font-medium">Explanation:</span> {card.explanation}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Review Card (simple conditional render - no flip animation)
const ReviewCard = ({ card, isFlipped, onFlip }) => {
    // Safety check - if no card, show error
    if (!card) {
        return (
            <div className="w-full max-w-2xl mx-auto p-8 text-center text-slate-500">
                No card data available
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div 
                className={`cursor-pointer select-none rounded-3xl shadow-xl p-8 min-h-[350px] flex flex-col hover:shadow-2xl transition-all duration-300 ${
                    isFlipped 
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300' 
                        : 'bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200'
                }`}
                onClick={onFlip}
            >
                {/* Header badge */}
                <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase w-fit ${
                    isFlipped 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-blue-100 text-blue-700'
                }`}>
                    {isFlipped ? 'Answer' : 'Question'}
                </span>
                
                {/* Content */}
                <div className="flex-grow flex items-center justify-center py-8">
                    <p className={`text-xl text-slate-800 text-center leading-relaxed ${
                        isFlipped ? 'font-semibold' : 'font-medium'
                    }`}>
                        {isFlipped ? (card.back || 'No answer available') : (card.front || 'No question available')}
                    </p>
                </div>
                
                {/* Explanation (only show on answer side) */}
                {isFlipped && card.explanation && (
                    <div className="p-3 bg-white/70 rounded-xl border border-emerald-200 mb-4">
                        <p className="text-sm text-slate-600">
                            <span className="font-medium">Explanation:</span> {card.explanation}
                        </p>
                    </div>
                )}
                
                {/* Click hint */}
                <p className="text-center text-slate-400 text-sm">
                    {isFlipped ? 'Click to flip back' : 'Click to reveal answer'}
                </p>
            </div>
        </div>
    );
};

// Navigation Controls
const NavigationControls = ({ currentIndex, total, onPrev, onNext, onShuffle }) => {
    return (
        <div className="flex items-center justify-center gap-3 mt-8">
            <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                title="Previous card"
            >
                <ChevronLeft size={24} />
            </button>
            
            <div className="px-6 py-3 bg-slate-100 rounded-xl text-slate-700 font-semibold min-w-[100px] text-center">
                {currentIndex + 1} / {total}
            </div>
            
            <button
                onClick={onNext}
                disabled={currentIndex === total - 1}
                className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                title="Next card"
            >
                <ChevronRight size={24} />
            </button>
            
            <button
                onClick={onShuffle}
                className="p-3 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all hover:scale-105 active:scale-95 ml-2"
                title="Shuffle cards"
            >
                <Shuffle size={24} />
            </button>
        </div>
    );
};

// Progress bar component
const ProgressBar = ({ current, total, correct, incorrect }) => {
    const progress = total > 0 ? (current / total) * 100 : 0;
    
    return (
        <div className="mb-8 max-w-2xl mx-auto">
            <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-600 font-medium">Card {current} of {total}</span>
                <span className="flex gap-4">
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle size={16} /> {correct} knew
                    </span>
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                        <XCircle size={16} /> {incorrect} learning
                    </span>
                </span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

// Session complete screen
const SessionComplete = ({ stats, onRestart, onClose }) => {
    const accuracy = stats.total > 0 
        ? Math.round((stats.correct / stats.total) * 100) 
        : 0;

    return (
        <div className="text-center py-16 px-6">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                {accuracy >= 80 ? (
                    <Trophy className="text-white" size={48} />
                ) : accuracy >= 60 ? (
                    <Star className="text-white" size={48} />
                ) : (
                    <BookOpen className="text-white" size={48} />
                )}
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
                Well Done!
            </h2>
            <p className="text-slate-600 text-lg mb-8">
                You've completed this study session!
            </p>
            
            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-10">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-sm border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-slate-600 mt-1">Total Cards</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-sm border border-green-200">
                    <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
                    <div className="text-sm text-slate-600 mt-1">Knew Already</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 shadow-sm border border-purple-200">
                    <div className="text-3xl font-bold text-purple-600">{accuracy}%</div>
                    <div className="text-sm text-slate-600 mt-1">Success Rate</div>
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                <button
                    onClick={onClose}
                    className="px-8 py-4 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition font-semibold"
                >
                    Done
                </button>
                <button
                    onClick={onRestart}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold flex items-center gap-2"
                >
                    <RotateCcw size={20} />
                    Study Again
                </button>
            </div>
        </div>
    );
};

// Main StudySession component - Choose mode FIRST, then study
const StudySession = ({ 
    deck = null, 
    documentId = null, 
    onClose,
    limit = 100 
}) => {
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sessionStats, setSessionStats] = useState({
        correct: 0,
        incorrect: 0,
        total: 0
    });
    const [isComplete, setIsComplete] = useState(false);
    // Track which cards have been answered: { cardId: { correct: boolean, userAnswer: string, feedback: string } }
    const [answeredCards, setAnsweredCards] = useState({});
    
    // Study mode: null (not chosen), 'test' (type answer) or 'review' (flip cards)
    const [studyMode, setStudyMode] = useState(null); // Start with null - no mode chosen
    const [modeChosen, setModeChosen] = useState(false);
    
    // For test mode
    const [userAnswer, setUserAnswer] = useState('');
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
    const [answerResult, setAnswerResult] = useState(null); // { correct: boolean, feedback: string }

    // Load cards
    const loadCards = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await getDueCards({
                deck,
                documentId,
                limit,
                includeNew: true
            });
            
            if (response.success && response.data.cards.length > 0) {
                setCards(response.data.cards);
                setSessionStats({
                    correct: 0,
                    incorrect: 0,
                    total: response.data.cards.length
                });
            } else {
                setCards([]);
            }
        } catch (err) {
            console.error('Error loading cards:', err);
            setError('Failed to load flashcards. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [deck, documentId, limit]);

    useEffect(() => {
        loadCards();
    }, [loadCards]);

    // Handle mode selection
    const handleSelectMode = (mode) => {
        setStudyMode(mode);
        setModeChosen(true);
        // Reset study state
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsComplete(false);
        setAnsweredCards({});
        setUserAnswer('');
        setIsAnswerChecked(false);
        setAnswerResult(null);
        setSessionStats({ correct: 0, incorrect: 0, total: cards.length });
    };

    // Submit review to backend
    const saveReview = async (cardId, isCorrect) => {
        try {
            const quality = isCorrect ? 5 : 1; // 5 = perfect, 1 = wrong
            await submitReview(cardId, quality, 0);
        } catch (err) {
            console.error('Error saving review:', err);
        }
    };

    // Check answer in test mode - with AI
    const handleCheckAnswer = async () => {
        const currentCard = cards[currentIndex];
        
        // Allow submitting empty answer (skip)
        if (!userAnswer.trim()) {
            setAnswerResult({ correct: false, feedback: 'Skipped' });
            setIsAnswerChecked(true);
            
            if (!answeredCards[currentCard._id]) {
                setAnsweredCards(prev => ({
                    ...prev,
                    [currentCard._id]: { correct: false, userAnswer: '', feedback: 'Skipped' }
                }));
                setSessionStats(prev => ({
                    ...prev,
                    incorrect: prev.incorrect + 1
                }));
                await saveReview(currentCard._id, false);
            }
            return;
        }
        
        setIsCheckingAnswer(true);
        
        try {
            // Use AI to evaluate the answer
            const aiResult = await evaluateAnswer(
                userAnswer, 
                currentCard.back, 
                currentCard.front
            );
            
            const isCorrect = aiResult.success && aiResult.data.correct;
            const feedback = aiResult.success ? aiResult.data.feedback : 'Could not evaluate';
            
            setAnswerResult({ correct: isCorrect, feedback: feedback });
            setIsAnswerChecked(true);
            
            // Only count if not already answered
            if (!answeredCards[currentCard._id]) {
                setAnsweredCards(prev => ({
                    ...prev,
                    [currentCard._id]: { correct: isCorrect, userAnswer: userAnswer, feedback: feedback }
                }));
                
                setSessionStats(prev => ({
                    ...prev,
                    correct: isCorrect ? prev.correct + 1 : prev.correct,
                    incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1
                }));
                
                await saveReview(currentCard._id, isCorrect);
            }
        } catch (err) {
            console.error('AI evaluation error:', err);
            // Fallback - mark as incorrect
            setAnswerResult({ correct: false, feedback: 'Could not evaluate answer' });
            setIsAnswerChecked(true);
            
            if (!answeredCards[currentCard._id]) {
                setAnsweredCards(prev => ({
                    ...prev,
                    [currentCard._id]: { correct: false, userAnswer: userAnswer, feedback: 'Evaluation failed' }
                }));
                setSessionStats(prev => ({
                    ...prev,
                    incorrect: prev.incorrect + 1
                }));
                await saveReview(currentCard._id, false);
            }
        } finally {
            setIsCheckingAnswer(false);
        }
    };

    // Navigate to next card
    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            setUserAnswer('');
            setIsAnswerChecked(false);
            setAnswerResult(null);
        } else if (currentIndex === cards.length - 1) {
            setIsComplete(true);
        }
    };

    // Navigate to previous card
    const handlePrev = () => {
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            setIsFlipped(false);
            
            const prevCard = cards[newIndex];
            if (answeredCards[prevCard._id]) {
                setUserAnswer(answeredCards[prevCard._id].userAnswer || '');
                setIsAnswerChecked(true);
                setAnswerResult({ 
                    correct: answeredCards[prevCard._id].correct,
                    feedback: answeredCards[prevCard._id].feedback || ''
                });
            } else {
                setUserAnswer('');
                setIsAnswerChecked(false);
                setAnswerResult(null);
            }
        }
    };

    // Handle flip for review mode
    const handleFlip = () => {
        setIsFlipped(prev => !prev);
    };

    // Shuffle cards
    const handleShuffle = () => {
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        setUserAnswer('');
        setIsAnswerChecked(false);
        setAnswerResult(null);
    };

    // Restart session (go back to mode selection)
    const handleRestart = () => {
        setModeChosen(false);
        setStudyMode(null);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsComplete(false);
        setAnsweredCards({});
        setUserAnswer('');
        setIsAnswerChecked(false);
        setAnswerResult(null);
        setSessionStats({ correct: 0, incorrect: 0, total: cards.length });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <p className="text-slate-600 text-lg font-medium">Loading flashcards...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="text-red-600 mb-4" size={48} />
                <p className="text-red-600 text-lg mb-6">{error}</p>
                <button 
                    onClick={loadCards}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // No cards state
    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="text-slate-400" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    No Flashcards Yet
                </h2>
                <p className="text-slate-600 mb-6">
                    Generate flashcards from a document to start studying!
                </p>
                <button 
                    onClick={onClose}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // Mode selection - show FIRST before study
    if (!modeChosen) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Study Session</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
                    >
                        <X size={24} />
                    </button>
                </div>
                <ModeSelectionScreen 
                    onSelectMode={handleSelectMode}
                    deckName={deck || 'All Cards'}
                    cardCount={cards.length}
                />
            </div>
        );
    }

    // Session complete
    if (isComplete) {
        // Test mode - show score results
        if (studyMode === 'test') {
            return (
                <SessionComplete 
                    stats={sessionStats} 
                    onRestart={handleRestart}
                    onClose={onClose}
                />
            );
        }
        
        // Review mode - simple completion message
        return (
            <div className="max-w-lg mx-auto text-center py-16">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-600" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Review Complete!
                </h2>
                <p className="text-slate-600 mb-8">
                    You've reviewed all {cards.length} cards in this deck.
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleRestart}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium flex items-center gap-2"
                    >
                        <RotateCcw size={18} />
                        Review Again
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-medium"
                    >
                        Done
                    </button>
                </div>
                <p className="mt-6 text-sm text-slate-500">
                    Ready to test your knowledge? Switch to Test Mode!
                </p>
            </div>
        );
    }

    const currentCard = cards[currentIndex];
    const isCardAnswered = !!answeredCards[currentCard._id];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Study Session</h2>
                    <p className="text-slate-500 flex items-center gap-2">
                        {deck || 'All Cards'} • {studyMode === 'test' ? (
                            <span className="flex items-center gap-1">
                                <Pencil size={16} /> Test Mode
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Eye size={16} /> Review Mode
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Progress - only show stats in test mode */}
            {studyMode === 'test' ? (
                <ProgressBar 
                    current={currentIndex + 1} 
                    total={cards.length}
                    correct={sessionStats.correct}
                    incorrect={sessionStats.incorrect}
                />
            ) : (
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-500 mb-2">
                        <span>Card {currentIndex + 1} of {cards.length}</span>
                        <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}% complete</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Test Mode */}
            {studyMode === 'test' && (
                <TestCard 
                    card={currentCard}
                    userAnswer={userAnswer}
                    setUserAnswer={setUserAnswer}
                    onSubmit={handleCheckAnswer}
                    isAnswered={isAnswerChecked}
                    isChecking={isCheckingAnswer}
                    result={answerResult}
                />
            )}

            {/* Review Mode */}
            {studyMode === 'review' && (
                <ReviewCard 
                    card={currentCard}
                    isFlipped={isFlipped}
                    onFlip={handleFlip}
                />
            )}

            {/* Navigation */}
            <NavigationControls 
                currentIndex={currentIndex}
                total={cards.length}
                onPrev={handlePrev}
                onNext={handleNext}
                onShuffle={handleShuffle}
            />

            {/* Keyboard shortcuts help */}
            <div className="text-center text-slate-400 text-sm mt-8">
                {studyMode === 'test' ? (
                    <span className="flex items-center justify-center gap-2">
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">Enter</kbd> 
                        Check Answer (AI-powered)
                    </span>
                ) : (
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">Space</kbd> 
                            Flip
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">←</kbd> 
                            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">→</kbd> 
                            Navigate
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudySession;
