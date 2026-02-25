import React, { useState, useEffect } from 'react';
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
    Play,
    Lock,
    CheckCircle2,
    Trophy,
    BarChart3,
    Star,
    FileQuestion,
    Loader2,
    XCircle,
    TrendingUp
} from 'lucide-react';
import roadmapService from '../services/roadmapService';
import api from '../services/api';

const EnhancedRoadmap = ({ enhancedRoadmap, fileName, learnerLevel, documentId, onNavigateToTab, onProgressUpdate }) => {
    const [expandedPhases, setExpandedPhases] = useState({});
    const [expandedModules, setExpandedModules] = useState({});
    const [expandedLessons, setExpandedLessons] = useState({});
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [completedLessons, setCompletedLessons] = useState(
        enhancedRoadmap?.progressTracking?.completedLessons || []
    );
    const [completedModules, setCompletedModules] = useState(
        enhancedRoadmap?.progressTracking?.completedModules || []
    );
    const [completedPhases, setCompletedPhases] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    
    // Quiz states
    const [quizzes, setQuizzes] = useState({});
    const [loadingQuiz, setLoadingQuiz] = useState({});
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResults, setQuizResults] = useState({});
    const [scoreTracker, setScoreTracker] = useState(null);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [currentQuizData, setCurrentQuizData] = useState(null);
    const [submittingQuiz, setSubmittingQuiz] = useState(false);

    // Level configurations
    const levelConfigs = {
        beginner: {
            badge: 'Beginner',
            color: 'green',
            bgColor: 'bg-green-100',
            accentColor: 'text-green-600',
            borderColor: 'border-green-200',
            lightBg: 'bg-green-50',
            gradient: 'from-green-50 to-emerald-50',
            buttonBg: 'bg-green-600 hover:bg-green-700'
        },
        intermediate: {
            badge: 'Intermediate',
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            accentColor: 'text-yellow-600',
            borderColor: 'border-yellow-200',
            lightBg: 'bg-yellow-50',
            gradient: 'from-yellow-50 to-amber-50',
            buttonBg: 'bg-yellow-600 hover:bg-yellow-700'
        },
        advanced: {
            badge: 'Advanced',
            color: 'blue',
            bgColor: 'bg-blue-100',
            accentColor: 'text-blue-600',
            borderColor: 'border-blue-200',
            lightBg: 'bg-blue-50',
            gradient: 'from-blue-50 to-indigo-50',
            buttonBg: 'bg-blue-600 hover:bg-blue-700'
        }
    };

    const currentLevel = levelConfigs[learnerLevel] || levelConfigs.beginner;

    // Load score tracker on mount
    useEffect(() => {
        if (documentId) {
            loadScoreTracker();
        }
    }, [documentId]);

    // Calculate completed phases based on modules
    useEffect(() => {
        const phases = enhancedRoadmap?.phases || enhancedRoadmap?.learningPath || [];
        if (phases.length > 0) {
            const completed = [];
            phases.forEach((phase, idx) => {
                const phaseModules = phase.modules?.map(m => m.moduleId) || [];
                const allCompleted = phaseModules.length > 0 && 
                    phaseModules.every(modId => completedModules.includes(modId));
                if (allCompleted) {
                    completed.push(phase.phaseId);
                }
            });
            setCompletedPhases(completed);
        }
    }, [completedModules, enhancedRoadmap]);

    const loadScoreTracker = async () => {
        try {
            const response = await api.get(`/quizzes/tracker/${documentId}`);
            if (response.data.success) {
                setScoreTracker(response.data.data);
            }
        } catch (error) {
            console.error('Error loading score tracker:', error);
        }
    };

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
        switch(difficulty?.toLowerCase()) {
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

    // Generate unique lesson key combining moduleId and lessonId
    const getLessonKey = (moduleId, lessonId) => `${moduleId}_${lessonId}`;

    // Handle marking lesson as complete
    const handleMarkLessonComplete = async (lessonId, phaseId, moduleId) => {
        const lessonKey = getLessonKey(moduleId, lessonId);
        let updatedLessons;
        if (completedLessons.includes(lessonKey)) {
            updatedLessons = completedLessons.filter(id => id !== lessonKey);
        } else {
            updatedLessons = [...completedLessons, lessonKey];
        }
        setCompletedLessons(updatedLessons);

        // Check if all lessons in module are completed
        const phase = enhancedRoadmap?.learningPath?.find(p => p.phaseId === phaseId);
        const module = phase?.modules?.find(m => m.moduleId === moduleId);
        if (module) {
            const moduleLessons = module.lessons?.map(l => getLessonKey(moduleId, l.lessonId)) || [];
            const allLessonsComplete = moduleLessons.every(lid => updatedLessons.includes(lid));
            
            if (allLessonsComplete && !completedModules.includes(moduleId)) {
                setCompletedModules(prev => [...prev, moduleId]);
            } else if (!allLessonsComplete && completedModules.includes(moduleId)) {
                setCompletedModules(prev => prev.filter(id => id !== moduleId));
            }
        }

        // Sync with backend
        if (documentId) {
            try {
                const result = await roadmapService.updateProgress(documentId, {
                    lessonId: lessonKey,
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

    // Handle starting a phase quiz
    const handleStartPhaseQuiz = async (phase, phaseIdx) => {
        const quizKey = `phase_${phase.phaseId}`;
        setLoadingQuiz(prev => ({ ...prev, [quizKey]: true }));

        try {
            // First, check if a quiz already exists for this phase
            let existingQuiz = null;
            try {
                const existingResponse = await api.get(`/quizzes/roadmap/${documentId}`);
                if (existingResponse.data.success && existingResponse.data.data) {
                    existingQuiz = existingResponse.data.data.find(
                        q => q.phaseId === phase.phaseId && q.quizType === 'phase-quiz'
                    );
                }
            } catch (err) {
                console.log('No existing quizzes found, will create new one');
            }

            if (existingQuiz) {
                // Use existing quiz
                console.log('📋 Using pre-generated quiz');
                const quizDetails = await api.get(`/quizzes/${existingQuiz._id}`);
                if (quizDetails.data.success) {
                    setCurrentQuizData({
                        ...quizDetails.data.data,
                        quizKey,
                        type: 'phase',
                        phaseName: phase.phaseName
                    });
                    setQuizAnswers({});
                    setShowQuizModal(true);
                    return;
                }
            }

            // No existing quiz found, create a new one
            console.log('📝 Creating new quiz (no pre-generated found)');
            
            // Use phase-specific topics if available, otherwise derive from modules
            let allTopicsInPhase = [];
            if (phase.phaseTopics && phase.phaseTopics.length > 0) {
                // New structure: phase has its own unique topics
                allTopicsInPhase = phase.phaseTopics.map(t => t.name || t);
                console.log('Using phase-specific topics:', allTopicsInPhase);
            } else {
                // Fallback: derive from modules
                allTopicsInPhase = [...new Set(
                    phase.modules?.flatMap(m => m.topicsCovered || []) || []
                )];
            }

            const response = await api.post('/quizzes/phase', {
                roadmapId: documentId,
                phaseId: phase.phaseId,
                phaseNumber: phaseIdx + 1,
                phaseName: phase.phaseName,
                phaseObjective: phase.phaseObjective,
                modulesInPhase: phase.modules || [],
                allTopicsInPhase,
                phaseTopics: phase.phaseTopics || [] // Pass full topic objects for better quiz generation
            });

            if (response.data.success) {
                setCurrentQuizData({
                    ...response.data.data,
                    quizKey,
                    type: 'phase',
                    phaseName: phase.phaseName
                });
                setQuizAnswers({});
                setShowQuizModal(true);
            } else {
                alert(response.data.message || 'Failed to create quiz');
            }
        } catch (error) {
            console.error('Error creating phase quiz:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
            alert(`Failed to create quiz: ${errorMsg}. Please try again.`);
        } finally {
            setLoadingQuiz(prev => ({ ...prev, [quizKey]: false }));
        }
    };

    // Handle starting final quiz
    const handleStartFinalQuiz = async () => {
        const quizKey = 'final_quiz';
        setLoadingQuiz(prev => ({ ...prev, [quizKey]: true }));

        try {
            const response = await api.post('/quizzes/final', {
                roadmapId: documentId,
                allPhases: enhancedRoadmap?.learningPath || [],
                allTopics: enhancedRoadmap?.mainTopics || []
            });

            if (response.data.success) {
                setCurrentQuizData({
                    ...response.data.data,
                    quizKey,
                    type: 'final',
                    phaseName: 'Final Comprehensive Assessment'
                });
                setQuizAnswers({});
                setShowQuizModal(true);
            } else {
                alert(response.data.message || 'Failed to create final quiz');
            }
        } catch (error) {
            console.error('Error creating final quiz:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
            alert(`Failed to create final quiz: ${errorMsg}. Please try again.`);
        } finally {
            setLoadingQuiz(prev => ({ ...prev, [quizKey]: false }));
        }
    };

    // Handle quiz answer selection
    const handleAnswerSelect = (questionId, answer) => {
        setQuizAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    // Handle quiz submission
    const handleSubmitQuiz = async () => {
        if (!currentQuizData) return;

        const answersArray = Object.entries(quizAnswers).map(([questionId, selectedAnswer]) => ({
            questionId,
            selectedAnswer
        }));

        if (answersArray.length < currentQuizData.questions.length) {
            alert(`Please answer all ${currentQuizData.questions.length} questions before submitting.`);
            return;
        }

        setSubmittingQuiz(true);

        try {
            const response = await api.post(`/quizzes/${currentQuizData.quizId}/submit`, {
                answers: answersArray,
                timeTaken: 0
            });

            if (response.data.success) {
                setQuizResults(prev => ({
                    ...prev,
                    [currentQuizData.quizKey]: response.data.data
                }));
                
                // Reload score tracker
                await loadScoreTracker();
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('Failed to submit quiz. Please try again.');
        } finally {
            setSubmittingQuiz(false);
        }
    };

    // Close quiz modal
    const closeQuizModal = () => {
        setShowQuizModal(false);
        setCurrentQuizData(null);
        setQuizAnswers({});
    };

    // Handle quiz retry - clear results and answers to retake
    const handleRetryQuiz = () => {
        if (!currentQuizData) return;
        
        // Clear the quiz results for this quiz key
        setQuizResults(prev => {
            const newResults = { ...prev };
            delete newResults[currentQuizData.quizKey];
            return newResults;
        });
        
        // Clear answers
        setQuizAnswers({});
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

    // Calculate overall progress
    const calculateProgress = () => {
        if (!enhancedRoadmap) return { lessons: 0, modules: 0, phases: 0 };
        
        // Support both old (learningPath) and new (phases) structure
        const phases = enhancedRoadmap.phases || enhancedRoadmap.learningPath || [];
        
        let totalLessons = 0;
        let totalModules = 0;
        
        phases.forEach(phase => {
            totalModules += phase.modules?.length || 0;
            phase.modules?.forEach(mod => {
                totalLessons += mod.lessons?.length || 0;
            });
        });

        return {
            lessons: totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0,
            modules: totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0,
            phases: phases.length > 0 
                ? Math.round((completedPhases.length / phases.length) * 100) 
                : 0
        };
    };

    const progress = calculateProgress();

    // Check if phase quiz is available (all modules in phase completed)
    const isPhaseQuizAvailable = (phase) => {
        const phaseModules = phase.modules?.map(m => m.moduleId) || [];
        return phaseModules.length > 0 && phaseModules.every(modId => completedModules.includes(modId));
    };

    // Check if final quiz is available (all phases completed)
    const isFinalQuizAvailable = () => {
        const phases = enhancedRoadmap?.phases || enhancedRoadmap?.learningPath || [];
        return phases.length > 0 && 
            phases.every(phase => completedPhases.includes(phase.phaseId));
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

    // Get data with fallbacks
    // Support both old (learningPath) and new (phases) structure
    const learningPath = enhancedRoadmap.phases || enhancedRoadmap.learningPath || [];
    const mainTopics = enhancedRoadmap.subTopics || enhancedRoadmap.mainTopics || [];
    const studyTimeline = enhancedRoadmap.studyTimeline || {};
    const learningOutcomes = enhancedRoadmap.learningOutcomes || [];

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${currentLevel.gradient} px-8 py-6 border-b border-slate-200`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 ${currentLevel.bgColor} rounded-xl shadow-lg`}>
                            <Map size={24} className={currentLevel.accentColor} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-slate-900 text-2xl">
                                {enhancedRoadmap.title || enhancedRoadmap.mainTopic || enhancedRoadmap.mainDocumentTopic || enhancedRoadmap.documentTitle || 'Learning Roadmap'}
                            </h3>
                            <p className="text-sm text-slate-600 font-medium">
                                {enhancedRoadmap.description || enhancedRoadmap.overview || `Personalized learning path designed for ${learnerLevel} learners`}
                            </p>
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
                <div className="flex gap-2 border-t border-slate-200 pt-4 flex-wrap">
                    {[
                        { id: 'overview', label: 'Overview', icon: Map },
                        { id: 'topics', label: 'Topics', icon: Brain },
                        { id: 'path', label: 'Learning Path', icon: BookOpen },
                        { id: 'timeline', label: 'Timeline', icon: Clock },
                        { id: 'outcomes', label: 'Outcomes', icon: Award },
                        { id: 'scores', label: 'Score Tracker', icon: BarChart3 }
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
                        {/* Document & Topic Info */}
                        <div className={`${currentLevel.lightBg} rounded-xl p-6 border-2 ${currentLevel.borderColor}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="font-black text-slate-900 text-lg mb-2">📖 Document Overview</h4>
                                    <p className="text-slate-700">
                                        <b>Main Topic:</b> {enhancedRoadmap.mainDocumentTopic || enhancedRoadmap.documentTitle}
                                    </p>
                                    <p className="text-slate-600 text-sm mt-2">
                                        Source: {fileName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={20} className={currentLevel.accentColor} />
                                    <h4 className="font-bold text-slate-900">Total Duration</h4>
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    {studyTimeline.totalEstimatedHours || 24} hours
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    {studyTimeline.recommendedPacePerWeek || '4-6 hours/week'}
                                </p>
                            </div>

                            <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen size={20} className={currentLevel.accentColor} />
                                    <h4 className="font-bold text-slate-900">Learning Phases</h4>
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    {learningPath.length}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">Structured progression</p>
                            </div>

                            <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Target size={20} className={currentLevel.accentColor} />
                                    <h4 className="font-bold text-slate-900">Progress</h4>
                                </div>
                                <p className="text-2xl font-black text-slate-900">
                                    {progress.lessons}%
                                </p>
                                <p className="text-sm text-slate-600 mt-1">of lessons completed</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className={currentLevel.accentColor} />
                                Your Progress
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-700">Lessons Completed</span>
                                        <span className="font-bold">{completedLessons.length} / {
                                            learningPath.reduce((sum, p) => 
                                                sum + (p.modules?.reduce((m, mod) => m + (mod.lessons?.length || 0), 0) || 0), 0
                                            )
                                        }</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3">
                                        <div 
                                            className="bg-green-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${progress.lessons}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-700">Modules Completed</span>
                                        <span className="font-bold">{completedModules.length} / {
                                            learningPath.reduce((sum, p) => sum + (p.modules?.length || 0), 0)
                                        }</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3">
                                        <div 
                                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${progress.modules}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-700">Phases Completed</span>
                                        <span className="font-bold">{completedPhases.length} / {learningPath.length}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3">
                                        <div 
                                            className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${progress.phases}%` }}
                                        />
                                    </div>
                                </div>
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
                                Follow the structured phases, complete lessons and assessments, and track your progress as you master the content. Each phase ends with a quiz to verify your understanding.
                            </p>
                        </div>

                        {/* Final Quiz Card */}
                        <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-100 rounded-xl">
                                        <Trophy size={24} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Final Comprehensive Assessment</h4>
                                        <p className="text-sm text-slate-600">
                                            {isFinalQuizAvailable() 
                                                ? 'Complete this assessment to verify your mastery of all topics'
                                                : 'Complete all phases to unlock the final assessment'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleStartFinalQuiz}
                                    disabled={!isFinalQuizAvailable() || loadingQuiz['final_quiz']}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                                        isFinalQuizAvailable()
                                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {loadingQuiz['final_quiz'] ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : isFinalQuizAvailable() ? (
                                        <>
                                            <Play size={18} />
                                            Start Final Quiz
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={18} />
                                            Locked
                                        </>
                                    )}
                                </button>
                            </div>
                            {quizResults['final_quiz'] && (
                                <div className="mt-4 pt-4 border-t border-purple-200">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-2 rounded-lg font-bold ${
                                            quizResults['final_quiz'].percentageScore >= 70 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            Score: {quizResults['final_quiz'].percentageScore}%
                                        </div>
                                        <span className="text-sm text-slate-600">
                                            {quizResults['final_quiz'].correctCount} / {quizResults['final_quiz'].totalQuestions} correct
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Topics Tab */}
                {activeTab === 'topics' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Brain size={24} className={currentLevel.accentColor} />
                                Topics Across Learning Phases ({mainTopics.length} total)
                            </h3>
                            <p className="text-slate-600 mb-6">Topics are uniquely organized by phase for structured learning</p>
                        </div>

                        {learningPath.map((phase, phaseIdx) => {
                            const phaseTopics = phase.phaseTopics || [];
                            
                            return (
                                <div key={phase.phaseId} className={`${currentLevel.lightBg} border-2 ${currentLevel.borderColor} rounded-xl p-6`}>
                                    <div className="mb-4">
                                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${currentLevel.bgColor} ${currentLevel.accentColor} font-bold`}>
                                                {phaseIdx + 1}
                                            </span>
                                            {phase.phaseName}
                                        </h4>
                                        <p className="text-slate-600 text-sm mt-2">{phase.phaseObjective}</p>
                                    </div>

                                    {phaseTopics.length === 0 ? (
                                        <p className="text-slate-500 text-sm italic">No topics defined for this phase</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {phaseTopics.map((topic, idx) => (
                                                <div
                                                    key={topic.id || idx}
                                                    onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                                                    className="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:border-slate-400 transition-all hover:shadow-sm"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h5 className="font-bold text-slate-900 text-sm flex-1">{topic.name}</h5>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ml-2 ${getDifficultyColor(topic.difficulty)}`}>
                                                            {topic.difficulty}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm mb-2">{topic.description}</p>
                                                    {topic.keyTerms && topic.keyTerms.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {topic.keyTerms.map((term, idx) => (
                                                                <span key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                                                                    {term}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Learning Path Tab */}
                {activeTab === 'path' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <BookOpen size={24} className={currentLevel.accentColor} />
                            Learning Path ({learningPath.length} Phases)
                        </h3>
                        {learningPath.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
                                <p>No learning path available yet.</p>
                            </div>
                        ) : (
                            learningPath.map((phase, phaseIdx) => {
                                const phaseComplete = completedPhases.includes(phase.phaseId);
                                const quizKey = `phase_${phase.phaseId}`;
                                const phaseQuizResult = quizResults[quizKey];
                                
                                return (
                                    <div key={phase.phaseId} className={`border rounded-2xl overflow-hidden transition-all ${
                                        phaseComplete ? 'border-green-300 bg-green-50/30' : 'border-slate-200'
                                    }`}>
                                        {/* Phase Header */}
                                        <button
                                            onClick={() => togglePhase(phase.phaseId)}
                                            className={`w-full px-6 py-4 flex items-center justify-between ${
                                                phaseComplete ? 'bg-green-50' : currentLevel.lightBg
                                            } border-b border-slate-200 hover:bg-opacity-70 transition-all`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                                                    phaseComplete ? 'bg-green-500' : currentLevel.buttonBg.split(' ')[0]
                                                }`}>
                                                    {phaseComplete ? <CheckCircle2 size={24} /> : phaseIdx + 1}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-slate-900 text-lg">{phase.phaseName}</h4>
                                                    <p className="text-sm text-slate-600">{phase.estimatedDuration} • {phase.modules?.length || 0} modules</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {phaseComplete && (
                                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
                                                        Completed
                                                    </span>
                                                )}
                                                {expandedPhases[phase.phaseId] ? (
                                                    <ChevronUp size={20} className="text-slate-600" />
                                                ) : (
                                                    <ChevronDown size={20} className="text-slate-600" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Phase Content */}
                                        {expandedPhases[phase.phaseId] && (
                                            <div className="p-6 space-y-4">
                                                {/* Phase Description */}
                                                <div className="mb-4">
                                                    <p className="text-slate-700 mb-2">{phase.phaseDescription}</p>
                                                    <p className="text-sm text-slate-600 mb-3">
                                                        <strong>Objective:</strong> {phase.phaseObjective}
                                                    </p>
                                                    
                                                    {/* Phase-specific Topics */}
                                                    {phase.phaseTopics && phase.phaseTopics.length > 0 && (
                                                        <div className="mb-4">
                                                            <p className="text-sm font-semibold text-slate-700 mb-2">Topics in this Phase:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {phase.phaseTopics.map((topic, idx) => (
                                                                    <span 
                                                                        key={idx} 
                                                                        className={`text-xs px-3 py-1.5 rounded-full ${currentLevel.bgColor} ${currentLevel.accentColor} font-medium`}
                                                                        title={topic.description || topic.name}
                                                                    >
                                                                        {topic.name || topic}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Modules */}
                                                <div className="space-y-3">
                                                    {phase.modules?.map((module, modIdx) => {
                                                        const moduleComplete = completedModules.includes(module.moduleId);
                                                        
                                                        return (
                                                            <div key={module.moduleId} className={`border rounded-xl overflow-hidden transition-all ${
                                                                moduleComplete ? 'border-green-200 bg-green-50/50' : 'border-slate-200'
                                                            }`}>
                                                                {/* Module Header */}
                                                                <button
                                                                    onClick={() => toggleModule(module.moduleId)}
                                                                    className={`w-full px-5 py-3 flex items-center justify-between ${
                                                                        moduleComplete ? 'bg-green-50' : 'bg-slate-50'
                                                                    } hover:bg-opacity-70 transition-all`}
                                                                >
                                                                    <div className="flex items-center gap-3 text-left">
                                                                        {moduleComplete ? (
                                                                            <CheckCircle2 size={20} className="text-green-500" />
                                                                        ) : (
                                                                            <BookOpen size={20} className={currentLevel.accentColor} />
                                                                        )}
                                                                        <div>
                                                                            <h5 className="font-semibold text-slate-900">{module.moduleTitle}</h5>
                                                                            <p className="text-xs text-slate-500">{module.estimatedTime} • {module.lessons?.length || 0} lessons</p>
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
                                                                    <div className="p-4 bg-white space-y-3 border-t border-slate-200">
                                                                        <p className="text-slate-700 text-sm">{module.moduleDescription}</p>
                                                                        
                                                                        {/* Topics Covered */}
                                                                        {module.topicsCovered && module.topicsCovered.length > 0 && (
                                                                            <div>
                                                                                <p className="text-xs font-bold text-slate-900 mb-2">Topics Covered:</p>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {module.topicsCovered.map((topic, idx) => (
                                                                                        <span key={idx} className={`text-xs px-3 py-1 rounded-full ${currentLevel.lightBg} ${currentLevel.accentColor}`}>
                                                                                            {topic}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Lessons */}
                                                                        <div className="space-y-2 mt-4">
                                                                            <p className="text-xs font-bold text-slate-900">Lessons:</p>
                                                                            {module.lessons?.map((lesson) => {
                                                                                const lessonKey = getLessonKey(module.moduleId, lesson.lessonId);
                                                                                const isLessonComplete = completedLessons.includes(lessonKey);
                                                                                return (
                                                                                    <div key={lessonKey} className={`border rounded-lg overflow-hidden transition-all ${
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
                                                                                                onClick={() => toggleLesson(lessonKey)}
                                                                                                className="flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-all"
                                                                                            >
                                                                                                {expandedLessons[lessonKey] ? (
                                                                                                    <ChevronUp size={16} className="text-slate-600" />
                                                                                                ) : (
                                                                                                    <ChevronDown size={16} className="text-slate-600" />
                                                                                                )}
                                                                                            </button>
                                                                                        </div>

                                                                                        {/* Lesson Content */}
                                                                                        {expandedLessons[lessonKey] && (
                                                                                            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4 text-sm">
                                                                                                {/* Learning Objectives */}
                                                                                                {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                                                                                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                                                                        <p className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                                                                                            <Target size={16} />
                                                                                                            Learning Objectives
                                                                                                        </p>
                                                                                                        <ul className="space-y-1 ml-4">
                                                                                                            {lesson.learningObjectives.map((objective, idx) => (
                                                                                                                <li key={idx} className="text-blue-800 flex items-start gap-2">
                                                                                                                    <span className="text-blue-500 mt-1">✓</span>
                                                                                                                    <span>{objective}</span>
                                                                                                                </li>
                                                                                                            ))}
                                                                                                        </ul>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Introduction */}
                                                                                                {lesson.introduction && (
                                                                                                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                                                                                        <p className="font-bold text-purple-900 mb-2">Introduction</p>
                                                                                                        <p className="text-purple-800 leading-relaxed">{lesson.introduction}</p>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Main Content */}
                                                                                                {lesson.lessonContent && (
                                                                                                    <div>
                                                                                                        <p className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                                                                                            <BookOpen size={16} />
                                                                                                            Lesson Content
                                                                                                        </p>
                                                                                                        <div className="text-slate-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200">
                                                                                                            {lesson.lessonContent}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Key Points */}
                                                                                                {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                                                                                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                                                                        <p className="font-bold text-green-900 mb-2 flex items-center gap-2">
                                                                                                            <Check size={16} />
                                                                                                            Key Points to Remember
                                                                                                        </p>
                                                                                                        <ul className="space-y-2 ml-4">
                                                                                                            {lesson.keyPoints.map((point, idx) => (
                                                                                                                <li key={idx} className="text-green-800 flex items-start gap-2">
                                                                                                                    <span className="text-green-500 mt-1 font-bold">•</span>
                                                                                                                    <span className="font-medium">{point}</span>
                                                                                                                </li>
                                                                                                            ))}
                                                                                                        </ul>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Examples */}
                                                                                                {lesson.examples && lesson.examples.length > 0 && (
                                                                                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                                                                                        <p className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                                                                                                            <Zap size={16} />
                                                                                                            Examples
                                                                                                        </p>
                                                                                                        <div className="space-y-3">
                                                                                                            {lesson.examples.map((example, idx) => (
                                                                                                                <div key={idx} className="bg-white p-2 rounded border border-amber-300">
                                                                                                                    <p className="font-semibold text-amber-900 mb-1">{example.title}</p>
                                                                                                                    <p className="text-amber-800 text-xs">{example.description}</p>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Practice Activities */}
                                                                                                {lesson.practiceActivities && lesson.practiceActivities.length > 0 && (
                                                                                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                                                                        <p className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                                                                                                            <Brain size={16} />
                                                                                                            Practice Activities
                                                                                                        </p>
                                                                                                        <div className="space-y-3">
                                                                                                            {lesson.practiceActivities.map((activity, idx) => (
                                                                                                                <div key={idx} className="bg-white p-3 rounded border border-orange-300">
                                                                                                                    <p className="font-semibold text-orange-900 mb-1">
                                                                                                                        <span className="text-orange-500 mr-2">→</span>
                                                                                                                        {activity.activity}
                                                                                                                    </p>
                                                                                                                    {activity.instructions && (
                                                                                                                        <p className="text-orange-800 text-xs mb-1"><strong>Instructions:</strong> {activity.instructions}</p>
                                                                                                                    )}
                                                                                                                    {activity.expectedOutcome && (
                                                                                                                        <p className="text-orange-700 text-xs"><strong>Expected Outcome:</strong> {activity.expectedOutcome}</p>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Common Misconceptions */}
                                                                                                {lesson.commonMisconceptions && lesson.commonMisconceptions.length > 0 && (
                                                                                                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                                                                        <p className="font-bold text-red-900 mb-2 flex items-center gap-2">
                                                                                                            <AlertCircle size={16} />
                                                                                                            Common Misconceptions
                                                                                                        </p>
                                                                                                        <ul className="space-y-2 ml-4">
                                                                                                            {lesson.commonMisconceptions.map((misconception, idx) => (
                                                                                                                <li key={idx} className="text-red-800 flex items-start gap-2">
                                                                                                                    <span className="text-red-500 mt-1">⚠</span>
                                                                                                                    <span>{misconception}</span>
                                                                                                                </li>
                                                                                                            ))}
                                                                                                        </ul>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Summary */}
                                                                                                {lesson.summary && (
                                                                                                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                                                                                        <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                                                                                            <Award size={16} />
                                                                                                            Summary
                                                                                                        </p>
                                                                                                        <p className="text-indigo-800 leading-relaxed">{lesson.summary}</p>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Next Steps */}
                                                                                                {lesson.nextSteps && (
                                                                                                    <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                                                                                                        <p className="font-bold text-teal-900 mb-2 flex items-center gap-2">
                                                                                                            <ArrowRight size={16} />
                                                                                                            Next Steps
                                                                                                        </p>
                                                                                                        <p className="text-teal-800 leading-relaxed">{lesson.nextSteps}</p>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Phase Quiz Section */}
                                                <div className={`mt-6 p-4 rounded-xl border-2 ${
                                                    isPhaseQuizAvailable(phase) 
                                                        ? 'border-purple-200 bg-purple-50'
                                                        : 'border-slate-200 bg-slate-50'
                                                }`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${
                                                                isPhaseQuizAvailable(phase) ? 'bg-purple-100' : 'bg-slate-200'
                                                            }`}>
                                                                <FileQuestion size={20} className={
                                                                    isPhaseQuizAvailable(phase) ? 'text-purple-600' : 'text-slate-400'
                                                                } />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-bold text-slate-900">Phase Assessment Quiz</h5>
                                                                <p className="text-xs text-slate-600">
                                                                    {isPhaseQuizAvailable(phase)
                                                                        ? 'All modules completed! Take the quiz to verify your understanding.'
                                                                        : 'Complete all modules in this phase to unlock the quiz.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleStartPhaseQuiz(phase, phaseIdx)}
                                                            disabled={!isPhaseQuizAvailable(phase) || loadingQuiz[quizKey]}
                                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
                                                                isPhaseQuizAvailable(phase)
                                                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            {loadingQuiz[quizKey] ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : isPhaseQuizAvailable(phase) ? (
                                                                <>
                                                                    <Play size={16} />
                                                                    Start Quiz
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Lock size={16} />
                                                                    Locked
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                    {phaseQuizResult && (
                                                        <div className="mt-3 pt-3 border-t border-purple-200">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
                                                                    phaseQuizResult.percentageScore >= 70 
                                                                        ? 'bg-green-100 text-green-700' 
                                                                        : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                    Score: {phaseQuizResult.percentageScore}%
                                                                </div>
                                                                <span className="text-sm text-slate-600">
                                                                    {phaseQuizResult.correctCount} / {phaseQuizResult.totalQuestions} correct
                                                                </span>
                                                                {phaseQuizResult.percentageScore >= 70 && (
                                                                    <CheckCircle2 size={18} className="text-green-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`p-3 rounded-lg border-l-4 ${currentLevel.borderColor} bg-slate-50`}>
                                                    <p className="text-sm text-slate-700">
                                                        <strong>Completion Criteria:</strong> {phase.completionCriteria}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Clock size={24} className={currentLevel.accentColor} />
                            Study Timeline
                        </h3>
                        {!studyTimeline.totalEstimatedHours ? (
                            <div className="text-center py-12 text-slate-500">
                                <Clock size={48} className="mx-auto mb-4 text-slate-300" />
                                <p>Timeline information not available.</p>
                            </div>
                        ) : (
                            <div className={`${currentLevel.lightBg} rounded-xl p-6 border ${currentLevel.borderColor}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <h4 className="font-bold text-slate-900 mb-2">Total Duration</h4>
                                        <p className="text-4xl font-black text-slate-900">
                                            {studyTimeline.totalEstimatedHours}
                                        </p>
                                        <p className="text-sm text-slate-600">hours</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <h4 className="font-bold text-slate-900 mb-2">Recommended Pace</h4>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {studyTimeline.recommendedPacePerWeek}
                                        </p>
                                        <p className="text-sm text-slate-600">per week</p>
                                    </div>
                                </div>

                                <h4 className="font-bold text-slate-900 mb-4">Time Breakdown by Phase</h4>
                                <div className="space-y-4">
                                    {studyTimeline.phaseBreakdown?.map((phase, idx) => (
                                        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-semibold text-slate-900">{phase.phase}</p>
                                                <p className="font-bold text-slate-600">{phase.hours} hours ({phase.percentage}%)</p>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className={`${currentLevel.buttonBg.split(' ')[0]} h-full rounded-full transition-all duration-500`}
                                                    style={{ width: `${phase.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Outcomes Tab */}
                {activeTab === 'outcomes' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Award size={24} className={currentLevel.accentColor} />
                                Learning Outcomes ({learningOutcomes.length})
                            </h3>
                            {learningOutcomes.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Award size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p>Learning outcomes not available.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {learningOutcomes.map((outcome, idx) => (
                                        <div key={idx} className={`flex items-start gap-4 p-4 rounded-xl border ${currentLevel.borderColor} ${currentLevel.lightBg}`}>
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <Check size={20} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{outcome.outcome}</p>
                                                <p className="text-sm text-slate-600 mt-1">{outcome.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {enhancedRoadmap.prerequisites && enhancedRoadmap.prerequisites.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Prerequisites</h3>
                                <div className="space-y-3">
                                    {enhancedRoadmap.prerequisites.map((prereq, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
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

                {/* Score Tracker Tab */}
                {activeTab === 'scores' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <BarChart3 size={24} className={currentLevel.accentColor} />
                            Score Tracker
                        </h3>

                        {/* Overall Score Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-slate-900">Overall Performance</h4>
                                <div className="flex items-center gap-2">
                                    <Star size={20} className="text-yellow-500" />
                                    <span className="text-2xl font-black text-slate-900">
                                        {scoreTracker?.overallScore || 0}%
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {scoreTracker?.totalQuestionsAttempted || 0}
                                    </p>
                                    <p className="text-xs text-slate-600">Questions Attempted</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {scoreTracker?.totalQuestionsCorrect || 0}
                                    </p>
                                    <p className="text-xs text-slate-600">Correct Answers</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {scoreTracker?.averageAccuracy || 0}%
                                    </p>
                                    <p className="text-xs text-slate-600">Accuracy</p>
                                </div>
                            </div>
                        </div>

                        {/* Phase-wise Scores */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-900">Phase-wise Performance</h4>
                            {learningPath.map((phase, idx) => {
                                const phaseScore = scoreTracker?.phaseScores?.find(ps => ps.phaseId === phase.phaseId);
                                const quizKey = `phase_${phase.phaseId}`;
                                const phaseQuizResult = quizResults[quizKey];
                                
                                return (
                                    <div key={phase.phaseId} className="bg-white rounded-xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                                    phaseScore?.phaseCompletion === 'completed' ? 'bg-green-500' : 'bg-slate-400'
                                                }`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-slate-900">{phase.phaseName}</h5>
                                                    <p className="text-xs text-slate-500">
                                                        {phaseScore?.moduleQuizzes?.length || 0} module quizzes completed
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                                                phaseScore?.phaseScore >= 70 
                                                    ? 'bg-green-100 text-green-700'
                                                    : phaseScore?.phaseScore > 0
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {phaseScore?.phaseScore || phaseQuizResult?.percentageScore || 0}%
                                            </div>
                                        </div>
                                        
                                        {/* Module quiz scores */}
                                        {phaseScore?.moduleQuizzes && phaseScore.moduleQuizzes.length > 0 && (
                                            <div className="space-y-2 pl-11">
                                                {phaseScore.moduleQuizzes.map((mq, mqIdx) => (
                                                    <div key={mqIdx} className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-600">{mq.moduleName}</span>
                                                        <span className={`font-semibold ${
                                                            mq.percentageScore >= 70 ? 'text-green-600' : 'text-orange-600'
                                                        }`}>
                                                            {mq.percentageScore}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Phase quiz result */}
                                        {(phaseScore?.phaseOverallQuiz || phaseQuizResult) && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 pl-11">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-700 font-medium">Phase Assessment</span>
                                                    <span className={`font-bold ${
                                                        (phaseScore?.phaseOverallQuiz?.percentageScore || phaseQuizResult?.percentageScore || 0) >= 70 
                                                            ? 'text-green-600' 
                                                            : 'text-orange-600'
                                                    }`}>
                                                        {phaseScore?.phaseOverallQuiz?.percentageScore || phaseQuizResult?.percentageScore || 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Final Assessment Score */}
                        {(scoreTracker?.finalAssessment?.status === 'completed' || quizResults['final_quiz']) && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-100 rounded-xl">
                                        <Trophy size={28} className="text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900">Final Assessment</h4>
                                        <p className="text-sm text-slate-600">Comprehensive roadmap assessment</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl font-bold text-lg ${
                                        (scoreTracker?.finalAssessment?.percentageScore || quizResults['final_quiz']?.percentageScore || 0) >= 70
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {scoreTracker?.finalAssessment?.percentageScore || quizResults['final_quiz']?.percentageScore || 0}%
                                    </div>
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
                    {completedLessons.length} of {
                        learningPath.reduce((total, phase) => 
                            total + (phase.modules?.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0) || 0), 0
                        )
                    } lessons completed
                </p>
            </div>

            {/* Quiz Modal */}
            {showQuizModal && currentQuizData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Quiz Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{currentQuizData.quizTitle}</h3>
                                <p className="text-sm text-slate-600">{currentQuizData.phaseName} • {currentQuizData.totalQuestions} questions</p>
                            </div>
                            <button
                                onClick={closeQuizModal}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <XCircle size={24} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Quiz Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {quizResults[currentQuizData.quizKey] ? (
                                /* Quiz Results */
                                <div className="space-y-6">
                                    {/* Score Summary */}
                                    <div className={`text-center p-8 rounded-xl ${
                                        quizResults[currentQuizData.quizKey].percentageScore >= 70
                                            ? 'bg-green-50 border border-green-200'
                                            : 'bg-red-50 border border-red-200'
                                    }`}>
                                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                                            quizResults[currentQuizData.quizKey].percentageScore >= 70
                                                ? 'bg-green-100'
                                                : 'bg-red-100'
                                        }`}>
                                            {quizResults[currentQuizData.quizKey].percentageScore >= 70 ? (
                                                <CheckCircle2 size={40} className="text-green-600" />
                                            ) : (
                                                <XCircle size={40} className="text-red-600" />
                                            )}
                                        </div>
                                        <h4 className="text-3xl font-black text-slate-900 mb-2">
                                            {quizResults[currentQuizData.quizKey].percentageScore}%
                                        </h4>
                                        <p className="text-slate-600">
                                            {quizResults[currentQuizData.quizKey].correctCount} out of {quizResults[currentQuizData.quizKey].totalQuestions} correct
                                        </p>
                                        <p className={`text-sm font-semibold mt-2 ${
                                            quizResults[currentQuizData.quizKey].percentageScore >= 70
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}>
                                            {quizResults[currentQuizData.quizKey].percentageScore >= 70 
                                                ? 'Congratulations! You passed!' 
                                                : 'Keep practicing to improve your score.'}
                                        </p>
                                    </div>

                                    {/* Review Answers */}
                                    <div>
                                        <h5 className="font-bold text-slate-900 mb-4">Review Your Answers</h5>
                                        <div className="space-y-4">
                                            {quizResults[currentQuizData.quizKey].review?.map((item, idx) => (
                                                <div key={idx} className={`p-4 rounded-lg border ${
                                                    item.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                                }`}>
                                                    <div className="flex items-start gap-3">
                                                        {item.isCorrect ? (
                                                            <CheckCircle2 size={20} className="text-green-600 mt-1" />
                                                        ) : (
                                                            <XCircle size={20} className="text-red-600 mt-1" />
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-900 mb-2">
                                                                {idx + 1}. {item.questionText}
                                                            </p>
                                                            <p className="text-sm">
                                                                <span className="text-slate-600">Your answer: </span>
                                                                <span className={item.isCorrect ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                                                                    {item.yourAnswer}
                                                                </span>
                                                            </p>
                                                            {!item.isCorrect && (
                                                                <p className="text-sm">
                                                                    <span className="text-slate-600">Correct answer: </span>
                                                                    <span className="text-green-700 font-semibold">{item.correctAnswer}</span>
                                                                </p>
                                                            )}
                                                            <p className="text-sm text-slate-600 mt-2 italic">
                                                                {item.explanation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Quiz Questions */
                                <div className="space-y-6">
                                    {currentQuizData.questions.map((question, idx) => (
                                        <div key={question.questionId} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="flex items-start gap-3 mb-4">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                    quizAnswers[question.questionId] 
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-900">{question.questionText}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(question.difficulty)}`}>
                                                            {question.difficulty}
                                                        </span>
                                                        {question.topic && (
                                                            <span className="text-xs text-slate-500">• {question.topic}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2 ml-11">
                                                {question.options.map((option, optIdx) => (
                                                    <label
                                                        key={optIdx}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                            quizAnswers[question.questionId] === option
                                                                ? 'border-purple-500 bg-purple-50'
                                                                : 'border-slate-200 hover:border-slate-300 hover:bg-white'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={question.questionId}
                                                            value={option}
                                                            checked={quizAnswers[question.questionId] === option}
                                                            onChange={() => handleAnswerSelect(question.questionId, option)}
                                                            className="w-4 h-4 accent-purple-600"
                                                        />
                                                        <span className="text-slate-700">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quiz Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                            {quizResults[currentQuizData.quizKey] ? (
                                <div className="flex items-center gap-3 w-full justify-between">
                                    <button
                                        onClick={handleRetryQuiz}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
                                    >
                                        <Play size={18} />
                                        Try Again
                                    </button>
                                    <button
                                        onClick={closeQuizModal}
                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-600">
                                        {Object.keys(quizAnswers).length} of {currentQuizData.questions.length} answered
                                    </p>
                                    <button
                                        onClick={handleSubmitQuiz}
                                        disabled={submittingQuiz || Object.keys(quizAnswers).length < currentQuizData.questions.length}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                                            Object.keys(quizAnswers).length >= currentQuizData.questions.length
                                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {submittingQuiz ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={18} />
                                                Submit Quiz
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedRoadmap;
