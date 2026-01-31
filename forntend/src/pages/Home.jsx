import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Brain, Zap, ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6 border border-blue-100">
            <Shield size={14} />
            Secure AI Processing
          </div>
          <h1 className="text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Learn Faster with <span className="text-blue-600">AI-Powered</span> Context.
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload your PDF documents and let Gemini AI generate interactive mind maps, 
            concise summaries, and smart quizzes to boost your retention.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              to="/upload" 
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight size={20} />
            </Link>
            <Link 
              to="/dashboard" 
              className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              View Library
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-6">
            <Brain size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">Conceptual Maps</h3>
          <p className="text-slate-500 leading-relaxed">
            Gemini identifies core concepts and visualizes them in an interactive graph, making complex topics easy to grasp.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">Instant Summaries</h3>
          <p className="text-slate-500 leading-relaxed">
            Get the gist of 30-page documents in seconds. Our AI extracts key points and saves you hours of reading.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-6">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">Data Privacy</h3>
          <p className="text-slate-500 leading-relaxed">
            Your documents are processed securely and stored in an encrypted MongoDB environment accessible only by you.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;