import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Layers, Download, Copy, Check, FileText, Target } from 'lucide-react';

const DetailedSummary = ({ content, fileName, keyInsights }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}_Detailed_Summary.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-2">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-xl">DETAILED SUMMARY</h2>
            <p className="text-xs text-slate-500 font-medium">Deep understanding & study material</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-blue-600 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-blue-600 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {content && content !== 'Detailed summary not available' ? (
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} />
            </div>
            <p className="text-slate-500 font-medium">Detailed Summary not available</p>
            <p className="text-xs text-slate-400 mt-1">Please try re-processing the document</p>
          </div>
        )}
      </div>

      <div className="px-8 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-blue-500" />
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Detailed Analysis
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {keyInsights?.length || 0} key concepts identified
        </div>
      </div>
    </div>

    
  );
};

export default DetailedSummary;
