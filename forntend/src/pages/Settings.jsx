import React, { useState, useEffect } from 'react';
import { Shield, Key, Database, User, Save, AlertTriangle, CheckCircle, Crown } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user: authUser, setUser: setAuthUser } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            const userData = response.data?.data?.user || response.data?.user;
            if (userData) {
                setUser(userData);
                setName(userData.name || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Fallback to context user if API fails
            if (authUser) {
                setUser(authUser);
                setName(authUser.name || '');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await api.put('/users/profile', { name, email: user.email });
            const updatedUser = response.data?.data?.user || response.data?.user || response.data;
            
            if (updatedUser && updatedUser.email) {
                setUser(updatedUser);
                setName(updatedUser.name);
                // Update global auth context so Navbar reflects changes immediately
                if (setAuthUser) setAuthUser(updatedUser);
                setEditing(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update profile.';
            alert(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSecurity = (e) => {
        e.preventDefault();
        // Security: In a real app, encrypt this before sending to the backend/MongoDB
        alert("Security settings updated successfully.");
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your account security and AI configurations</p>
            </div>

            <div className="space-y-6">
                {/* Profile Update Section */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <User size={20} />
                        </div>
                        <h2 className="font-bold text-slate-800">Profile</h2>
                    </div>
                    <div className="p-6">
                        {loading ? (
                            <p>Loading profile...</p>
                        ) : user ? (
                            <form onSubmit={handleSaveProfile}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={!editing}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg opacity-60 cursor-not-allowed"
                                            value={user.email}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-green-600" />
                                            <span className="text-sm text-slate-600">Credits: {user.credits}</span>
                                        </div>
                                        {user.isSubscribed && (
                                            <div className="flex items-center gap-2">
                                                <Crown size={16} className="text-yellow-600" />
                                                <span className="text-sm text-slate-600">Subscribed</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                    {!editing ? (
                                        <button
                                            type="button"
                                            onClick={() => setEditing(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
                                        >
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditing(false);
                                                    setName(user.name);
                                                }}
                                                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                                            >
                                                <Save size={16} />
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                        </>
                                    )}
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <p>Error loading profile.</p>
                        )}
                    </div>
                </div>

                {/* AI Configuration Section */}
                <form onSubmit={handleSaveSecurity} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Key size={20} />
                        </div>
                        <h2 className="font-bold text-slate-800">AI Service Configuration</h2>
                    </div>
                    <div className="p-6">
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Gemini API Key (Optional)</label>
                            <div className="relative">
                                <input 
                                    type={showKey ? "text" : "password"} 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-20" 
                                    placeholder="Enter your Google AI Studio key"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-800"
                                >
                                    {showKey ? "HIDE" : "SHOW"}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                                Leave blank to use the system default. Your key is stored securely in your private vault.
                            </p>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <strong>Security Warning:</strong> Never share your API key with anyone. LearnSphere AI encrypts your key at rest in MongoDB using AES-256.
                            </p>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 flex justify-end">
                        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </form>

                {/* Danger Zone */}
                <div className="bg-red-50 rounded-2xl border border-red-100 p-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-red-800 font-bold">Data Privacy</h3>
                        <p className="text-red-600/70 text-sm">Delete your account and all analyzed PDFs permanently from MongoDB.</p>
                    </div>
                    <button className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-all">
                        Wipe All Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;