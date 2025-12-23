import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, FileText, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const ShortSummary = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2 text-blue-600">
          <Sparkles size={20} />
          <h3 className="font-bold text-slate-800">AI Executive Summary</h3>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Summary'}
        </button>
      </div>

      {/* Content Area */}
      <div className="p-8">
        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
          {/* Security Note: ReactMarkdown by default escapes HTML, 
            preventing XSS (Cross-Site Scripting) attacks from 
            maliciously crafted AI outputs. 
          */}
          <ReactMarkdown>
            {text || "Analysis in progress..."}
          </ReactMarkdown>
        </div>
      </div>

      {/* Footer / Badge */}
      <div className="px-6 py-3 bg-blue-50/50 border-t border-blue-100 flex items-center gap-2">
        <FileText size={14} className="text-blue-400" />
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
          Verified Content Extraction
        </span>
      </div>
    </div>
  );
};

export default ShortSummary;