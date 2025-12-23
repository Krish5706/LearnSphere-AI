import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, FileUp, LogOut } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Security Helper: Check if the user is currently on an active route
  const isActive = (path) => location.pathname === path ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100";

  const handleLogout = () => {
    // Security: Clear session/token data on logout
    localStorage.removeItem('token');
    navigate('/login');
  };

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

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
          title="Secure Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;