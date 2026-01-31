import React from 'react';
import { LayoutDashboard, FileUp, Settings, LogOut, BookOpen, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Dashboard Component (Component-level)
 * This acts as the Layout Wrapper for all authenticated dashboard views.
 * It provides the sidebar and top-level navigation structure.
 */
const DashboardComponent = ({ children, user }) => {
    const location = useLocation();
    
    const menuItems = [
        { name: 'Library', path: '/dashboard', icon: BookOpen },
        { name: 'Study Tasks', path: '/todos', icon: CheckCircle2 },
        { name: 'Upload PDF', path: '/upload', icon: FileUp },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
                <div className="p-8">
                    <div className="flex items-center gap-2 font-black text-2xl text-blue-600">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs">LS</span>
                        </div>
                        LearnSphere
                    </div>
                </div>
                
                <nav className="flex-grow px-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link 
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                                    isActive 
                                    ? 'bg-blue-50 text-blue-600' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Summary & Logout */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-3 mb-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                            <User size={20} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'Student'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate">Pro Plan</p>
                        </div>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all">
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-grow flex flex-col">
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                    <span className="font-black text-blue-600">LearnSphere</span>
                    <button className="p-2 bg-slate-100 rounded-lg"><LayoutDashboard size={20} /></button>
                </header>

                <main className="p-4 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardComponent;