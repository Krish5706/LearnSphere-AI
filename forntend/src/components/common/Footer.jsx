import React from 'react';
import { ShieldCheck, Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="text-blue-600" size={24} />
                            <span className="text-xl font-bold text-slate-800">LearnSphere <span className="text-blue-600">AI</span></span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Revolutionizing the way you learn by turning complex documents into interactive visual insights and smart assessments.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-slate-500">
                            <li><a href="/upload" className="hover:text-blue-600 transition-colors">Upload PDF</a></li>
                            <li><a href="/dashboard" className="hover:text-blue-600 transition-colors">My Library</a></li>
                            <li><a href="/" className="hover:text-blue-600 transition-colors">Features</a></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-slate-500">
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
                            <li><a href="/settings" className="hover:text-blue-600 transition-colors">API Settings</a></li>
                            <li><a href="mailto:support@learnsphere.ai" className="hover:text-blue-600 transition-colors">Contact Us</a></li>
                        </ul>
                    </div>

                    {/* Legal & Security */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Trust & Safety</h4>
                        <ul className="space-y-2 text-sm text-slate-500">
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                            <li className="flex items-center gap-2 text-green-600 font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                AES-256 Encrypted
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-xs">
                        © {currentYear} LearnSphere AI. All rights reserved. Built with Gemini 1.5 Flash.
                    </p>
                    <div className="flex items-center gap-6 text-slate-400">
                        <a href="#" className="hover:text-slate-600 transition-colors"><Github size={20} /></a>
                        <a href="#" className="hover:text-slate-600 transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="hover:text-slate-600 transition-colors"><Linkedin size={20} /></a>
                        <a href="#" className="hover:text-slate-600 transition-colors"><Mail size={20} /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;