import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, ArrowRight, BookOpen, FileText, Map, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <motion.section
        className="w-full py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6 border border-blue-100"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Shield size={14} />
            Secure AI Processing
          </motion.div>
          <motion.h1
            className="text-6xl font-extrabold text-slate-900 mb-6 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            Learn Faster with <span className="text-blue-600">AI-Powered</span> Context.
          </motion.h1>
          <motion.p
            className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            Upload your PDF documents and let Gemini AI generate interactive mind maps,
            concise summaries, and smart quizzes to boost your retention.
          </motion.p>
          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
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
          </motion.div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        className="py-20 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div
          className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">Instant Summaries</h3>
          <p className="text-slate-500 leading-relaxed">
            Get the gist of 30-page documents in seconds. Our AI extracts key points and saves you hours of reading.
          </p>
        </motion.div>

        <motion.div
          className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-6">
            <BookOpen size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">Smart Quizzes</h3>
          <p className="text-slate-500 leading-relaxed">
            Test your knowledge with AI-generated quizzes tailored to your documents, enhancing retention and understanding.
          </p>
        </motion.div>

        <motion.div
          className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-6">
            <FileText size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">Notes</h3>
          <p className="text-slate-500 leading-relaxed">
            Capture and organize your thoughts with AI-enhanced note-taking features tailored to your learning materials.
          </p>
        </motion.div>

        <motion.div
          className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mb-6">
            <Map size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">Learning Roadmap</h3>
          <p className="text-slate-500 leading-relaxed">
            Visualize your learning journey with personalized roadmaps that guide you through complex topics step by step.
          </p>
        </motion.div>

        <motion.div
          className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mb-6">
            <CheckSquare size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">To Do List</h3>
          <p className="text-slate-500 leading-relaxed">
            Stay on track with intelligent task management that adapts to your study schedule and goals.
          </p>
        </motion.div>

        <motion.div
          className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.05, y: -10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-6">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold mb-3">Data Privacy</h3>
          <p className="text-slate-500 leading-relaxed">
            Your documents are processed securely and stored in an encrypted MongoDB environment accessible only by you.
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default Home;