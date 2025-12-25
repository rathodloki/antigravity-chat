import React from 'react';
import { useMemoryContext } from '../context/MemoryContext';
import { Hash, Database, Trash2 } from 'lucide-react';
import { useUI } from '../context/UIContext';

export const MemoryView: React.FC = () => {
    const { profile, isReflecting, deleteFact } = useMemoryContext();
    const { showAlert } = useUI();

    const lastUpdatedStr = profile.lastUpdated
        ? new Date(profile.lastUpdated).toLocaleString()
        : 'Never';

    return (
        <div className="flex-1 overflow-y-auto bg-transparent p-8 md:p-12 font-mono">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-1">Neural Stream</h1>
                        <p className="text-[var(--text-dim)] text-xs uppercase tracking-wider">
                            Last Updated: {lastUpdatedStr}
                        </p>
                    </div>
                    <div className={`flex items-center gap-4 text-[10px] border px-3 py-1 ${isReflecting ? 'text-amber-500 border-amber-500/20 bg-amber-500/5 animate-pulse' : 'text-[var(--accent-primary)] border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5'}`}>
                        <ActivityIndicator />
                        <span>{isReflecting ? 'UPDATING...' : 'LIVE FEED'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* Stats Column (Left) */}
                    <div className="md:col-span-1 space-y-6">

                        {/* Profile/Mood Card */}
                        <div className="bg-[#0a0a0b] border border-white/10 p-5 relative overflow-hidden">
                            <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-widest mb-4">Current Mood</div>
                            <div className="text-xl font-bold text-white uppercase tracking-wider mb-2 text-[var(--accent-secondary)]">
                                {profile.mood || "IDLE"}
                            </div>
                            <div className="h-1 w-full bg-white/10 mt-4 overflow-hidden">
                                <div className="h-full w-[60%] bg-[var(--accent-secondary)]" />
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="bg-[#0a0a0b] border border-white/10 p-5">
                            <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Hash size={12} /> Database Stats
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] text-[var(--text-dim)] uppercase">Facts Stored</span>
                                    <span className="text-xl font-bold text-white">{profile.facts.length}</span>
                                </div>
                                <div className="w-full h-px bg-white/5" />
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] text-[var(--text-dim)] uppercase">Preferences</span>
                                    <span className="text-xl font-bold text-white">{profile.preferences.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Log Column (Right) */}
                    <div className="md:col-span-3">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider flex items-center gap-2">
                                <Database size={12} /> Knowledge Graph
                            </h3>
                            <span className="text-[9px] text-[var(--text-dim)]">Last Sync: {new Date().toLocaleTimeString()}</span>
                        </div>

                        <div className="border border-white/10 bg-[#050505] min-h-[400px]">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-white/10 bg-white/5 text-[9px] text-[var(--text-dim)] uppercase tracking-wider">
                                <div className="col-span-1">ID</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-9">Content Payload</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-white/5">
                                {profile.facts.length === 0 ? (
                                    <div className="p-8 text-center text-[10px] text-[var(--text-dim)]">
                                        [NO DATA] Neural Network is empty. Initiate conversation to build graph.
                                    </div>
                                ) : (
                                    profile.facts.map((fact, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 text-[11px] hover:bg-white/5 transition-colors group">
                                            <div className="col-span-1 text-[var(--text-dim)] font-mono">{String(i).padStart(3, '0')}</div>
                                            <div className="col-span-2 text-[var(--accent-primary)]">FACT_NODE</div>
                                            <div className="col-span-8 text-gray-300 font-mono truncate group-hover:whitespace-normal">
                                                {fact}
                                            </div>
                                            <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => showAlert({
                                                        title: 'Delete Neural Node',
                                                        message: 'Are you sure you want to permanently delete this fact from memory? This may affect future context.',
                                                        type: 'danger',
                                                        confirmLabel: 'Delete Node',
                                                        onConfirm: () => deleteFact(i)
                                                    })}
                                                    className="p-1 text-[var(--text-dim)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Delete Fact"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* JSON Dump */}
                        <div className="mt-8">
                            <details className="group border border-white/10 bg-[#050505]">
                                <summary className="cursor-pointer px-4 py-2 text-[10px] text-[var(--text-dim)] hover:text-white uppercase tracking-wider flex items-center justify-between">
                                    <span>Expand Raw JSON Blob</span>
                                    <span className="text-[var(--accent-primary)] group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <pre className="p-4 bg-black text-[10px] text-green-500 font-mono overflow-x-auto border-t border-white/10 max-h-60 scrollbar-thin">
                                    {JSON.stringify(profile, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActivityIndicator = () => (
    <div className="flex gap-0.5">
        <div className="w-0.5 h-2 bg-[var(--accent-primary)] animate-pulse" />
        <div className="w-0.5 h-3 bg-[var(--accent-primary)] animate-pulse delay-75" />
        <div className="w-0.5 h-1.5 bg-[var(--accent-primary)] animate-pulse delay-150" />
    </div>
);
