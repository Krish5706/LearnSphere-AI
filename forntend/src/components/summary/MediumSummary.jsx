import React from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, ListChecks, Target } from 'lucide-react';

const MediumSummary = ({ content, keyInsights }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      {/* Narrative Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-blue-600">
          <BookOpen size={20} />
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Core Narrative</h3>
        </div>
        <div className="prose prose-slate max-w-none prose-p:text-slate-600">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>

      {/* Structured Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-200">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <Target size={20} />
            <h3 className="font-bold uppercase text-[10px] tracking-widest">Key Takeaways</h3>
          </div>
          <ul className="space-y-3">
            {keyInsights?.map((insight, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-slate-300">
                <span className="text-blue-500 font-bold">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
          <div className="flex items-center gap-2 mb-4 text-blue-700">
            <ListChecks size={20} />
            <h3 className="font-bold uppercase text-[10px] tracking-widest">Actionable Items</h3>
          </div>
          <p className="text-sm text-blue-900/70 leading-relaxed italic">
            Gemini identified specific steps or methodologies mentioned in the text. 
            Check the Quiz section to test your knowledge on these specific items.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediumSummary;