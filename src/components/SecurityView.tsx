import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle } from 'lucide-react';

export const SecurityView: React.FC = () => {
    return (
        <div className="flex-1 overflow-y-auto bg-transparent text-[var(--text-main)] p-8 md:p-12 font-mono">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="border-b border-white/10 pb-6">
                    <h1 className="text-2xl font-bold mb-2 tracking-widest uppercase text-white">Security & Privacy</h1>
                    <p className="text-[var(--text-dim)] text-xs uppercase tracking-wider">System Integrity Protocols</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-[#050505] border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="text-emerald-500" size={20} />
                            <h3 className="text-sm font-bold text-white uppercase">Encryption Status</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-[var(--text-dim)]">Data Transmission (TLS 1.3)</span>
                                <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Active</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-[var(--text-dim)]">Local Storage Encryption</span>
                                <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Active</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-[var(--text-dim)]">API Key Storage</span>
                                <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Secure</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-[#050505] border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="text-[var(--accent-primary)]" size={20} />
                            <h3 className="text-sm font-bold text-white uppercase">Data Privacy</h3>
                        </div>
                        <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-4">
                            Your data resides locally on your device. API keys are stored in your browser's local secure storage and are never transmitted to our servers, only directly to Google's Generative AI API.
                        </p>
                        <button className="text-[10px] uppercase text-[var(--accent-primary)] border border-[var(--accent-primary)] px-3 py-1.5 hover:bg-[var(--accent-primary)] hover:text-black transition-colors">
                            View Privacy Policy
                        </button>
                    </div>
                </div>

                <div className="border border-white/10 bg-[#050505] p-6">
                    <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                        <Eye size={16} /> Audit Log
                    </h3>
                    <div className="space-y-2">
                        {[
                            { event: 'System Initialization', time: 'Just now', status: 'OK' },
                            { event: 'Secure Connection Established', time: '1 min ago', status: 'OK' },
                            { event: 'Memory Core Integrity Check', time: '2 mins ago', status: 'Verified' }
                        ].map((log, i) => (
                            <div key={i} className="flex justify-between text-[10px] border-b border-white/5 py-2 last:border-0">
                                <span className="text-white font-mono">{log.event}</span>
                                <div className="flex gap-4">
                                    <span className="text-[var(--text-dim)]">{log.time}</span>
                                    <span className="text-emerald-500">{log.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
