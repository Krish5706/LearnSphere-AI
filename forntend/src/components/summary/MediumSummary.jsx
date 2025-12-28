import React from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Target, CheckCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const MediumSummary = ({ content, keyInsights }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullContent = `${content}\n\nKey Concepts:\n${keyInsights?.map(insight => `- ${insight}`).join('\n')}\n\nConclusion:\nThis summary provides a balanced overview of the document's main ideas and concepts.`;
    navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse content for title, introduction, and conclusion
  const lines = content ? content.split('\n').filter(line => line.trim()) : [];
  const title = lines[0] || 'Document Summary';
  const introduction = lines.slice(1, 4).join(' ') || 'This document provides valuable insights into key concepts and ideas.';
  const conclusion = lines.slice(-2).join(' ') || 'This summary captures the essential elements of the document.';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-xl">MEDIUM SUMMARY</h2>
            <p className="text-xs text-slate-500 font-medium">Balanced explanation with clarity</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-blue-600 rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8">

        {/* Introduction */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-3">Introduction:</h4>
          <p className="text-slate-600 leading-relaxed">{introduction}</p>
        </div>

        {/* Key Concepts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h4 className="font-bold text-slate-800 mb-4">Key Concepts:</h4>
          <ul className="space-y-3">
            {keyInsights?.slice(0, 8).map((insight, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700 leading-relaxed">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-base">{insight}</span>
              </li>
            )) || (
              <li className="text-slate-500 italic">Key concepts will be extracted from the document analysis.</li>
            )}
          </ul>
        </div>

        {/* Conclusion */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h4 className="font-bold text-slate-800 mb-3">Conclusion:</h4>
          <p className="text-slate-600 leading-relaxed">{conclusion}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-blue-500" />
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Structured Analysis
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {keyInsights?.length || 0} key concepts identified
        </div>
      </div>
    </div>
  );
};

export default MediumSummary;
