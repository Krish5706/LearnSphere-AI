import React from 'react';
import { Sparkles, FileText, Copy, Check, Zap } from 'lucide-react';
import { useState } from 'react';

const ShortSummary = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse the text into title and bullet points
  const lines = text ? text.split('\n').filter(line => line.trim()) : [];
  const allBulletPoints = lines.filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));

  // If we have bullet points, use them directly; otherwise, create a title and look for bullet points
  let title = 'Document Summary';
  let bulletPoints = [];

  if (allBulletPoints.length > 0) {
    // AI generated bullet points directly
    bulletPoints = allBulletPoints.slice(0, 7);
  } else {
    // Fallback: first line as title, rest as potential bullet points
    title = lines[0] || 'Document Summary';
    bulletPoints = lines.slice(1).filter(line => line.trim().startsWith('-') || line.trim().startsWith('•')).slice(0, 7);
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-2">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg">SHORT SUMMARY</h3>
            <p className="text-xs text-slate-500 font-medium">Quick understanding / revision</p>
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

      {/* Content Area */}
      <div className="p-8">
        {text && text !== 'Short summary not available' && bulletPoints.length > 0 ? (
          <div className="space-y-6">
            <ul className="space-y-3">
              {bulletPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-700 leading-relaxed">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <span className="text-base font-medium">{point.replace(/^[-•]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : text === 'Short summary not available' ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-amber-50 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} />
            </div>
            <p className="text-slate-500 font-medium">Summary not available</p>
            <p className="text-xs text-slate-400 mt-1">Please try re-processing the document</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} />
            </div>
            <p className="text-slate-500 font-medium">Analysis in progress...</p>
            <p className="text-xs text-slate-400 mt-1">Generating key insights from your document</p>
          </div>
        )}
      </div>

      {/* Footer with Enhanced Badge */}
      <div className="px-8 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-500" />
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Verified AI Extraction
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {bulletPoints.length} key points identified
        </div>
      </div>
    </div>
  );
};

export default ShortSummary;
