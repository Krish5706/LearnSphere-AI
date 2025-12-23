import React from 'react';
import { Award, RefreshCcw, LayoutDashboard, CheckCircle2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuizResult = ({ score, total, onRetry }) => {
    const percentage = Math.round((score / total) * 100);
    
    // Security/UX logic: Dynamic feedback based on performance
    const getFeedback = () => {
        if (percentage >= 80) return { title: "Expert Level!", color: "text-green-600", msg: "You've mastered this document's core concepts." };
        if (percentage >= 50) return { title: "Good Progress", color: "text-blue-600", msg: "You have a solid grasp, but a quick review could help." };
        return { title: "Keep Learning", color: "text-amber-600", msg: "This was a tough one. Try reviewing the Mind Map." };
    };

    const feedback = getFeedback();

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="p-10 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Award size={40} />
                </div>
                
                <h2 className={`text-3xl font-black mb-2 ${feedback.color}`}>{feedback.title}</h2>
                <p className="text-slate-500 mb-8">{feedback.msg}</p>

                <div className="flex justify-center items-baseline gap-2 mb-10">
                    <span className="text-6xl font-black text-slate-900">{score}</span>
                    <span className="text-2xl text-slate-400 font-bold">/ {total}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-4 rounded-full mb-10 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out ${percentage > 50 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={onRetry}
                        className="flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                        <RefreshCcw size={18} /> Retake
                    </button>
                    <Link 
                        to="/dashboard"
                        className="flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                        <LayoutDashboard size={18} /> Library
                    </Link>
                </div>
            </div>

            {/* Security Footer Note */}
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
                <TrendingUp size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Performance data synced to secure MongoDB
                </span>
            </div>
        </div>
    );
};

export default QuizResult;