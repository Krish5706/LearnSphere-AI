import React, { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCcw, HelpCircle, ChevronRight } from 'lucide-react';

const QuizList = ({ quizzes }) => {
    const [userAnswers, setUserAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleSelect = (quizIndex, optionIndex) => {
        if (submitted) return;
        setUserAnswers({ ...userAnswers, [quizIndex]: optionIndex });
    };

    const handleSubmit = () => {
        let currentScore = 0;
        quizzes.forEach((quiz, index) => {
            if (userAnswers[index] === quiz.correctAnswer) {
                currentScore++;
            }
        });
        setScore(currentScore);
        setSubmitted(true);
    };

    const resetQuiz = () => {
        setUserAnswers({});
        setSubmitted(false);
        setScore(0);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Knowledge Check</h2>
                    <p className="text-slate-500 text-sm">Based on the uploaded document</p>
                </div>
                {submitted && (
                    <div className="text-right">
                        <span className="text-3xl font-black text-blue-600">{score}/{quizzes.length}</span>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Final Score</p>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {quizzes.map((quiz, qIdx) => (
                    <div key={qIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6">
                            <div className="flex gap-3 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                                    {qIdx + 1}
                                </span>
                                <p className="text-lg font-semibold text-slate-800">{quiz.question}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 ml-11">
                                {quiz.options.map((option, oIdx) => {
                                    const isSelected = userAnswers[qIdx] === oIdx;
                                    const isCorrect = quiz.correctAnswer === oIdx;
                                    
                                    let variant = "border-slate-100 hover:border-blue-200 hover:bg-slate-50";
                                    if (isSelected) variant = "border-blue-500 bg-blue-50 ring-1 ring-blue-500";
                                    if (submitted && isCorrect) variant = "border-green-500 bg-green-50 ring-1 ring-green-500";
                                    if (submitted && isSelected && !isCorrect) variant = "border-red-500 bg-red-50 ring-1 ring-red-500";

                                    return (
                                        <button
                                            key={oIdx}
                                            disabled={submitted}
                                            onClick={() => handleSelect(qIdx, oIdx)}
                                            className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center ${variant}`}
                                        >
                                            <span className={`text-sm font-medium ${isSelected || (submitted && isCorrect) ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {option}
                                            </span>
                                            {submitted && isCorrect && <CheckCircle2 size={18} className="text-green-600" />}
                                            {submitted && isSelected && !isCorrect && <XCircle size={18} className="text-red-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {submitted && (
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-600 italic">
                                <strong>Explanation:</strong> {quiz.explanation}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6">
                {!submitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(userAnswers).length < quizzes.length}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        Submit Assessment <ChevronRight size={20} />
                    </button>
                ) : (
                    <button
                        onClick={resetQuiz}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-300 hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={18} /> Retake Quiz
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizList;