import React, { useState, useEffect } from 'react';
import { User, CheckCircle, Crown } from 'lucide-react';
import api from '../services/api';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            setUser(response.data.data.user);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
                <p className="text-slate-500">Manage your account information</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <User size={20} />
                    </div>
                    <h2 className="font-bold text-slate-800">Account Profile</h2>
                </div>
                <div className="p-6">
                    {loading ? (
                        <p>Loading profile...</p>
                    ) : user ? (
                        <form onSubmit={handleSaveProfile}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="mt-6 flex justify-between items-center">
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
        </div>
    );
};

export default Profile;
