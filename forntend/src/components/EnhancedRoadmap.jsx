import React, { useState } from 'react';
import { 
    Map, 
    BookOpen, 
    Target, 
    Brain, 
    Check, 
    ChevronDown, 
    ChevronUp,
    Clock,
    Zap,
    Award,
    ArrowRight,
    AlertCircle,
    Download,
    Share2
} from 'lucide-react';
import roadmapService from '../services/roadmapService';

const EnhancedRoadmap = ({ enhancedRoadmap, fileName, learnerLevel, documentId, onNavigateToTab, onProgressUpdate }) => {
    const [expandedPhases, setExpandedPhases] = useState({});
    const [expandedModules, setExpandedModules] = useState({});
    const [expandedLessons, setExpandedLessons] = useState({});
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [completedLessons, setCompletedLessons] = useState(
        enhancedRoadmap?.progressTracking?.completedLessons || []
    );
    const [isExporting, setIsExporting] = useState(false);

    // Level configurations
    const levelConfigs = {
        beginner: {
            badge: 'Beginner',
            color: 'green',
            bgColor: 'bg-green-100',
            accentColor: 'text-green-600',
            borderColor: 'border-green-200',
            lightBg: 'bg-green-50',
            gradient: 'from-green-50 to-emerald-50'
        },
        intermediate: {
            badge: 'Intermediate',
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            accentColor: 'text-yellow-600',
            borderColor: 'border-yellow-200',
            lightBg: 'bg-yellow-50',
            gradient: 'from-yellow-50 to-amber-50'
        },
        advanced: {
            badge: 'Advanced',
            color: 'blue',
            bgColor: 'bg-blue-100',
            accentColor: 'text-blue-600',
            borderColor: 'border-blue-200',
            lightBg: 'bg-blue-50',
            gradient: 'from-blue-50 to-indigo-50'
        }
    };

    const currentLevel = levelConfigs[learnerLevel] || levelConfigs.beginner;

    const togglePhase = (phaseId) => {
        setExpandedPhases(prev => ({
            ...prev,
            [phaseId]: !prev[phaseId]
        }));
    };

    const toggleModule = (moduleId) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const toggleLesson = (lessonId) => {
        setExpandedLessons(prev => ({
            ...prev,
            [lessonId]: !prev[lessonId]
        }));
    };

    const getDifficultyColor = (difficulty) => {
        switch(difficulty) {
            case 'easy': return 'bg-green-100 text-green-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'hard': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getImportanceIcon = (importance) => {
        switch(importance) {
            case 'critical': return <Zap size={16} className="text-red-500" />;
            case 'important': return <AlertCircle size={16} className="text-orange-500" />;
            default: return <BookOpen size={16} className="text-blue-500" />;
        }
    };

    // Handle marking lesson as complete
    const handleMarkLessonComplete = async (lessonId, phaseId, moduleId) => {
        if (completedLessons.includes(lessonId)) {
            // Remove from completed
            setCompletedLessons(prev => prev.filter(id => id !== lessonId));
        } else {
            // Add to completed
            setCompletedLessons(prev => [...prev, lessonId]);
        }

        // If documentId is provided, sync with backend
        if (documentId) {
            try {
                const result = await roadmapService.updateProgress(documentId, {
                    lessonId,
                    phaseId,
                    moduleId
                });
                if (onProgressUpdate) {
                    onProgressUpdate(result.progress);
                }
            } catch (error) {
                console.error('Error updating progress:', error);
            }
        }
    };

    // Handle exporting roadmap
    const handleDownloadRoadmap = async () => {
        if (!documentId) {
            alert('Document ID not found');
            return;
        }
        
        setIsExporting(true);
        try {
            await roadmapService.downloadRoadmap(documentId, fileName, 'markdown');
        } catch (error) {
            console.error('Error downloading roadmap:', error);
            alert('Failed to download roadmap');
        } finally {
            setIsExporting(false);
        }
    };

    if (!enhancedRoadmap) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Map size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Roadmap Available</h3>
                    <p className="text-slate-500">Generate a learning roadmap to see your personalized study plan.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${currentLevel.gradient} px-8 py-6 border-b border-slate-200`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${currentLevel.bgColor} rounded-xl shadow-lg`}>
                            <Map size={24} className={currentLevel.accentColor} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-xl">COMPREHENSIVE LEARNING ROADMAP</h3>
                            <p className="text-sm text-slate-500 font-medium">Structured path with topics, phases & progress tracking</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadRoadmap}
                            disabled={isExporting}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                isExporting
                                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                                    : 'bg-white text-slate-900 hover:bg-slate-100 shadow-sm'
                            }`}
                        >
                            <Download size={16} />
                            {isExporting ? 'Exporting...' : 'Download'}
                        </button>
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${currentLevel.bgColor} ${currentLevel.accentColor} border ${currentLevel.borderColor}`}>
                            {currentLevel.badge}
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 border-t border-slate-200 pt-4">
                    {[
                        { id: 'overview', label: 'Overview', icon: Map },
                        { id: 'topics', label: 'Topics', icon: Brain },
                        { id: 'path', label: 'Learning Path', icon: BookOpen },
                        { id: 'timeline', label: 'Timeline', icon: Clock },
                        { id: 'outcomes', label: 'Outcomes', icon: Award }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                activeTab === tab.id
                                    ? `${currentLevel.bgColor} ${currentLevel.accentColor}`
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={20} className={currentLevel.accentColor} />
                                    <h4 className="font-bold text-slate-900">Total Duration</h4>
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    {enhancedRoadmap.studyTimeline?.totalEstimatedHours || 24} hours
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    {enhancedRoadmap.studyTimeline?.recommendedPacePerWeek || '4-6 hours/week'}
                                </p>
                            </div>

                            <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen size={20} className={currentLevel.accentColor} />
                                    <h4 className="font-bold text-slate-900">Learning Phases</h4>
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    {enhancedRoadmap.learningPath?.length || 0}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">Structured progression</p>
                            </div>

                            <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Target size={20} className={currentLevel.accentColor} />
                                    <h4 className="font-bold text-slate-900">Progress</h4>
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    {enhancedRoadmap.progressTracking?.overallProgress || 0}%
                                </p>
                                <p className="text-sm text-slate-600 mt-1">of roadmap completed</p>
                            </div>
                        </div>

                        <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <AlertCircle size={20} className={currentLevel.accentColor} />
                                About This Roadmap
                            </h4>
                            <p className="text-slate-700 mb-3">
                                This is a comprehensive learning roadmap for <strong>{fileName}</strong> tailored for <strong>{currentLevel.badge}</strong> level learners.
                            </p>
                            <p className="text-slate-600 text-sm">
                                Follow the structured phases, complete lessons and assessments, and track your progress as you master the content.
                            </p>
                        </div>
                    </div>
                )}

                {/* Topics Tab */}
                {activeTab === 'topics' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Main Topics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {enhancedRoadmap.mainTopics?.map((topic, idx) => (
                                <div
                                    key={topic.id || idx}
                                    onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                                    className={`rounded-xl p-6 border-2 cursor-pointer transition-all ${
                                        selectedTopic?.id === topic.id
                                            ? `${currentLevel.borderColor} bg-blue-50`
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {getImportanceIcon(topic.importance)}
                                            <h4 className="font-bold text-slate-900">{topic.name}</h4>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getDifficultyColor(topic.difficulty)}`}>
                                            {topic.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-3">{topic.description}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`px-3 py-1 rounded-full font-semibold ${currentLevel.bgColor} ${currentLevel.accentColor}`}>
                                            {topic.importance}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Learning Path Tab */}
                {activeTab === 'path' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Learning Path</h3>
                        {enhancedRoadmap.learningPath?.map((phase, phaseIdx) => (
                            <div key={phase.phaseId} className="border border-slate-200 rounded-2xl overflow-hidden">
                                {/* Phase Header */}
                                <button
                                    onClick={() => togglePhase(phase.phaseId)}
                                    className={`w-full px-6 py-4 flex items-center justify-between ${currentLevel.lightBg} border-b border-slate-200 hover:bg-opacity-70 transition-all`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${currentLevel.bgColor}`}>
                                            {phaseIdx + 1}
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-slate-900">{phase.phaseName}</h4>
                                            <p className="text-sm text-slate-600">{phase.estimatedDuration}</p>
                                        </div>
                                    </div>
                                    {expandedPhases[phase.phaseId] ? (
                                        <ChevronUp size={20} className="text-slate-600" />
                                    ) : (
                                        <ChevronDown size={20} className="text-slate-600" />
                                    )}
                                </button>

                                {/* Phase Content */}
                                {expandedPhases[phase.phaseId] && (
                                    <div className="p-6 space-y-4">
                                        <div className="mb-4">
                                            <p className="text-slate-700 font-semibold mb-2">Objective:</p>
                                            <p className="text-slate-600">{phase.phaseObjective}</p>
                                        </div>

                                        {/* Modules */}
                                        <div className="space-y-3">
                                            {phase.modules?.map((module, modIdx) => (
                                                <div key={module.moduleId} className="border border-slate-200 rounded-xl overflow-hidden">
                                                    {/* Module Header */}
                                                    <button
                                                        onClick={() => toggleModule(module.moduleId)}
                                                        className="w-full px-5 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-all"
                                                    >
                                                        <div className="flex items-center gap-3 text-left">
                                                            <BookOpen size={18} className={currentLevel.accentColor} />
                                                            <div>
                                                                <h5 className="font-semibold text-slate-900">{module.moduleTitle}</h5>
                                                                <p className="text-xs text-slate-500">{module.estimatedTime}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-bold px-2 py-1 rounded ${getDifficultyColor(module.difficulty)}`}>
                                                                {module.difficulty}
                                                            </span>
                                                            {expandedModules[module.moduleId] ? (
                                                                <ChevronUp size={18} />
                                                            ) : (
                                                                <ChevronDown size={18} />
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Module Content */}
                                                    {expandedModules[module.moduleId] && (
                                                        <div className="p-4 bg-slate-50 space-y-3 border-t border-slate-200">
                                                            <p className="text-slate-700 text-sm">{module.moduleDescription}</p>
                                                            
                                                            {/* Topics Covered */}
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900 mb-2">Topics Covered:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {module.topicsCovered?.map((topic, idx) => (
                                                                        <span key={idx} className={`text-xs px-3 py-1 rounded-full ${currentLevel.lightBg} ${currentLevel.accentColor}`}>
                                                                            {topic}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Lessons */}
                                                            <div className="space-y-2 mt-4">
                                                                <p className="text-xs font-bold text-slate-900">Lessons:</p>
                                                                {module.lessons?.map((lesson, lesIdx) => {
                                                                    const isLessonComplete = completedLessons.includes(lesson.lessonId);
                                                                    return (
                                                                        <div key={lesson.lessonId} className={`border rounded-lg overflow-hidden transition-all ${
                                                                            isLessonComplete
                                                                                ? 'bg-green-50 border-green-200'
                                                                                : 'bg-white border-slate-200'
                                                                        }`}>
                                                                            <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-all gap-2">
                                                                                <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isLessonComplete}
                                                                                        onChange={() => handleMarkLessonComplete(lesson.lessonId, phase.phaseId, module.moduleId)}
                                                                                        className="w-5 h-5 rounded cursor-pointer accent-green-500"
                                                                                    />
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className={`font-semibold text-sm ${isLessonComplete ? 'text-green-700 line-through' : 'text-slate-900'}`}>
                                                                                            {lesson.lessonTitle}
                                                                                        </p>
                                                                                        <p className="text-xs text-slate-600">{lesson.duration}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => toggleLesson(lesson.lessonId)}
                                                                                    className="flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-all"
                                                                                >
                                                                                    {expandedLessons[lesson.lessonId] ? (
                                                                                        <ChevronUp size={16} className="text-slate-600" />
                                                                                    ) : (
                                                                                        <ChevronDown size={16} className="text-slate-600" />
                                                                                    )}
                                                                                </button>
                                                                            </div>

                                                                            {/* Lesson Content */}
                                                                            {expandedLessons[lesson.lessonId] && (
                                                                                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 text-sm">
                                                                                    <div>
                                                                                        <p className="font-bold text-slate-900 mb-2">Content:</p>
                                                                                        <p className="text-slate-700">{lesson.lessonContent}</p>
                                                                                </div>

                                                                                {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                                                                                    <div>
                                                                                        <p className="font-bold text-slate-900 mb-2">Key Points:</p>
                                                                                        <ul className="space-y-1 ml-4">
                                                                                            {lesson.keyPoints.map((point, idx) => (
                                                                                                <li key={idx} className="text-slate-700 flex items-start gap-2">
                                                                                                    <span className="text-blue-500 mt-1">•</span>
                                                                                                    <span>{point}</span>
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>
                                                                                )}

                                                                                {lesson.resources && lesson.resources.length > 0 && (
                                                                                    <div>
                                                                                        <p className="font-bold text-slate-900 mb-2">Resources:</p>
                                                                                        <ul className="space-y-1 ml-4">
                                                                                            {lesson.resources.map((resource, idx) => (
                                                                                                <li key={idx} className="text-slate-700 flex items-start gap-2">
                                                                                                    <span className="text-green-500 mt-1">•</span>
                                                                                                    <span>{resource}</span>
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>
                                                                                )}

                                                                                {lesson.practiceActivities && lesson.practiceActivities.length > 0 && (
                                                                                    <div>
                                                                                        <p className="font-bold text-slate-900 mb-2">Practice Activities:</p>
                                                                                        <ul className="space-y-1 ml-4">
                                                                                            {lesson.practiceActivities.map((activity, idx) => (
                                                                                                <li key={idx} className="text-slate-700 flex items-start gap-2">
                                                                                                    <span className="text-orange-500 mt-1">→</span>
                                                                                                    <span>
                                                                                                        <strong>{activity.activity}:</strong> {activity.description}
                                                                                                    </span>
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Module Assessment */}
                                                            {module.assessment && (
                                                                <div className={`mt-4 p-3 rounded-lg ${currentLevel.lightBg} border ${currentLevel.borderColor}`}>
                                                                    <p className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                                                        <Award size={16} />
                                                                        Assessment: {module.assessment.type}
                                                                    </p>
                                                                    <p className="text-sm text-slate-700">{module.assessment.description}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className={`mt-4 p-3 rounded-lg border-l-4 ${currentLevel.borderColor}`}>
                                            <p className="text-sm text-slate-700"><strong>Completion Criteria:</strong> {phase.completionCriteria}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Study Timeline</h3>
                        <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">Total Duration</h4>
                                    <p className="text-3xl font-black text-slate-900">
                                        {enhancedRoadmap.studyTimeline?.totalEstimatedHours || 24}
                                    </p>
                                    <p className="text-sm text-slate-600">hours</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">Recommended Pace</h4>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {enhancedRoadmap.studyTimeline?.recommendedPacePerWeek || '4-6 hours'}
                                    </p>
                                    <p className="text-sm text-slate-600">per week</p>
                                </div>
                            </div>

                            <h4 className="font-bold text-slate-900 mb-4">Time Breakdown by Phase</h4>
                            <div className="space-y-3">
                                {enhancedRoadmap.studyTimeline?.phaseBreakdown?.map((phase, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-sm font-semibold text-slate-900">{phase.phase}</p>
                                            <p className="text-sm font-bold text-slate-600">{phase.hours} hours ({phase.percentage}%)</p>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className={`bg-${currentLevel.color}-500 h-full rounded-full`}
                                                style={{ width: `${phase.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Outcomes Tab */}
                {activeTab === 'outcomes' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Learning Outcomes</h3>
                            <div className="space-y-3">
                                {enhancedRoadmap.learningOutcomes?.map((outcome, idx) => (
                                    <div key={idx} className={`flex items-start gap-4 p-4 rounded-lg border ${currentLevel.borderColor} ${currentLevel.lightBg}`}>
                                        <Check size={24} className={`text-green-500 flex-shrink-0 mt-1`} />
                                        <div>
                                            <p className="font-bold text-slate-900">{outcome.outcome}</p>
                                            <p className="text-sm text-slate-600 mt-1">{outcome.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {enhancedRoadmap.prerequisites && enhancedRoadmap.prerequisites.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Prerequisites</h3>
                                <div className="space-y-3">
                                    {enhancedRoadmap.prerequisites.map((prereq, idx) => (
                                        <div key={idx} className={`flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50`}>
                                            <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="font-bold text-slate-900">{prereq.topic}</p>
                                                <p className="text-sm text-slate-600 mt-1">{prereq.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Map size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        AI-Generated Enhanced Roadmap
                    </span>
                </div>
                <p className="text-xs text-slate-600">
                    {enhancedRoadmap.progressTracking?.completedLessons?.length || 0} of {
                        enhancedRoadmap.learningPath?.reduce((total, phase) => 
                            total + (phase.modules?.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0) || 0), 0
                        ) || 0
                    } lessons completed
                </p>
            </div>
        </div>
    );
};

export default EnhancedRoadmap;
