import React from 'react';
import { Settings2, Play, BrainCircuit } from 'lucide-react';

const QuizGenerator = ({ onGenerate, isGenerating }) => {
  return (
    <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <BrainCircuit size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready for a Challenge?</h2>
      <p className="text-slate-500 max-w-sm mx-auto mb-8">
        Generate a custom assessment based on the specific context of your document.
      </p>
      
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all flex items-center gap-2 mx-auto disabled:bg-slate-300"
      >
        {isGenerating ? 'AI is Crafting Questions...' : 'Generate Smart Quiz'}
        {!isGenerating && <Play size={18} fill="currentColor" />}
      </button>
    </div>
  );
};

export default QuizGenerator;