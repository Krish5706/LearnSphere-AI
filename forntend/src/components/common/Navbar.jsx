import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, FileUp, CheckSquare, Layers, Crown } from 'lucide-react';
import ProfileDropdown from './Dropdown';
import PremiumPlansModal from './PremiumPlansModal';

const Navbar = () => {
  const location = useLocation();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Security Helper: Check if the user is currently on an active route
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/') ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100";

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-blue-600" size={28} />
        <Link to="/" className="text-xl font-bold text-slate-800 tracking-tight">
          LearnSphere <span className="text-blue-600">AI</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/upload" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${isActive('/upload')}`}>
          <FileUp size={18} /> Upload
        </Link>
        <Link to="/dashboard" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${isActive('/dashboard')}`}>
          <LayoutDashboard size={18} /> Library
        </Link>
        <Link to="/flashcards" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${isActive('/flashcards')}`}>
          <Layers size={18} /> Flashcards
        </Link>
        <Link to="/todos" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${isActive('/todos')}`}>
          <CheckSquare size={18} /> Tasks
        </Link>

        <button
          type="button"
          onClick={() => setShowPremiumModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
        >
          <Crown size={18} /> Premium
        </button>

        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

        <ProfileDropdown />
      </div>

      <PremiumPlansModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Upgrade to LearnSphere Premium"
      />
    </nav>
  );
};

export default Navbar;