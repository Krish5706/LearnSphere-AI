import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, XCircle, Award } from 'lucide-react';
import api from '../../services/api';

const QuizResultAnalysis = ({ quizAnalysis, documentId, quizzes, onDownloadReport }) => {
    if (!quizAnalysis) return null;

    const { score, totalQuestions, percentage, performanceLevel, feedback, topicsToFocus, answeredQuestions } = quizAnalysis;

    // Get color based on performance
    const getPerformanceColor = () => {
        if (percentage >= 90) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100' };
        if (percentage >= 75) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100' };
        if (percentage >= 60) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100' };
        return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100' };
    };

    const colors = getPerformanceColor();
    const isGoodScore = percentage >= 75;

    return (
        <div className="space-y-6">
            {/* Score Card */}
            <div className={`${colors.bg} border-2 ${colors.border} rounded-3xl p-8`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className={`text-sm font-bold uppercase tracking-widest ${colors.text} mb-2`}>
                            Your Performance
                        </p>
                        <p className={`text-5xl font-black ${colors.text}`}>
                            {percentage}%
                        </p>
                    </div>
                    <div className="w-32 h-32 rounded-full bg-white border-4 border-current flex items-center justify-center text-center relative" style={{ borderColor: colors.text }}>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{score}</p>
                            <p className="text-xs text-slate-500 font-bold">of {totalQuestions}</p>
                        </div>
                    </div>
                </div>

                <div className={`${colors.badge} ${colors.text} px-4 py-2 rounded-xl inline-block font-bold text-sm mb-4`}>
                    {performanceLevel}
                </div>

                <p className={`${colors.text} text-sm leading-relaxed font-semibold`}>
                    {feedback}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-green-600">{answeredQuestions?.filter(q => q.isCorrect).length || 0}</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">Correct Answers</p>
                </div>
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-red-600">{answeredQuestions?.filter(q => !q.isCorrect).length || 0}</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">Wrong Answers</p>
                </div>
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-blue-600">{totalQuestions}</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">Total Questions</p>
                </div>
            </div>

            {/* Areas for Improvement */}
            {topicsToFocus && topicsToFocus.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Target className="text-amber-600" size={24} />
                        <h3 className="text-lg font-black text-amber-900">Areas to Focus On</h3>
                    </div>
                    <div className="space-y-3">
                        {topicsToFocus.map((topic, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 border border-amber-100">
                                <p className="font-bold text-slate-900">{idx + 1}. {topic.topic}</p>
                                <p className="text-sm text-slate-600 mt-1">{topic.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Question Review */}
            {answeredQuestions && answeredQuestions.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-900">Question Review</h3>
                    {answeredQuestions.map((q, idx) => (
                        <div key={idx} className={`rounded-2xl border-2 overflow-hidden ${q.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="p-6">
                                <div className="flex items-start gap-3 mb-4">
                                    {q.isCorrect ? (
                                        <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                                    ) : (
                                        <XCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">Question {idx + 1}</p>
                                        <p className="text-slate-700 font-semibold mt-2">{q.question}</p>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-2 ml-8 mb-4">
                                    {q.options.map((option, optIdx) => {
                                        const isUserAnswer = option === q.userAnswer;
                                        const isCorrectAnswer = option === q.correctAnswer;
                                        
                                        let optionClass = 'bg-white border border-slate-200';
                                        if (isCorrectAnswer) optionClass = 'bg-green-100 border-2 border-green-500';
                                        if (isUserAnswer && !isCorrectAnswer) optionClass = 'bg-red-100 border-2 border-red-500';

                                        return (
                                            <div key={optIdx} className={`p-3 rounded-lg ${optionClass}`}>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-slate-700">{option}</p>
                                                    <div className="text-xs font-bold flex gap-2">
                                                        {isUserAnswer && <span className="text-slate-600">← Your answer</span>}
                                                        {isCorrectAnswer && <span className="text-green-700">✓ Correct</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Explanation */}
                                <div className="ml-8 p-4 bg-white rounded-lg border border-slate-200">
                                    <p className="text-xs font-bold text-slate-600 mb-1">EXPLANATION</p>
                                    <p className="text-sm text-slate-700">{q.explanation}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recommendations */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="font-black text-blue-900 mb-2">Recommendations</h3>
                        <ul className="text-sm text-blue-800 space-y-2">
                            {isGoodScore ? (
                                <>
                                    <li>✓ Great understanding of the material!</li>
                                    <li>✓ Focus on the highlighted areas to reach mastery.</li>
                                    <li>✓ Consider teaching others to deepen your knowledge.</li>
                                </>
                            ) : (
                                <>
                                    <li>• Review the material focusing on weak areas.</li>
                                    <li>• Re-read sections related to incorrect answers.</li>
                                    <li>• Try the quiz again after studying the problem areas.</li>
                                    <li>• Use the summaries and mind maps for better understanding.</li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Download Report Button */}
            <button
                onClick={() => onDownloadReport('quiz')}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:shadow-lg shadow-blue-200 transition-all"
            >
                <Award size={20} />
                Download Quiz Report as PDF
            </button>
        </div>
    );
};

export default QuizResultAnalysis;
