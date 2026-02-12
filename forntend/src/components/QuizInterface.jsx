import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const QuizInterface = ({ quizData, onSubmit, onClose }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showReview, setShowReview] = useState(false);
    const [reviewData, setReviewData] = useState(null);
    const [timeStarted, setTimeStarted] = useState(Date.now());
    const [timeSpent, setTimeSpent] = useState(0);
    const [loading, setLoading] = useState(false);
    const [expandedReview, setExpandedReview] = useState(null);
    const timerRef = useRef(null);

    const questions = quizData?.questions || [];
    const totalQuestions = questions.length;

    // Timer effect
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeSpent(Math.floor((Date.now() - timeStarted) / 1000));
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [timeStarted]);

    const handleAnswerSelect = (option) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentQuestion].questionId]: option
        }));
    };

    const handleNext = () => {
        if (currentQuestion < totalQuestions - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Format answers
            const formattedAnswers = questions.map(q => ({
                questionId: q.questionId,
                selectedAnswer: answers[q.questionId] || '',
                markedTime: timeSpent
            }));

            // Call submission API
            const response = await axios.post(`/api/quizzes/${quizData.quizId}/submit`, {
                answers: formattedAnswers,
                timeTaken: Math.floor(timeSpent / 60)
            });

            setReviewData(response.data.data);
            setShowReview(true);
            if (onSubmit) onSubmit(response.data.data);
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('Error submitting quiz. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const answeredCount = Object.keys(answers).length;
    const progressPercentage = (answeredCount / totalQuestions) * 100;

    if (showReview && reviewData) {
        return <QuizReview reviewData={reviewData} quizData={quizData} onClose={onClose} />;
    }

    const question = questions[currentQuestion];
    const isAnswered = answers[question?.questionId];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold">{quizData?.quizTitle}</h2>
                            <p className="text-blue-100 text-sm mt-1">{quizData?.quizType}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="bg-white/20 rounded-full h-2 mb-3">
                        <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-blue-100">Question</p>
                            <p className="font-bold">{currentQuestion + 1}/{totalQuestions}</p>
                        </div>
                        <div>
                            <p className="text-blue-100">Answered</p>
                            <p className="font-bold">{answeredCount}/{totalQuestions}</p>
                        </div>
                        <div>
                            <p className="text-blue-100">Time</p>
                            <p className="font-bold flex items-center gap-1">
                                <Clock size={14} />
                                {formatTime(timeSpent)}
                            </p>
                        </div>
                        <div>
                            <p className="text-blue-100">Progress</p>
                            <p className="font-bold">{Math.round(progressPercentage)}%</p>
                        </div>
                    </div>
                </div>

                {/* Question Body */}
                <div className="p-8">
                    {/* Question */}
                    <div className="mb-8">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                                {currentQuestion + 1}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 leading-relaxed">
                                    {question?.questionText}
                                </h3>
                                <div className="flex items-center gap-4 mt-3 text-sm">
                                    <span className={`px-3 py-1 rounded-full font-medium ${
                                        question?.difficulty === 'easy' 
                                            ? 'bg-green-100 text-green-700'
                                            : question?.difficulty === 'medium'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {question?.difficulty?.charAt(0).toUpperCase() + question?.difficulty?.slice(1)} Level
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                                        Topic: {question?.topic}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 mb-8">
                        {question?.options?.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswerSelect(option)}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left font-medium ${
                                    answers[question.questionId] === option
                                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                                        answers[question.questionId] === option
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-slate-300'
                                    }`}>
                                        {answers[question.questionId] === option && (
                                            <span className="text-white text-sm">✓</span>
                                        )}
                                    </div>
                                    <span>{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Question Navigator */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 p-4 bg-slate-50 rounded-xl">
                        {questions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestion(idx)}
                                className={`p-2 rounded-lg font-medium text-sm transition-colors ${
                                    idx === currentQuestion
                                        ? 'bg-blue-600 text-white'
                                        : answers[q.questionId]
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex justify-between items-center rounded-b-2xl">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                        className="px-6 py-2 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Previous
                    </button>

                    <div className="text-sm text-slate-600">
                        Question {currentQuestion + 1} of {totalQuestions}
                    </div>

                    {currentQuestion === totalQuestions - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || answeredCount < totalQuestions}
                            className="px-8 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Submitting...' : answeredCount === totalQuestions ? 'Submit Quiz ✓' : `Answer all ${totalQuestions - answeredCount} remaining`}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-colors"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Quiz Review Component
 */
const QuizReview = ({ reviewData, quizData, onClose }) => {
    const [expandedQuestions, setExpandedQuestions] = useState(new Set());

    const toggleQuestion = (idx) => {
        const newSet = new Set(expandedQuestions);
        if (newSet.has(idx)) {
            newSet.delete(idx);
        } else {
            newSet.add(idx);
        }
        setExpandedQuestions(newSet);
    };

    const scoreColor = reviewData.percentageScore >= 70 ? 'text-green-600' : reviewData.percentageScore >= 50 ? 'text-yellow-600' : 'text-red-600';
    const scoreBgColor = reviewData.percentageScore >= 70 ? 'bg-green-50' : reviewData.percentageScore >= 50 ? 'bg-yellow-50' : 'bg-red-50';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
                {/* Header with Score */}
                <div className={`${scoreBgColor} p-8 text-center`}>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Quiz Completed! 🎉</h2>
                    
                    <div className="mb-6">
                        <div className={`text-6xl font-black ${scoreColor} mb-2`}>
                            {reviewData.percentageScore}%
                        </div>
                        <p className="text-lg font-semibold text-slate-700">
                            {reviewData.correctCount} out of {reviewData.totalQuestions} correct
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-slate-600 text-sm mb-1">Total Score</p>
                            <p className="text-2xl font-bold text-blue-600">{reviewData.totalScore}/{reviewData.totalQuestions}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-slate-600 text-sm mb-1">Time Taken</p>
                            <p className="text-2xl font-bold text-purple-600">{reviewData.timeTaken} min</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-slate-600 text-sm mb-1">Best Score</p>
                            <p className="text-2xl font-bold text-indigo-600">{reviewData.bestScore}%</p>
                        </div>
                    </div>
                </div>

                {/* Review Content */}
                <div className="p-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Detailed Review</h3>

                    <div className="space-y-4">
                        {reviewData.review?.map((item, idx) => (
                            <div
                                key={idx}
                                className={`border-2 rounded-xl overflow-hidden transition-all ${
                                    item.isCorrect
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-red-200 bg-red-50'
                                }`}
                            >
                                {/* Question Header */}
                                <button
                                    onClick={() => toggleQuestion(idx)}
                                    className="w-full p-4 flex items-start gap-4 hover:bg-white/50 transition-colors"
                                >
                                    <div className="flex-shrink-0">
                                        {item.isCorrect ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-red-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-slate-900 text-lg">
                                                Question {idx + 1}
                                            </h4>
                                            <ChevronDown
                                                size={20}
                                                className={`text-slate-600 transition-transform ${
                                                    expandedQuestions.has(idx) ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </div>
                                        <p className="text-slate-700 mt-2">{item.questionText}</p>
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {expandedQuestions.has(idx) && (
                                    <div className="px-4 pb-4 border-t-2 border-inherit pt-4 bg-white/50">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 mb-2">Your Answer:</p>
                                                <p className={`p-3 rounded-lg ${item.isCorrect ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
                                                    {item.yourAnswer || 'Not answered'}
                                                </p>
                                            </div>

                                            {!item.isCorrect && (
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 mb-2">Correct Answer:</p>
                                                    <p className="p-3 rounded-lg bg-green-100 text-green-900">
                                                        {item.correctAnswer}
                                                    </p>
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 mb-2">Explanation:</p>
                                                <p className="p-3 rounded-lg bg-slate-100 text-slate-800 leading-relaxed">
                                                    {item.explanation}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm">
                                                <span className={`px-3 py-1 rounded-full font-medium ${
                                                    item.difficulty === 'easy'
                                                        ? 'bg-green-200 text-green-900'
                                                        : item.difficulty === 'medium'
                                                        ? 'bg-yellow-200 text-yellow-900'
                                                        : 'bg-red-200 text-red-900'
                                                }`}>
                                                    {item.difficulty?.toUpperCase()}
                                                </span>
                                                <span className="bg-slate-200 text-slate-800 px-3 py-1 rounded-full">
                                                    {item.topic}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Performance Stats */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-900 mb-4">Performance Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-slate-600 text-sm mb-1">Correct Answers</p>
                                <p className="text-2xl font-bold text-green-600">{reviewData.correctCount}</p>
                            </div>
                            <div>
                                <p className="text-slate-600 text-sm mb-1">Incorrect Answers</p>
                                <p className="text-2xl font-bold text-red-600">{reviewData.totalQuestions - reviewData.correctCount}</p>
                            </div>
                            <div>
                                <p className="text-slate-600 text-sm mb-1">Accuracy Rate</p>
                                <p className="text-2xl font-bold text-blue-600">{reviewData.percentageScore}%</p>
                            </div>
                            <div>
                                <p className="text-slate-600 text-sm mb-1">Quiz Type</p>
                                <p className="text-lg font-bold text-indigo-600 capitalize">{quizData?.quizType}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 rounded-b-2xl flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizInterface;
