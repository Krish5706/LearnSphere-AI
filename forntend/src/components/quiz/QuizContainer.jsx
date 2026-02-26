import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuizPage from './QuizPage';
import QuizResultsAnalysis from './QuizResultsAnalysis';
import { Loader2, AlertCircle } from 'lucide-react';
import { processPDF, submitQuizAnswers, getDocumentById } from '../../services/api';

const QuizContainer = () => {
    const { documentId } = useParams();
    const navigate = useNavigate();

    const [state, setState] = useState({
        loading: true,
        submitting: false,
        questions: null,
        results: null,
        error: null,
        stage: 'quiz' // 'quiz' or 'results'
    });

    const { user, setUser } = useAuth();

    // Fetch quiz questions on component mount
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));

                // Get document to check if quiz exists
                const docRes = await getDocumentById(documentId);
                const doc = docRes.data;

                // If quiz doesn't exist, generate it
                if (!doc.quizzes || doc.quizzes.length === 0) {
                    console.log('📝 Generating quiz...');
                    const genRes = await processPDF(documentId, 'quiz');

                    // update user credits if returned
                    if (genRes?.data?.user) {
                        setUser(genRes.data.user);
                    }
                    
                    // Fetch again to get the generated quiz
                    const updatedDocRes = await getDocumentById(documentId);
                    const questions = updatedDocRes.data.quizzes;
                    
                    if (!questions || questions.length === 0) {
                        throw new Error('Failed to generate quiz questions');
                    }

                    setState(prev => ({
                        ...prev,
                        questions,
                        loading: false,
                        stage: 'quiz'
                    }));
                } else {
                    setState(prev => ({
                        ...prev,
                        questions: doc.quizzes,
                        loading: false,
                        stage: 'quiz'
                    }));
                }
            } catch (err) {
                console.error('Quiz fetch error:', err);
                setState(prev => ({
                    ...prev,
                    error: err.response?.data?.message || err.message || 'Failed to load quiz',
                    loading: false
                }));
            }
        };

        if (documentId) {
            fetchQuiz();
        }
    }, [documentId]);

    // Handle quiz submission
    const handleSubmitQuiz = async (payload) => {
        try {
            setState(prev => ({ ...prev, submitting: true, error: null }));
            console.log('📤 Submitting quiz with payload:', payload);

            // Submit answers to backend
            const response = await submitQuizAnswers(payload.documentId, payload.answers);
            console.log('✅ Full Response object:', response);
            console.log('✅ Response data:', response.data);

            // Validate response format
            if (!response.data) {
                throw new Error('Invalid response format from server');
            }

            // Extract results from response
            const correctAnswers = parseInt(response.data.correctAnswers) || 0;
            const wrongAnswers = Array.isArray(response.data.wrongAnswers) ? response.data.wrongAnswers : [];
            const totalQuestions = parseInt(response.data.totalQuestions) || state.questions.length;
            const percentage = parseInt(response.data.percentage) || 0;

            console.log('📊 Parsed Results:', {
                correctAnswers,
                totalQuestions,
                percentage,
                wrongAnswerCount: wrongAnswers.length,
                types: {
                    correctAnswers: typeof correctAnswers,
                    totalQuestions: typeof totalQuestions,
                    percentage: typeof percentage,
                    wrongAnswers: typeof wrongAnswers
                }
            });

            const newResults = {
                score: correctAnswers,
                totalQuestions,
                percentage,
                wrongAnswers
            };

            console.log('🎯 Setting state with newResults:', newResults);
            
            setState(prev => {
                console.log('📝 Previous state:', prev);
                const newState = {
                    ...prev,
                    results: newResults,
                    submitting: false,
                    stage: 'results'
                };
                console.log('📝 New state after merge:', newState);
                return newState;
            });

            console.log('✨ Results stage activated!');
        } catch (err) {
            console.error('❌ Quiz submission error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to submit quiz';
            console.error('Error details:', {
                message: errorMessage,
                stack: err.stack,
                response: err.response?.data
            });
            
            setState(prev => ({
                ...prev,
                error: errorMessage,
                submitting: false
            }));
        }
    };

    // Handle retake quiz
    const handleRetakeQuiz = () => {
        setState(prev => ({
            ...prev,
            results: null,
            stage: 'quiz',
            error: null
        }));
    };

    // Render loading state
    if (state.loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Generating Quiz</h2>
                    <p className="text-slate-600 max-w-xs">Our AI is crafting personalized questions from your PDF...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (state.error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
                <div className="bg-white rounded-3xl border border-red-200 shadow-xl p-10 max-w-md text-center">
                    <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h2>
                    <p className="text-slate-600 mb-6">{state.error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
                    >
                        Go Back to Library
                    </button>
                </div>
            </div>
        );
    }

    // Render quiz or results based on stage
    return (
        <>
            {state.stage === 'quiz' ? (
                <QuizPage
                    questions={state.questions}
                    documentId={documentId}
                    onSubmit={handleSubmitQuiz}
                    isLoading={state.submitting}
                />
            ) : state.stage === 'results' ? (
                <QuizResultsAnalysis
                    results={state.results}
                    questions={state.questions}
                    onRetry={handleRetakeQuiz}
                />
            ) : null}
        </>
    );
};

export default QuizContainer;
