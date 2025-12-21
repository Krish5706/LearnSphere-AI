import React from 'react';
import { FileText, Clock, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const documents = [
    { id: 1, name: "Quantum Physics.pdf", date: "2 mins ago", size: "2.4MB" },
    { id: 2, name: "Intro to React.pdf", date: "1 day ago", size: "1.1MB" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Your Library</h1>
          <p className="text-slate-600 dark:text-slate-400">Continue where you left off</p>
        </div>
        <Link to="/upload" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">+ New Upload</Link>
      </div>

      <div className="grid gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-semibold dark:text-white">{doc.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={12} /> {doc.date}</span>
                  <span>{doc.size}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
              <Link to={`/document/${doc.id}`} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition">
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;