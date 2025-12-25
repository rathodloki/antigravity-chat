import React from 'react';
import { useMemoryContext } from '../context/MemoryContext';
import { useUI } from '../context/UIContext';
import { Trash2, ArrowRight, Plus, Monitor, ArchiveRestore } from 'lucide-react';

export const HistoryView: React.FC = () => {
    const { sessions, openChat, deleteSession, startNewChat, clearAllSessions, unarchiveSession } = useMemoryContext();
    const { showAlert } = useUI();

    const sortedSessions = [...sessions].filter(s => s.isArchived).sort((a, b) => b.timestamp - a.timestamp);

    const handleOpen = (id: string) => {
        openChat(id);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-transparent p-8 md:p-12 font-mono">
            <div className="max-w-5xl mx-auto">

                <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-1">Session Archives</h1>
                        <p className="text-[var(--text-dim)] text-xs uppercase tracking-wider">Log Repository</p>
                    </div>
                    <div className="flex gap-3">
                        {sortedSessions.length > 0 && (
                            <button
                                onClick={() => {
                                    showAlert({
                                        title: 'Purge Archives?',
                                        message: 'WARNING: This will permanently delete ALL archived sessions. This cannot be undone.',
                                        confirmLabel: 'Purge All',
                                        type: 'danger',
                                        onConfirm: () => clearAllSessions()
                                    });
                                }}
                                className="flex items-center gap-2 px-4 py-2 border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                            >
                                <Trash2 size={14} /> Clear All
                            </button>
                        )}
                        <button
                            onClick={() => startNewChat()}
                            className="flex items-center gap-2 px-4 py-2 border border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-bold uppercase tracking-wider hover:bg-[var(--accent-primary)] hover:text-black transition-all"
                        >
                            <Plus size={14} /> New Instance
                        </button>
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-white/5 border border-white/10 text-[9px] text-[var(--text-dim)] uppercase tracking-wider mb-2">
                    <div className="col-span-1">STATUS</div>
                    <div className="col-span-7">SESSION ID / CONTENT</div>
                    <div className="col-span-2">TIMESTAMP</div>
                    <div className="col-span-2 text-right">ACTION</div>
                </div>

                <div className="space-y-1">
                    {sortedSessions.length === 0 ? (
                        <div className="border border-white/10 bg-[#050505] p-24 flex flex-col items-center justify-center text-center">
                            <Monitor size={40} className="text-[var(--text-dim)] mb-4 opacity-50" />
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Null Pointer Exception</h2>
                            <p className="text-[10px] text-[var(--text-dim)] mb-6">No archived session logs found in database.</p>
                            <button
                                onClick={startNewChat}
                                className="px-6 py-2 border border-[var(--accent-primary)] text-[var(--accent-primary)] text-xs uppercase tracking-wider hover:bg-[var(--accent-primary)] hover:text-black transition-all"
                            >
                                Initialize New Session
                            </button>
                        </div>
                    ) : (
                        sortedSessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => handleOpen(session.id)}
                                className="grid grid-cols-12 gap-4 px-4 py-4 border border-white/5 bg-[#0a0a0b] hover:border-[var(--accent-primary)]/50 hover:bg-white/5 cursor-pointer transition-all group items-center"
                            >
                                <div className="col-span-1">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-sm" />
                                </div>
                                <div className="col-span-7">
                                    <h3 className="text-sm font-bold text-white group-hover:text-[var(--accent-primary)] transition-colors truncate mb-1">
                                        {session.title || `SESSION_LOG_${session.id.slice(0, 8)}`}
                                    </h3>
                                    <p className="text-[10px] text-[var(--text-dim)] line-clamp-1">
                                        {session.messages.find(m => m.role === 'assistant')?.content || 'No preview available.'}
                                    </p>
                                </div>
                                <div className="col-span-2 text-[10px] text-[var(--text-dim)] font-mono">
                                    {new Date(session.timestamp).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                                    <span className="ml-2 opacity-50">{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="col-span-2 flex justify-end gap-2">
                                    <button className="text-[var(--text-dim)] hover:text-white transition-colors">
                                        <ArrowRight size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            unarchiveSession(session.id);
                                        }}
                                        className="text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors"
                                        title="Restore to Active"
                                    >
                                        <ArchiveRestore size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            showAlert({
                                                title: 'Delete Log?',
                                                message: 'This session log will be permanently deleted.',
                                                confirmLabel: 'Delete',
                                                type: 'danger',
                                                onConfirm: () => deleteSession(session.id)
                                            });
                                        }}
                                        className="text-[var(--text-dim)] hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
