import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Zap, Target, BarChart3, CheckCircle2, AlertCircle, Lock, BookOpen } from 'lucide-react';
import axios from 'axios';

const ScoreTracker = ({ roadmapId, onPhaseQuizClick, onFinalQuizClick }) => {
    const [scoreData, setScoreData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchScoreTracker();
    }, [roadmapId]);

    const fetchScoreTracker = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/quizzes/tracker/${roadmapId}`);
            setScoreData(response.data.data);
        } catch (err) {
            console.error('Error fetching score tracker:', err);
            setError('Failed to load score tracker');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-slate-600">Loading score tracker...</div>;
    }

    if (error) {
        return <div className="text-center py-12 text-red-600">{error}</div>;
    }

    if (!scoreData) {
        return <div className="text-center py-12 text-slate-600">No score data available</div>;
    }

    const overallScore = scoreData.overallScore || 0;
    const totalQuestionsAttempted = scoreData.totalQuestionsAttempted || 0;
    const totalQuestionsCorrect = scoreData.totalQuestionsCorrect || 0;
    const averageAccuracy = scoreData.averageAccuracy || 0;
    const phaseScores = scoreData.phaseScores || [];
    const completedPhases = scoreData.learningProgress?.completedPhases || 0;
    const totalPhases = phaseScores.length;

    const getScoreColor = (score) => {
        if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
        if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
    };

    const getScoreBadge = (score) => {
        if (score >= 90) return { icon: '⭐', label: 'Excellent', color: 'text-blue-600' };
        if (score >= 75) return { icon: '👍', label: 'Good', color: 'text-green-600' };
        if (score >= 60) return { icon: '✓', label: 'Satisfactory', color: 'text-yellow-600' };
        return { icon: '⚠️', label: 'Needs Improvement', color: 'text-red-600' };
    };

    return (
        <div className="space-y-6">
            {/* Overall Score Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-blue-100 text-sm font-semibold mb-2">OVERALL LEARNING SCORE</p>
                        <div className="flex items-baseline gap-3 mb-2">
                            <span className="text-6xl font-black">{overallScore}</span>
                            <span className="text-2xl text-blue-100">/100</span>
                        </div>
                        <p className="text-blue-100 text-sm">Based on all quiz attempts</p>
                    </div>
                    <div className="text-6xl opacity-20">{getScoreBadge(overallScore).icon}</div>
                </div>

                {/* Progress bar */}
                <div className="bg-white/20 rounded-full h-3 mb-4">
                    <div
                        className="bg-white h-3 rounded-full transition-all duration-500"
                        style={{ width: `${overallScore}%` }}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-blue-100 text-xs mb-1">QUESTIONS CORRECT</p>
                        <p className="text-2xl font-bold">{totalQuestionsCorrect}/{totalQuestionsAttempted}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-blue-100 text-xs mb-1">ACCURACY</p>
                        <p className="text-2xl font-bold">{averageAccuracy}%</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-blue-100 text-xs mb-1">PHASES COMPLETED</p>
                        <p className="text-2xl font-bold">{completedPhases}/{totalPhases}</p>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TrendingUp size={20} className="text-blue-600" />
                        </div>
                        <p className="text-slate-600 text-sm font-semibold">Learning Progress</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{Math.round((completedPhases / totalPhases) * 100)}%</p>
                    <p className="text-xs text-slate-500 mt-2">{completedPhases} of {totalPhases} phases</p>
                </div>

                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Award size={20} className="text-green-600" />
                        </div>
                        <p className="text-slate-600 text-sm font-semibold">Best Performance</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{overallScore}%</p>
                    <p className="text-xs text-slate-500 mt-2">Highest score achieved</p>
                </div>

                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Zap size={20} className="text-purple-600" />
                        </div>
                        <p className="text-slate-600 text-sm font-semibold">Questions Answered</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{totalQuestionsAttempted}</p>
                    <p className="text-xs text-slate-500 mt-2">Across all quizzes</p>
                </div>

                <div className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Target size={20} className="text-orange-600" />
                        </div>
                        <p className="text-slate-600 text-sm font-semibold">Accuracy Rate</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{averageAccuracy}%</p>
                    <p className="text-xs text-slate-500 mt-2">Overall accuracy</p>
                </div>
            </div>

            {/* Phase-wise Breakdown */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b-2 border-slate-200">
                    <div className="flex items-center gap-3">
                        <BarChart3 size={24} className="text-slate-700" />
                        <h3 className="text-xl font-bold text-slate-900">Phase-wise Performance</h3>
                    </div>
                </div>

                <div className="divide-y-2 divide-slate-100">
                    {phaseScores.map((phase, idx) => {
                        const phaseScore = phase.phaseScore || 0;
                        const scoreColor = getScoreColor(phaseScore);
                        const modulesCompleted = phase.moduleQuizzes?.filter(mq => mq.score).length || 0;

                        return (
                            <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                                {/* Phase Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${scoreColor.bg} ${scoreColor.text}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900">{phase.phaseName}</h4>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {modulesCompleted} of {phase.moduleQuizzes?.length} modules completed
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`text-right ${scoreColor.text}`}>
                                        <p className="text-3xl font-black">{phaseScore}</p>
                                        <p className="text-xs font-semibold">/100</p>
                                    </div>
                                </div>

                                {/* Module Quizzes */}
                                {phase.moduleQuizzes?.length > 0 && (
                                    <div className="mb-4 pl-16">
                                        <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Module Quizzes</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {phase.moduleQuizzes.map((mq, modIdx) => (
                                                <div key={modIdx} className="bg-slate-100 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-slate-700 truncate">{mq.moduleName}</p>
                                                    {mq.score ? (
                                                        <div className="mt-2">
                                                            <p className="text-xl font-bold text-slate-900">{mq.percentageScore}%</p>
                                                            <p className="text-xs text-slate-600">{mq.correctAnswers}/{mq.totalQuestions}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-500 mt-2 italic">Not attempted</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Phase Overall Quiz */}
                                <div className="border-t border-slate-200 pt-4">
                                    {phase.phaseOverallQuiz ? (
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 size={20} className="text-green-600" />
                                                    <div>
                                                        <p className="font-bold text-slate-900">Phase Comprehensive Assessment</p>
                                                        <p className="text-sm text-slate-600">{phase.phaseOverallQuiz.correctAnswers}/{phase.phaseOverallQuiz.totalQuestions} correct</p>
                                                    </div>
                                                </div>
                                                <p className="text-2xl font-bold text-green-600">{phase.phaseOverallQuiz.percentageScore}%</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => onPhaseQuizClick?.(phase)}
                                            className="w-full bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 rounded-lg p-4 text-left transition-colors group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Lock size={20} className="text-indigo-600" />
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-indigo-700">Phase Comprehensive Assessment</p>
                                                        <p className="text-sm text-slate-600">Take the 30-question assessment</p>
                                                    </div>
                                                </div>
                                                <span className="text-indigo-600 font-bold">Start →</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Final Assessment */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-8 border-2 border-purple-400">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-purple-100 text-sm font-semibold uppercase mb-2">🏆 Final Assessment</p>
                        <h3 className="text-3xl font-bold mb-2">Complete Your Learning Journey</h3>
                        <p className="text-purple-100 mb-4">
                            You've completed all phases! Take the final 30-question comprehensive assessment to validate your mastery of the entire curriculum and earn your completion certificate.
                        </p>
                        {scoreData.finalAssessment?.status === 'completed' ? (
                            <div className="inline-block bg-white/20 px-6 py-3 rounded-lg">
                                <p className="text-sm font-semibold">Final Score: <span className="text-2xl font-black">{scoreData.finalAssessment.percentageScore}%</span></p>
                                <p className="text-xs text-purple-100 mt-1">Completed on {new Date(scoreData.finalAssessment.completedAt).toLocaleDateString()}</p>
                            </div>
                        ) : completedPhases === totalPhases ? (
                            <button
                                onClick={onFinalQuizClick}
                                className="inline-block bg-white text-purple-600 hover:bg-purple-50 font-bold px-8 py-3 rounded-lg transition-colors"
                            >
                                Take Final Assessment →
                            </button>
                        ) : (
                            <div className="inline-block bg-white/20 px-6 py-3 rounded-lg">
                                <p className="text-sm font-semibold">Complete all phases first!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
                <p className="text-xs font-semibold text-slate-600 uppercase mb-4">Score Interpretation</p>
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <div className="h-4 bg-green-500 rounded-full mb-2"></div>
                        <p className="text-xs font-semibold text-slate-900">90-100: Excellent</p>
                    </div>
                    <div>
                        <div className="h-4 bg-yellow-500 rounded-full mb-2"></div>
                        <p className="text-xs font-semibold text-slate-900">75-89: Good</p>
                    </div>
                    <div>
                        <div className="h-4 bg-orange-500 rounded-full mb-2"></div>
                        <p className="text-xs font-semibold text-slate-900">60-74: Satisfactory</p>
                    </div>
                    <div>
                        <div className="h-4 bg-red-500 rounded-full mb-2"></div>
                        <p className="text-xs font-semibold text-slate-900">Below 60: Review Needed</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreTracker;
