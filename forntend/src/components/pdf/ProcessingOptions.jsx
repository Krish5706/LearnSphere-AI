import React, { useState } from 'react';
import { FileText, BookOpen, BrainCircuit, Zap, Loader2 } from 'lucide-react';
import api, { generateMindMap } from '../../services/api';

const ProcessingOptions = ({ documentId, onProcessingComplete, onCancel }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [summaryType, setSummaryType] = useState('short');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const options = [
        {
            id: 'summary',
            title: 'Generate Summary',
            description: 'Get short, medium, or detailed summaries of your document',
            icon: FileText,
            color: 'blue',
            hasSubOptions: true,
        },
        {
            id: 'quiz',
            title: 'Create Quiz',
            description: 'Generate interactive quiz to test your knowledge',
            icon: BookOpen,
            color: 'purple',
        },
        {
            id: 'mindmap',
            title: 'Mind Map',
            description: 'Visualize concepts and their relationships (LLM-Free, Offline)',
            icon: BrainCircuit,
            color: 'green',
        },
        {
            id: 'comprehensive',
            title: 'Complete Analysis',
            description: 'Get everything: summaries, quiz, and mind map',
            icon: Zap,
            color: 'amber',
        },
    ];

    const handleProcess = async () => {
        if (!selectedOption) {
            setError('Please select an option');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            let response;
            
            // Mind map uses LLM-free endpoint (no credits, no Gemini)
            if (selectedOption === 'mindmap') {
                response = await generateMindMap(documentId);
            } else {
                // Summary, Quiz, and Comprehensive use Gemini (requires credits)
                const processingType = selectedOption === 'summary' ? 'comprehensive' : selectedOption;
                
                response = await api.post('/documents/process', {
                    documentId,
                    processingType,
                    summaryType: selectedOption === 'summary' ? summaryType : undefined,
                });
            }

            onProcessingComplete(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Processing failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900">
                        Choose Analysis Type
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-slate-600 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {options.map((option) => {
                            const Icon = option.icon;
                            const colorClasses = {
                                blue: 'border-blue-200 bg-blue-50 hover:border-blue-400',
                                purple: 'border-purple-200 bg-purple-50 hover:border-purple-400',
                                green: 'border-green-200 bg-green-50 hover:border-green-400',
                                amber: 'border-amber-200 bg-amber-50 hover:border-amber-400',
                            };

                            const iconColorClasses = {
                                blue: 'text-blue-600',
                                purple: 'text-purple-600',
                                green: 'text-green-600',
                                amber: 'text-amber-600',
                            };

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setSelectedOption(option.id)}
                                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                                        selectedOption === option.id
                                            ? colorClasses[option.color] + ' ring-2 ring-offset-2'
                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon className={`mb-3 ${iconColorClasses[option.color]}`} size={28} />
                                    <h3 className="font-bold text-slate-900 mb-1">{option.title}</h3>
                                    <p className="text-xs text-slate-600">{option.description}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Summary Type Selection */}
                    {selectedOption === 'summary' && (
                        <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-4">Select Summary Type</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'short', label: 'Short', desc: '2-3 sentences' },
                                    { value: 'medium', label: 'Medium', desc: '5-7 sentences' },
                                    { value: 'detailed', label: 'Detailed', desc: '10-15 sentences' },
                                ].map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setSummaryType(type.value)}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                                            summaryType === type.value
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <p className="font-bold text-sm text-slate-900">{type.label}</p>
                                        <p className="text-xs text-slate-500 mt-1">{type.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Information */}
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-xs text-blue-700 font-bold">
                            {selectedOption === 'mindmap' ? (
                                <>🧠 Mind maps are generated using LLM-free statistical NLP. No credits required, fully offline!</>
                            ) : (
                                <>💡 This will use 1 credit from your account. {selectedOption === 'comprehensive' && 'Complete analysis includes all options.'}</>
                            )}
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 px-6 border-2 border-slate-200 rounded-xl font-bold text-slate-900 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleProcess}
                            disabled={!selectedOption || isProcessing}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                selectedOption && !isProcessing
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {selectedOption === 'mindmap' ? (
                                        <>
                                            <BrainCircuit size={18} />
                                            Generate Mind Map (Offline)
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={18} />
                                            Process with Gemini
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessingOptions;
