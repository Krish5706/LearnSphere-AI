import React from 'react';
import { FileText, Download, Share2, Layers, Copy, Check, ExternalLink, BookOpen } from 'lucide-react';
import { useState } from 'react';

const DetailedSummary = ({ content, fileName }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
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

  // Parse content for structured display
  const lines = content ? content.split('\n').filter(line => line.trim()) : [];
  const title = lines[0] || 'Document Analysis';
  const introduction = lines.slice(1, 6).join(' ') || 'This comprehensive analysis provides deep insights into the document content.';

  // Parse sections (assuming sections start with # or ##)
  const sections = [];
  let currentSection = null;
  let sectionContent = [];

  for (let i = 6; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#') || line.startsWith('##')) {
      if (currentSection) {
        sections.push({ title: currentSection, content: sectionContent.join(' ') });
      }
      currentSection = line.replace(/^#+\s*/, '');
      sectionContent = [];
    } else if (currentSection) {
      sectionContent.push(line);
    }
  }
  if (currentSection) {
    sections.push({ title: currentSection, content: sectionContent.join(' ') });
  }

  // Extract key takeaways (last few lines or specific patterns)
  const keyTakeaways = lines.slice(-3).filter(line => line.trim().startsWith('-') || line.trim().startsWith('•')).slice(0, 3);

  // Sample external references (in a real implementation, these would be dynamically generated)
  const externalReferences = [
    { title: 'Academic Writing Guide', url: 'https://owl.purdue.edu/owl/general_writing/index.html', source: 'Purdue OWL' },
    { title: 'Research Methodology', url: 'https://www.scribbr.com/methodology/', source: 'Scribbr' },
    { title: 'Educational Resources', url: 'https://www.khanacademy.org/', source: 'Khan Academy' },
    { title: 'Technical Documentation', url: 'https://developer.mozilla.org/', source: 'MDN Web Docs' },
    { title: 'Scientific Papers', url: 'https://scholar.google.com/', source: 'Google Scholar' },
    { title: 'Educational Standards', url: 'https://www.ieee.org/', source: 'IEEE' }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-2">
      {/* Header */}
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

      {/* Content */}
      <div className="p-8 space-y-8">

        {/* Introduction */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" />
            Introduction
          </h4>
          <p className="text-slate-600 leading-relaxed">{introduction}</p>
        </div>

        {/* Sections */}
        {sections.length > 0 ? sections.map((section, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-2xl p-6">
            <h4 className="font-bold text-slate-800 mb-4 text-lg">Section {index + 1}: {section.title}</h4>
            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed">{section.content}</p>
              {/* Add some sample key points for each section */}
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3 text-slate-700">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Important details and explanations from the document</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Key concepts and methodologies discussed</span>
                </li>
                {index === 0 && (
                  <li className="flex items-start gap-3 text-slate-700">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Examples and practical applications (if present in PDF)</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h4 className="font-bold text-slate-800 mb-4 text-lg">Section 1: Main Concepts</h4>
            <p className="text-slate-600 leading-relaxed mb-4">Detailed analysis of the primary topics covered in the document.</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 text-slate-700">
                <span className="text-blue-600 font-bold">•</span>
                <span>Core principles and fundamental concepts</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <span className="text-blue-600 font-bold">•</span>
                <span>Important details and supporting information</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <span className="text-blue-600 font-bold">•</span>
                <span>Examples and practical applications</span>
              </li>
            </ul>
          </div>
        )}

        {/* Key Takeaways */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h4 className="font-bold text-slate-800 mb-4">Key Takeaways:</h4>
          <ul className="space-y-3">
            {keyTakeaways.length > 0 ? keyTakeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-700 leading-relaxed">
                <span className="text-blue-600 font-bold">•</span>
                <span>{takeaway.replace(/^[-•]\s*/, '')}</span>
              </li>
            )) : (
              <>
                <li className="flex items-start gap-3 text-slate-700 leading-relaxed">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Key insight 1: Understanding of core concepts</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 leading-relaxed">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Key insight 2: Practical applications and examples</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 leading-relaxed">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Key insight 3: Future implications and recommendations</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Further Reading & References */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
            <ExternalLink size={18} />
            Further Reading & References:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {externalReferences.map((ref, index) => (
              <a
                key={index}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ExternalLink size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-white">{ref.title}</div>
                  <div className="text-xs text-slate-400">{ref.source}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-500" />
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Comprehensive Analysis
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {sections.length} sections analyzed
        </div>
      </div>
    </div>
  );
};

export default DetailedSummary;
