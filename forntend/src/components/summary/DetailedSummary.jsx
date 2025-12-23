import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Download, Share2, Layers } from 'lucide-react';

const DetailedSummary = ({ content, fileName }) => {
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}_Detailed_Summary.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-700">
      {/* Tool Bar */}
      <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg">
            <Layers size={20} />
          </div>
          <h2 className="font-bold text-slate-800 text-lg">Deep Analysis Report</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-10">
        <div className="prose prose-blue max-w-none 
          prose-h1:text-3xl prose-h1:font-black prose-h1:text-slate-900 
          prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:text-blue-700
          prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg
          prose-li:text-slate-600 prose-strong:text-slate-900">
          
          <ReactMarkdown>
            {content || "# Preparing Analysis...\n\nPlease wait while Gemini processes the full context of your document."}
          </ReactMarkdown>
        </div>
      </div>

      {/* Security Stamp */}
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          LearnSphere Secure AI Engine v1.0
        </span>
        <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
          <FileText size={12} /> Data Isolated
        </div>
      </div>
    </div>
  );
};

export default DetailedSummary;