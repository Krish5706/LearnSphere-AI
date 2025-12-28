import React, { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCcw, Send, Loader2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import QuizResultAnalysis from './QuizResultAnalysis';

const QuizList = ({ quizzes, documentId, onDownloadReport }) => {
    const navigate = useNavigate();
    const [userAnswers, setUserAnswers] = useState({}); // {qIndex: selectedOption}
    const [submitted, setSubmitted] = useState(false);
    const [quizAnalysis, setQuizAnalysis] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!quizzes || quizzes.length === 0) {
        return (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 text-center">
                <p className="text-amber-900 font-bold">No quiz available for this document yet.</p>
            </div>
        );
    }

    const handleSelectAnswer = (quizIndex, selectedAnswer) => {
        if (submitted) return;
        setUserAnswers({
            ...userAnswers,
            [quizIndex]: selectedAnswer,
        });
    };

    const handleSubmitQuiz = async () => {
        // Check if all questions answered
        const answeredCount = Object.keys(userAnswers).length;
        if (answeredCount < quizzes.length) {
            setError(`Please answer all ${quizzes.length} questions. (${answeredCount}/${quizzes.length})`);
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Convert answers to format expected by backend
            const answers = Object.entries(userAnswers).map(([qIdx, answer]) => ({
                questionId: quizzes[parseInt(qIdx)].id || parseInt(qIdx),
                selectedAnswer: answer,
            }));

            const response = await api.post('/documents/quiz/submit', {
                documentId,
                answers,
            });

            setQuizAnalysis(response.data.analysis);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Error submitting quiz. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetQuiz = () => {
        setUserAnswers({});
        setSubmitted(false);
        setQuizAnalysis(null);
        setError('');
    };

    // Show results if submitted
    if (submitted && quizAnalysis) {
        return (
            <div className="space-y-6">
                <QuizResultAnalysis
                    quizAnalysis={quizAnalysis}
                    documentId={documentId}
                    quizzes={quizzes}
                    onDownloadReport={onDownloadReport}
                />
                
                <button
                    onClick={resetQuiz}
                    className="w-full py-3 px-6 border-2 border-slate-300 rounded-xl font-bold text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCcw size={18} />
                    Retake Quiz
                </button>
            </div>
        );
    }

    // Show quiz questions
    return (
        <div className="space-y-8 pb-20">
            {/* Start Quiz Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-10 text-white text-center shadow-xl">
                <h2 className="text-3xl font-black mb-3">Ready for an Interactive Quiz?</h2>
                <p className="mb-6 max-w-2xl mx-auto text-blue-100">
                    Experience our full-featured quiz with timer, detailed explanations, and comprehensive performance analysis.
                </p>
                <button
                    onClick={() => navigate(`/quiz/${documentId}`)}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                    <Play size={20} fill="currentColor" />
                    Start Interactive Quiz
                </button>
            </div>

            {/* Header */}
            {/* Quick Preview section removed - use Start Interactive Quiz button above */}

            {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Note: Inline quiz preview removed - use "Start Interactive Quiz" button above */}
        </div>
    );
};

export default QuizList;
