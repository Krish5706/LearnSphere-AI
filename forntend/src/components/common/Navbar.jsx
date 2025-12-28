import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, FileUp } from 'lucide-react';
import ProfileDropdown from './Dropdown';

const Navbar = () => {
  const location = useLocation();

  // Security Helper: Check if the user is currently on an active route
  const isActive = (path) => location.pathname === path ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100";

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
          <LayoutDashboard size={18} /> My Library
        </Link>

        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

        <ProfileDropdown />
      </div>
    </nav>
  );
};

export default Navbar;