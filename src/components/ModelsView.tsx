import React from 'react';
import { Box, Check, Cpu, Zap, Lock, Sparkles, Rocket } from 'lucide-react';
import { useMemoryContext } from '../context/MemoryContext';

export const ModelsView: React.FC = () => {
    const { model: selectedModel, setModel: setSelectedModel } = useMemoryContext();

    const models = [
        {
            id: 'gemini-3-pro-preview',
            name: 'Gemini 3 Pro (Preview)',
            desc: 'Reasoning model. Note: May require billing/allowlist (High 429 Error Rate).',
            tags: ['Restricted', 'Reasoning', 'Coding'],
            icon: Sparkles
        },
        {
            id: 'gemini-3-flash-preview',
            name: 'Gemini 3 Flash (Preview)',
            desc: 'Fastest frontier-class model. Extreme efficiency with near-Pro performance.',
            tags: ['Ultra-Low Latency', 'Real-time', 'Frontier'],
            icon: Rocket
        },
        {
            id: 'gemini-2.5-pro',
            name: 'Gemini 2.5 Pro',
            desc: 'Stable enterprise reasoning. The reliable workhorse for complex tasks.',
            tags: ['Stable', 'Production', 'Reasoning'],
            icon: Box
        },
        {
            id: 'gemini-2.5-flash',
            name: 'Gemini 2.5 Flash',
            desc: 'Balanced performance for high-throughput tasks.',
            tags: ['Balanced', 'Production-Ready'],
            icon: Zap
        },
        {
            id: 'gemini-2.0-flash',
            name: 'Gemini 2.0 Flash',
            desc: 'Legacy stable model. Retained for backward compatibility.',
            tags: ['Legacy', 'Lightweight'],
            icon: Cpu,
            locked: true
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-transparent text-[var(--text-main)] p-8 md:p-12 font-mono">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="border-b border-white/10 pb-6">
                    <h1 className="text-2xl font-bold mb-2 tracking-widest uppercase text-white">Model Selection</h1>
                    <p className="text-[var(--text-dim)] text-xs uppercase tracking-wider">Configure Inference Engine</p>
                </div>

                <div className="grid gap-4">
                    {models.map((model) => (
                        <div
                            key={model.id}
                            onClick={() => !model.locked && setSelectedModel(model.id)}
                            className={`relative p-6 border transition-all cursor-pointer group ${selectedModel === model.id
                                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]'
                                : 'bg-[#050505] border-white/10 hover:border-white/30'
                                } ${model.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-lg ${selectedModel === model.id ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/5 text-white'}`}>
                                        <model.icon size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-white">{model.name}</h3>
                                            {model.locked && <Lock size={12} className="text-yellow-500" />}
                                            {model.id === 'gemini-3-pro-preview' && (
                                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--text-dim)] mb-3">{model.desc}</p>
                                        <div className="flex gap-2">
                                            {model.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 text-[10px] uppercase border border-white/10 rounded-full text-[var(--text-muted)]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {selectedModel === model.id && (
                                    <div className="text-[var(--accent-primary)]">
                                        <Check size={24} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-lg flex items-center gap-3">
                    <Sparkles size={16} className="text-[var(--accent-primary)]" />
                    <p className="text-xs text-[var(--text-dim)]">
                        System automatically optimizes context routing. <span className="text-white font-bold">Gemini 3.0 Pro</span> is currently active for all complex queries.
                    </p>
                </div>
            </div>
        </div>
    );
};
