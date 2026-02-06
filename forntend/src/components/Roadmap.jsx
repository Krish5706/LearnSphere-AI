import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Map, BookOpen, Target, Brain, Check } from 'lucide-react';

const Roadmap = ({ roadmap, fileName, learnerLevel, onNavigateToTab }) => {
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

    if (!roadmap || roadmap.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-2">
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-2">
            <div className={`bg-gradient-to-r ${currentLevel.gradient} px-8 py-6 border-b border-slate-200 flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
                        <Map size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-lg">LEARNING ROADMAP</h3>
                        <p className="text-xs text-slate-500 font-medium">Personalized study plan</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${currentLevel.bgColor} ${currentLevel.accentColor} border ${currentLevel.borderColor}`}>
                        {currentLevel.badge}
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="mb-6">
                    <p className="text-sm text-slate-600">{currentLevel.description}</p>
                    <p className="text-sm text-slate-600 mt-1">Follow this step-by-step guide to master the content in <strong>{fileName}</strong></p>
                </div>

                <div className="space-y-6">
                    {roadmap.map((step, index) => (
                        <div key={step.step || index} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                            <div className="flex items-start gap-4">
                                {/* Step Number */}
                                <div className={`flex-shrink-0 w-12 h-12 ${currentLevel.bgColor} ${currentLevel.accentColor} rounded-full flex items-center justify-center font-bold text-sm border-2 ${currentLevel.borderColor} shadow-sm`}>
                                    {step.step || index + 1}
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-bold text-slate-900 text-lg">{step.title}</h4>
                                        {step.estimatedTime && (
                                            <div className="flex items-center gap-1 text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                                                <Map size={14} />
                                                {step.estimatedTime}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-slate-700 mb-4 leading-relaxed">
                                        <ReactMarkdown>{step.description}</ReactMarkdown>
                                    </div>

                                    {/* Resources */}
                                    {step.resources && step.resources.length > 0 && (
                                        <div className="mb-4">
                                            <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                                <Check size={16} className="text-green-500" />
                                                Resources:
                                            </h5>
                                            <ul className="space-y-1 ml-6">
                                                {step.resources.map((resource, idx) => (
                                                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                                        <span className="text-blue-500 mt-1">•</span>
                                                        {resource}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Link to website page */}
                                    {step.link && (
                                        <div className="pt-3 border-t border-slate-200">
                                            <button
                                                onClick={() => {
                                                    // Handle navigation to different sections
                                                    if (step.link === '/summary') {
                                                        onNavigateToTab('summary');
                                                    } else if (step.link === '/quiz') {
                                                        onNavigateToTab('quiz');
                                                    }
                                                }}
                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                                            >
                                                <Map size={14} />
                                                View Related Content
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-8 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Map size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        AI-Generated Roadmap
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Roadmap;
