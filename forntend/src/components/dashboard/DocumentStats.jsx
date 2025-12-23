import React from 'react';
import { Target, Zap, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * DocumentStats Component
 * Renders specific metrics for an individual PDF document.
 */
const DocumentStats = ({ stats }) => {
    // stats expected: { analysisProgress: 100, quizScore: 85, timeSpent: '45m', status: 'completed' }

    const metrics = [
        {
            label: 'Analysis',
            value: `${stats?.analysisProgress || 0}%`,
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-50'
        },
        {
            label: 'Top Quiz',
            value: stats?.quizScore ? `${stats.quizScore}%` : 'N/A',
            icon: Target,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        },
        {
            label: 'Time Spent',
            value: stats?.timeSpent || '0m',
            icon: Clock,
            color: 'text-slate-500',
            bg: 'bg-slate-100'
        }
    ];

    return (
        <div className="flex flex-wrap gap-4 items-center">
            {metrics.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className={`p-1 rounded-md ${item.bg} ${item.color}`}>
                        <item.icon size={14} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase leading-none tracking-tighter">
                            {item.label}
                        </span>
                        <span className="text-sm font-bold text-slate-800 leading-tight">
                            {item.value}
                        </span>
                    </div>
                </div>
            ))}

            {/* Status Badge */}
            <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest ${
                stats?.status === 'completed' 
                ? 'bg-green-50 text-green-600 border border-green-100' 
                : 'bg-slate-50 text-slate-400 border border-slate-100'
            }`}>
                {stats?.status === 'completed' ? (
                    <>
                        <CheckCircle2 size={14} /> AI Ready
                    </>
                ) : (
                    <>
                        <AlertCircle size={14} /> Processing
                    </>
                )}
            </div>
        </div>
    );
};

export default DocumentStats;