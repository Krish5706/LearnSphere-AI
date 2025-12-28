import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Clock, BarChart3 } from 'lucide-react';

const QuizPage = ({ questions, documentId, onSubmit, isLoading }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [showTimer, setShowTimer] = useState(true);

    // Timer for the entire quiz
    useEffect(() => {
        if (!questions || questions.length === 0) return;
        
        const totalSeconds = questions.length * 60; // 1 minute per question
        setTimeLeft(totalSeconds);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitQuiz(); // Auto-submit when time runs out
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [questions]);

    const formatTime = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId, option) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [questionId]: option
        });
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        // Convert selected answers to the format expected by backend
        const answers = Object.entries(selectedAnswers).map(([questionId, selectedAnswer]) => ({
            questionId,
            selectedAnswer
        }));

        await onSubmit({
            documentId,
            answers
        });
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 rounded-3xl p-8">
                <BarChart3 size={48} className="text-slate-400 mb-4" />
                <p className="text-slate-500 font-medium">No questions available</p>
            </div>
        );
    }

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const isAnswered = selectedAnswers[question.id];
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-black text-slate-900">
                            Question {currentQuestion + 1} of {questions.length}
                        </h1>
                        {showTimer && timeLeft !== null && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold ${
                                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                <Clock size={18} />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-slate-100">
                    {/* Question Text */}
                    <div className="mb-8">
                        <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-4">
                            Question {currentQuestion + 1}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 leading-relaxed">
                            {question.question}
                        </h2>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                        {question.options && question.options.map((option, index) => {
                            const isSelected = selectedAnswers[question.id] === option;
                            const letters = ['A', 'B', 'C', 'D'];
                            
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(question.id, option)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                    {/* Option Letter */}
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mt-1 ${
                                        isSelected
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {letters[index]}
                                    </div>
                                    {/* Option Text */}
                                    <div className="flex-grow">
                                        <p className={`font-medium ${
                                            isSelected ? 'text-blue-900' : 'text-slate-800'
                                        }`}>
                                            {option}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Question Info */}
                    {question.explanation && (
                        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hint</p>
                            <p className="text-slate-700 text-sm">{question.explanation.substring(0, 100)}...</p>
                        </div>
                    )}
                </div>

                {/* Navigation Controls */}
                <div className="flex justify-between items-center gap-4">
                    {/* Previous Button */}
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                            currentQuestion === 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-600 text-white hover:bg-slate-700 shadow-lg'
                        }`}
                    >
                        <ChevronLeft size={20} />
                        Previous
                    </button>

                    {/* Question Indicators */}
                    <div className="flex gap-2 flex-wrap justify-center max-w-xs">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestion(index)}
                                className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                                    index === currentQuestion
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : selectedAnswers[questions[index].id]
                                        ? 'bg-green-500 text-white'
                                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                                title={`Question ${index + 1}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    {/* Next/Submit Button */}
                    {currentQuestion < questions.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            Next
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmitQuiz}
                            disabled={isLoading || answeredCount === 0}
                            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all ${
                                isLoading || answeredCount === 0
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'
                            }`}
                        >
                            {isLoading ? 'Submitting...' : `Submit Quiz (${answeredCount}/${questions.length})`}
                        </button>
                    )}
                </div>

                {/* Quiz Stats */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                        <p className="text-sm text-slate-500 font-bold mb-1">ANSWERED</p>
                        <p className="text-2xl font-black text-blue-600">{answeredCount}/{questions.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                        <p className="text-sm text-slate-500 font-bold mb-1">CURRENT</p>
                        <p className="text-2xl font-black text-purple-600">{currentQuestion + 1}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                        <p className="text-sm text-slate-500 font-bold mb-1">PROGRESS</p>
                        <p className="text-2xl font-black text-green-600">{Math.round(progress)}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
