import React, { useState } from 'react';
import { Award, TrendingUp, AlertCircle, CheckCircle2, XCircle, RefreshCcw, Home, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuizResultsAnalysis = ({ results, questions, onRetry }) => {
    const [filterType, setFilterType] = useState('all'); // 'all', 'correct', 'incorrect'

    if (!results || !questions) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
                <div className="text-center">
                    <p className="text-slate-500 font-bold text-lg">Loading results...</p>
                </div>
            </div>
        );
    }

    // Calculate stats - use results data if provided, otherwise calculate from questions
    const correctAnswers = results.score || 0;
    const totalQuestions = results.totalQuestions || questions.length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const percentage = results.percentage || Math.round((correctAnswers / totalQuestions) * 100);

    // Get performance level
    const getPerformanceLevel = () => {
        if (percentage >= 90) return { title: "Outstanding! 🌟", color: "text-green-600", bg: "bg-green-50", msg: "You've achieved mastery level!" };
        if (percentage >= 80) return { title: "Excellent! ✨", color: "text-blue-600", bg: "bg-blue-50", msg: "Great understanding of the material." };
        if (percentage >= 70) return { title: "Good Job! 👍", color: "text-cyan-600", bg: "bg-cyan-50", msg: "You're on the right track." };
        if (percentage >= 60) return { title: "Keep Going 📚", color: "text-amber-600", bg: "bg-amber-50", msg: "A little more practice needed." };
        return { title: "Practice More 💪", color: "text-orange-600", bg: "bg-orange-50", msg: "Let's review and try again." };
    };

    const performance = getPerformanceLevel();

    // Get failed questions
    const failedQuestions = results.wrongAnswers || [];

    // Get topics to focus on (from failed questions)
    const getTopicsToFocus = () => {
        if (failedQuestions.length === 0) return [];
        
        // Extract key words from wrong answers - this is a simple implementation
        const topics = [];
        failedQuestions.forEach(wrong => {
            const question = questions.find(q => q.id === wrong.questionId);
            if (question) {
                // Simple keyword extraction from question
                const words = question.question.split(/\s+/).filter(w => w.length > 4);
                topics.push(...words);
            }
        });
        
        // Get unique topics and limit to top 3
        return [...new Set(topics)].slice(0, 3);
    };

    const topicsToFocus = getTopicsToFocus();

    // Filter questions based on selected filter
    const getFilteredQuestions = () => {
        if (filterType === 'correct') {
            return questions.filter(q => !failedQuestions.some(w => w.questionId === q.id));
        }
        if (filterType === 'incorrect') {
            return questions.filter(q => failedQuestions.some(w => w.questionId === q.id));
        }
        return questions;
    };

    const filteredQuestions = getFilteredQuestions();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header Score Card */}
                <div className={`${performance.bg} rounded-3xl border-2 border-slate-200 shadow-2xl p-10 mb-8 text-center`}>
                    <div className="inline-block mb-6">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                            <Award size={48} className={performance.color} />
                        </div>
                    </div>

                    <h1 className={`text-4xl font-black mb-2 ${performance.color}`}>{performance.title}</h1>
                    <p className="text-slate-600 text-lg mb-8">{performance.msg}</p>

                    {/* Score Display */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Score */}
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Your Score</p>
                            <p className="text-4xl font-black text-slate-900">
                                {correctAnswers}/{totalQuestions}
                            </p>
                            <p className="text-sm text-slate-500 mt-2">{percentage}% Correct</p>
                        </div>

                        {/* Correct Answers */}
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-green-200">
                            <p className="text-sm font-bold text-green-600 uppercase tracking-wider mb-2">Correct</p>
                            <p className="text-4xl font-black text-green-600">{correctAnswers}</p>
                            <p className="text-sm text-green-600 mt-2">Well Done!</p>
                        </div>

                        {/* Incorrect Answers */}
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-red-200">
                            <p className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2">Incorrect</p>
                            <p className="text-4xl font-black text-red-600">{incorrectAnswers}</p>
                            <p className="text-sm text-red-600 mt-2">Review These</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white rounded-full p-2 shadow-inner">
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000 ease-out"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Focus Areas Section */}
                {topicsToFocus.length > 0 && (
                    <div className="bg-white rounded-3xl border border-amber-200 shadow-xl p-8 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertCircle className="text-amber-600" size={28} />
                            <h2 className="text-2xl font-black text-slate-900">Topics to Focus On</h2>
                        </div>
                        <p className="text-slate-600 mb-6">Based on your incorrect answers, review these topics:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {topicsToFocus.map((topic, index) => (
                                <div key={index} className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-center">
                                    <p className="font-bold text-amber-900">{topic}</p>
                                    <p className="text-xs text-amber-700 mt-1">Appeared in wrong answers</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Review Answers Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">Review Your Answers</h2>

                    {/* Filter Tabs */}
                    <div className="flex gap-3 mb-8">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${
                                filterType === 'all'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            All ({questions.length})
                        </button>
                        <button
                            onClick={() => setFilterType('correct')}
                            className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${
                                filterType === 'correct'
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <CheckCircle2 size={16} /> Correct ({correctAnswers})
                        </button>
                        <button
                            onClick={() => setFilterType('incorrect')}
                            className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${
                                filterType === 'incorrect'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <XCircle size={16} /> Incorrect ({incorrectAnswers})
                        </button>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-6 max-h-[600px] overflow-y-auto">
                        {filteredQuestions.map((question, index) => {
                            const isWrong = failedQuestions.some(w => w.questionId === question.id);
                            const userAnswer = failedQuestions.find(w => w.questionId === question.id)?.userAnswer;
                            const correctAnswer = question.correctAnswer;
                            const letters = ['A', 'B', 'C', 'D'];

                            return (
                                <div
                                    key={question.id}
                                    className={`border-2 rounded-2xl p-6 transition-all ${
                                        isWrong
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-green-300 bg-green-50'
                                    }`}
                                >
                                    {/* Question Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {isWrong ? (
                                                    <XCircle className="text-red-600 flex-shrink-0" size={20} />
                                                ) : (
                                                    <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                                                )}
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    Q{questions.indexOf(question) + 1}
                                                </span>
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                                    isWrong
                                                        ? 'bg-red-200 text-red-700'
                                                        : 'bg-green-200 text-green-700'
                                                }`}>
                                                    {isWrong ? 'Incorrect' : 'Correct'}
                                                </span>
                                            </div>
                                            <p className="font-bold text-slate-900 text-lg">{question.question}</p>
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-3 mb-6">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                                            Options
                                        </p>
                                        {question.options && question.options.map((option, optIndex) => {
                                            const isSelectedAnswer = userAnswer === option;
                                            const isCorrectAnswer = correctAnswer === option;

                                            return (
                                                <div
                                                    key={optIndex}
                                                    className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-all ${
                                                        isSelectedAnswer
                                                            ? isWrong
                                                                ? 'border-red-500 bg-red-100'
                                                                : 'border-green-500 bg-green-100'
                                                            : isCorrectAnswer && isWrong
                                                            ? 'border-green-400 bg-green-50'
                                                            : 'border-slate-300 bg-slate-100'
                                                    }`}
                                                >
                                                    {/* Option Letter */}
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                        isSelectedAnswer
                                                            ? isWrong
                                                                ? 'bg-red-600 text-white'
                                                                : 'bg-green-600 text-white'
                                                            : isCorrectAnswer && isWrong
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-slate-400 text-white'
                                                    }`}>
                                                        {letters[optIndex]}
                                                    </div>
                                                    {/* Option Text & Badge */}
                                                    <div className="flex-grow">
                                                        <p className={`text-sm font-medium ${
                                                            isSelectedAnswer
                                                                ? isWrong
                                                                    ? 'text-red-900'
                                                                    : 'text-green-900'
                                                                : 'text-slate-800'
                                                        }`}>
                                                            {option}
                                                        </p>
                                                    </div>
                                                    {/* Badges */}
                                                    <div className="flex gap-2 flex-wrap justify-end">
                                                        {isSelectedAnswer && (
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                                                                isWrong
                                                                    ? 'bg-red-600 text-white'
                                                                    : 'bg-green-600 text-white'
                                                            }`}>
                                                                Your Answer
                                                            </span>
                                                        )}
                                                        {isCorrectAnswer && (
                                                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-600 text-white whitespace-nowrap">
                                                                Correct
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Explanation */}
                                    {question.explanation && (
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                                Explanation
                                            </p>
                                            <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-l-blue-600">
                                                <p className="text-slate-800 text-sm leading-relaxed">{question.explanation}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={onRetry}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        <RefreshCcw size={20} /> Retake Quiz
                    </button>
                    <Link
                        to="/dashboard"
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-600 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-lg"
                    >
                        <Home size={20} /> Go to Library
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default QuizResultsAnalysis;
