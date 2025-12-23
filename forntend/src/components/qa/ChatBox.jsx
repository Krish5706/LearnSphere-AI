import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import api from '../../services/api';

const ChatBox = ({ documentId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Security: Request is sent with JWT and documentId context
            const response = await api.post(`/api/qa/ask`, {
                documentId,
                question: input
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing that request." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Document Assistant</h3>
                        <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Powered by Gemini</p>
                    </div>
                </div>
                <Sparkles size={18} className="text-blue-400" />
            </div>

            {/* Message Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                    <div className="text-center py-10">
                        <Bot size={40} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-400 text-sm">Ask me anything about this document!</p>
                    </div>
                )}
                
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                            <Loader2 className="animate-spin text-blue-600" size={16} />
                            <span className="text-xs text-slate-400 font-medium">Gemini is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-grow p-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button 
                    disabled={!input.trim() || isTyping}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-md shadow-blue-100"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatBox;