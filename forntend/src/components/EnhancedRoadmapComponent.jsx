import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Map, BookOpen, Target, Brain, Check, Lock, Play, Zap, Trophy, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const EnhancedRoadmapComponent = ({ roadmap, fileName, learnerLevel, onStartModuleQuiz, onStartPhaseQuiz, onStartFinalQuiz }) => {
    const [expandedPhases, setExpandedPhases] = useState(new Set([0]));

    // Level configurations
    const levelConfigs = {
        beginner: {
            badge: 'Beginner',
            description: 'Focus on fundamental concepts, basic principles, and introductory topics',
            bgColor: 'bg-green-100',
            accentColor: 'text-green-600',
            borderColor: 'border-green-200',
            icon: BookOpen,
            gradient: 'from-green-50 to-emerald-50'
        },
        intermediate: {
            badge: 'Intermediate',
            description: 'Build on basic knowledge with advanced topics, practical applications, and deeper analysis',
            bgColor: 'bg-yellow-100',
            accentColor: 'text-yellow-600',
            borderColor: 'border-yellow-200',
            icon: Target,
            gradient: 'from-yellow-50 to-amber-50'
        },
        advanced: {
            badge: 'Advanced',
            description: 'Cover expert-level analysis, research topics, cutting-edge developments, and complex applications',
            bgColor: 'bg-blue-100',
            accentColor: 'text-blue-600',
            borderColor: 'border-blue-200',
            icon: Brain,
            gradient: 'from-blue-50 to-indigo-50'
        }
    };

    const currentLevel = levelConfigs[learnerLevel] || levelConfigs.beginner;
    const phases = roadmap?.learningPath || [];
    const quizStats = roadmap?.quizStatistics;
    const mainTopics = roadmap?.mainTopics || [];

    const togglePhase = (idx) => {
        const newSet = new Set(expandedPhases);
        if (newSet.has(idx)) {
            newSet.delete(idx);
        } else {
            newSet.add(idx);
        }
        setExpandedPhases(newSet);
    };

    if (!roadmap || !phases || phases.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className={`bg-gradient-to-r ${currentLevel.gradient} px-8 py-6 border-b border-slate-200`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
                            <Map size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg">LEARNING ROADMAP</h3>
                            <p className="text-xs text-slate-500 font-medium">Personalized study plan</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Map size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Roadmap Available</h3>
                        <p className="text-slate-500">Generate a learning roadmap to see your personalized study plan.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                <div className={`bg-gradient-to-r ${currentLevel.gradient} px-8 py-6 border-b border-slate-200`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
                                <Map size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-lg">LEARNING ROADMAP WITH ASSESSMENT</h3>
                                <p className="text-xs text-slate-500 font-medium">Complete learning path with integrated quizzes</p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-xs font-bold ${currentLevel.bgColor} ${currentLevel.accentColor} border ${currentLevel.borderColor}`}>
                            {currentLevel.badge}
                        </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2">{currentLevel.description}</p>
                    <p className="text-sm text-slate-600"><strong>{fileName}</strong> - {phases.length} phases, {quizStats?.totalModuleQuizzes || 0} module quizzes, {quizStats?.totalPhaseQuizzes || 0} phase assessments</p>
                </div>

                {/* Quiz Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <BookOpen size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-600 font-semibold">TOTAL PHASES</p>
                            <p className="text-2xl font-bold text-slate-900">{phases.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Zap size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-600 font-semibold">MODULE QUIZZES</p>
                            <p className="text-2xl font-bold text-slate-900">{quizStats?.totalModuleQuizzes || 0} × 12 MCQs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Target size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-600 font-semibold">PHASE ASSESSMENTS</p>
                            <p className="text-2xl font-bold text-slate-900">{phases.length} × 30 MCQs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Trophy size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-600 font-semibold">FINAL ASSESSMENT</p>
                            <p className="text-2xl font-bold text-slate-900">30 MCQs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Phases */}
            <div className="space-y-4">
                {phases.map((phase, phaseIdx) => {
                    const isExpanded = expandedPhases.has(phaseIdx);
                    const modules = phase.modules || [];
                    const moduleQuizzes = phase.quizzes?.moduleQuizzes || [];
                    const phaseQuiz = phase.quizzes?.phaseQuiz;

                    return (
                        <div key={phaseIdx} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:shadow-lg transition-all">
                            {/* Phase Header */}
                            <button
                                onClick={() => togglePhase(phaseIdx)}
                                className="w-full p-6 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 border-b border-slate-200 flex items-center justify-between transition-colors"
                            >
                                <div className="flex items-start gap-4 text-left">
                                    <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                                        phaseIdx === 0 ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                        phaseIdx === phases.length - 1 ? 'bg-purple-100 text-purple-700 border-purple-300' :
                                        'bg-indigo-100 text-indigo-700 border-indigo-300'
                                    }`}>
                                        {phaseIdx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900">{phase.phaseName}</h3>
                                        <p className="text-sm text-slate-600 mt-1">{phase.phaseDescription}</p>
                                        <div className="flex items-center gap-3 mt-3 text-xs font-semibold text-slate-500">
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{modules.length} Modules</span>
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">{moduleQuizzes.length} Quizzes</span>
                                            <span>🎯 {phase.estimatedDuration}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-slate-600">Progress</p>
                                        <p className="text-lg font-bold text-slate-900">0%</p>
                                    </div>
                                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="p-6 space-y-6">
                                    {/* Phase Objective */}
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                                        <p className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
                                            <Target size={16} className="text-blue-600" />
                                            Phase Objective
                                        </p>
                                        <p className="text-slate-700 text-sm ml-6">{phase.phaseObjective}</p>
                                    </div>

                                    {/* Modules */}
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <BookOpen size={18} />
                                            Learning Modules ({modules.length})
                                        </h4>

                                        <div className="space-y-4">
                                            {modules.map((module, modIdx) => {
                                                const moduleQuiz = moduleQuizzes[modIdx];

                                                return (
                                                    <div key={modIdx} className="bg-slate-50 rounded-xl p-5 border-2 border-slate-200 hover:border-blue-300 transition-colors">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h5 className="font-bold text-slate-900">{module.moduleTitle}</h5>
                                                                <p className="text-sm text-slate-600 mt-1">{module.moduleDescription}</p>
                                                            </div>
                                                            <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                                                                {module.difficulty}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                                                            <div>
                                                                <p className="text-slate-600 font-semibold mb-1">Topics Covered:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {module.topicsCovered?.slice(0, 2).map((topic, idx) => (
                                                                        <span key={idx} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                                                                            {topic}
                                                                        </span>
                                                                    ))}
                                                                    {module.topicsCovered?.length > 2 && (
                                                                        <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs">
                                                                            +{module.topicsCovered.length - 2} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-600 font-semibold mb-1">Duration:</p>
                                                                <p className="text-slate-900 font-bold">{module.estimatedTime}</p>
                                                            </div>
                                                        </div>

                                                        {/* Module Quiz Button */}
                                                        <button
                                                            onClick={() => onStartModuleQuiz?.(phase, module)}
                                                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                                                        >
                                                            <Play size={16} />
                                                            Start Module Quiz (12 MCQs)
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Phase Assessment Quiz */}
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-2">
                                                    <Trophy size={20} className="text-purple-600" />
                                                    Phase Comprehensive Assessment
                                                </h4>
                                                <p className="text-sm text-slate-700">
                                                    Complete this 30-question assessment after finishing all modules in this phase. Tests synthesis of all topics covered.
                                                </p>
                                            </div>
                                            <span className="bg-purple-100 text-purple-700 font-bold px-4 py-2 rounded-lg text-sm">
                                                30 MCQs
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => onStartPhaseQuiz?.(phase)}
                                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Trophy size={18} />
                                            Start Phase Assessment
                                        </button>
                                    </div>

                                    {/* Phase Topics Summary */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <p className="font-bold text-slate-900 mb-3 text-sm uppercase text-slate-600">Key Topics in This Phase</p>
                                        <div className="flex flex-wrap gap-2">
                                            {module.topicsCovered?.map((topic, idx) => (
                                                <span
                                                    key={idx}
                                                    className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200"
                                                >
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Final Assessment */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-amber-300 shadow-lg">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-amber-700 font-bold uppercase text-sm mb-2">🏆 Final Achievement</p>
                        <h3 className="text-3xl font-black text-slate-900 mb-3">Final Comprehensive Assessment</h3>
                        <p className="text-slate-700 mb-4">
                            After completing all phases, take this final 30-question comprehensive assessment covering the entire curriculum. 
                            Master all topics to earn your completion certificate!
                        </p>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-slate-600 font-semibold">Total Questions</p>
                                <p className="text-2xl font-bold text-orange-600">30</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-semibold">Coverage</p>
                                <p className="text-2xl font-bold text-orange-600">{mainTopics.length} Topics</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-semibold">Difficulty</p>
                                <p className="text-2xl font-bold text-orange-600">Mixed</p>
                            </div>
                        </div>
                        <button
                            onClick={onStartFinalQuiz}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all text-lg"
                        >
                            <Trophy size={20} />
                            Start Final Assessment
                        </button>
                    </div>
                    <div className="text-6xl opacity-20 ml-8">🎓</div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
                <p className="font-bold text-slate-900 mb-4">How Quizzes Work</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Play size={16} className="text-blue-600" />
                            </div>
                            <p className="font-semibold text-slate-900">Module Quizzes</p>
                        </div>
                        <p className="text-sm text-slate-600">12 MCQs per module testing concepts of that specific module. Recommended after completing each module.</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Trophy size={16} className="text-purple-600" />
                            </div>
                            <p className="font-semibold text-slate-900">Phase Assessments</p>
                        </div>
                        <p className="text-sm text-slate-600">30 MCQs covering all topics in the phase. Take after completing all modules to validate phase mastery.</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Trophy size={16} className="text-orange-600" />
                            </div>
                            <p className="font-semibold text-slate-900">Final Assessment</p>
                        </div>
                        <p className="text-sm text-slate-600">30 MCQs covering entire curriculum. Complete all phases first to unlock this comprehensive final evaluation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedRoadmapComponent;
