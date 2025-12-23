import React, { useState } from 'react';
import { SendHorizonal, Info } from 'lucide-react';

/**
 * QuestionInput Component
 * Handles the user input for the AI chat interface.
 * Implements client-side validation to ensure efficient API usage.
 */
const QuestionInput = ({ onSend, isDisabled }) => {
    const [query, setQuery] = useState('');
    const MAX_CHARS = 500; // Security: Prevent oversized payload attacks

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() && !isDisabled) {
            onSend(query.trim());
            setQuery('');
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="relative">
                <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Ask Gemini about a specific chapter or concept..."
                    disabled={isDisabled}
                    className="w-full pl-5 pr-16 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed text-slate-700 placeholder:text-slate-400"
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {/* Character Counter (Subtle Security UI) */}
                    <span className={`text-[10px] font-bold ${query.length >= MAX_CHARS ? 'text-red-500' : 'text-slate-300'}`}>
                        {query.length}/{MAX_CHARS}
                    </span>
                    
                    <button 
                        type="submit"
                        disabled={!query.trim() || isDisabled}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md shadow-blue-100"
                    >
                        <SendHorizonal size={18} />
                    </button>
                </div>
            </form>
            
            <div className="mt-2 flex items-center gap-1.5 px-2">
                <Info size={12} className="text-slate-400" />
                <p className="text-[10px] text-slate-400 font-medium italic">
                    For best results, ask specific questions like "Summarize the methodology section."
                </p>
            </div>
        </div>
    );
};

export default QuestionInput;