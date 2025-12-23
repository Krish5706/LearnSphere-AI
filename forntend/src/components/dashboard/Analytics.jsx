import React from 'react';
import { BarChart3, Clock, FileCheck, Award } from 'lucide-react';

const Analytics = ({ stats }) => {
    const cards = [
        { label: 'Total PDFs', value: stats.totalDocs || 0, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Summaries', value: stats.summariesGenerated || 0, icon: FileCheck, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Avg. Score', value: `${stats.avgScore || 0}%`, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Study Time', value: `${stats.studyHours || 0}h`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {cards.map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                        <card.icon size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                        <h4 className="text-2xl font-black text-slate-800">{card.value}</h4>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Analytics;