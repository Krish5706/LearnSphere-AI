import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Security: Connects to /api/auth/forgot-password
            // Backend should send a limited-time JWT token via email
            console.log("Requesting reset for:", email);
            
            // We simulate a successful request
            setSubmitted(true);
        } catch (err) {
            setError("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <KeyRound size={32} />
                        </div>
                    </div>

                    {!submitted ? (
                        <>
                            <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Reset Password</h2>
                            <p className="text-center text-slate-500 mb-8 text-sm">
                                Enter your email and we'll send you a secure link to reset your password.
                            </p>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="email" 
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
                                >
                                    {loading ? "Sending..." : "Send Reset Link"} <Send size={18} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center mb-4 text-green-500">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h2>
                            <p className="text-slate-500 mb-8 text-sm">
                                If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                            </p>
                            <Link 
                                to="/login" 
                                className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
                            >
                                <ArrowLeft size={18} /> Back to Login
                            </Link>
                        </div>
                    )}
                </div>

                {!submitted && (
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
                        <Link to="/login" className="text-sm text-slate-500 hover:text-blue-600 flex items-center justify-center gap-2">
                            <ArrowLeft size={16} /> Remembered your password?
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;