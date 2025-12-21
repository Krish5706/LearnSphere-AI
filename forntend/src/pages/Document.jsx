import React, { useState } from 'react';
import ShortSummary from '../components/summary/ShortSummary';
import ChatBox from '../components/qa/ChatBox';
import MindMap from '../components/mindmap/MindMap';

const Document = () => {
  const [activeTool, setActiveTool] = useState('summary');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* LEFT: PDF Reader (Col 7) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
          <span className="font-semibold text-blue-900">Lecture_Notes.pdf</span>
          <span className="text-xs text-slate-500 uppercase tracking-widest">Reader Mode</span>
        </div>
        <div className="grow p-4 overflow-y-auto bg-slate-100 flex justify-center items-start">
          {/* PDF goes here */}
          <div className="w-full max-w-2xl aspect-[1/1.4] bg-white shadow-lg rounded-sm"></div>
        </div>
      </div>

      {/* RIGHT: AI Tools (Col 5) */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden">
        <div className="flex bg-white p-1 rounded-xl border border-blue-100 shadow-sm">
          {['summary', 'mindmap', 'qa'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTool(tab)}
              className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg transition ${
                activeTool === tab ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grow bg-white rounded-2xl border border-blue-100 shadow-sm p-6 overflow-y-auto">
          {activeTool === 'summary' && <ShortSummary />}
          {activeTool === 'mindmap' && <MindMap />}
          {activeTool === 'qa' && <ChatBox />}
        </div>
      </div>
    </div>
  );
};

export default Document;