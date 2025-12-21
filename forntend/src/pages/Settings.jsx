import React from 'react';
import { User, Bell, Shield, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold dark:text-white">Settings</h1>
      
      <div className="space-y-6">
        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 dark:text-white">
            <User size={20} /> Profile Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Full Name</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-md dark:text-white" defaultValue="John Doe" />
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 dark:text-white">
            <Moon size={20} /> Appearance
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">Dark Mode</span>
            <button 
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;