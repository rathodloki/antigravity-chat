import { Settings, Plus, Activity, Box, Database, Shield, ChevronDown, MessageSquare, Archive, MoreHorizontal, Trash } from 'lucide-react';
import { useMemoryContext } from '../context/MemoryContext';
import { useUI } from '../context/UIContext';
import { useState } from 'react';

interface SidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
    const { activeView, setActiveView, startNewChat, sessions, currentSessionId, openChat, archiveSession, deleteSession } = useMemoryContext();
    const { showAlert } = useUI();
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    const activeSessions = sessions.filter(s => !s.isArchived).sort((a, b) => b.timestamp - a.timestamp);


    return (
        <aside className={`w-[260px] h-full flex flex-col bg-[#050505] border-r border-white/10 z-20 ${className}`}>

            {/* Header / New Chat */}
            <div className="p-3 border-b border-white/5">
                <button
                    onClick={() => {
                        startNewChat();
                        setActiveView('chat');
                        onNavigate?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-black font-bold font-mono text-xs uppercase tracking-wider transition-all"
                >
                    <Plus size={14} strokeWidth={3} />
                    <span>New Session</span>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
                {/* Active History */}
                <div className="py-2 border-b border-white/5">
                    <div className="px-4 mb-2 text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                        Recent
                    </div>

                    <div className={`${isHistoryExpanded ? 'flex-1' : 'max-h-[30vh]'} overflow-y-auto no-scrollbar px-2 space-y-0.5 mb-2 transition-all duration-300`}>
                        {activeSessions.length === 0 ? (
                            <div className="px-4 py-3 text-[10px] text-[var(--text-dim)] font-mono italic opacity-50 text-center">
                                No active sessions
                            </div>
                        ) : (
                            activeSessions.map(session => (
                                <div
                                    key={session.id}
                                    className={`group relative flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all ${currentSessionId === session.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-[var(--text-dim)] hover:bg-white/5 hover:text-white'
                                        }`}
                                    onClick={() => {
                                        openChat(session.id);
                                        onNavigate?.();
                                    }}
                                >
                                    <MessageSquare size={12} className={currentSessionId === session.id ? 'text-[var(--accent-primary)]' : 'opacity-50'} />
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-[11px] truncate font-medium">
                                            {session.title || 'New Chat'}
                                        </div>
                                    </div>

                                    {/* Hover Actions Menu */}
                                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                        <div className="group/menu relative flex items-center justify-end">
                                            {/* Three Dots Trigger */}
                                            <div className="p-1 text-[var(--text-dim)] hover:text-white transition-colors cursor-default group-hover/menu:opacity-0 absolute right-0">
                                                <MoreHorizontal size={14} />
                                            </div>

                                            {/* Expanded Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover/menu:opacity-100 transition-all transform translate-x-2 group-hover/menu:translate-x-0 bg-[#050505] pl-2 z-10">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        archiveSession(session.id);
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors"
                                                    title="Archive"
                                                >
                                                    <Archive size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showAlert({
                                                            title: 'Delete Session?',
                                                            message: 'This action cannot be undone. The session will be permanently removed from memory core.',
                                                            confirmLabel: 'Delete',
                                                            type: 'danger',
                                                            onConfirm: () => deleteSession(session.id)
                                                        });
                                                    }}
                                                    className="p-1 hover:bg-red-500/10 rounded text-[var(--text-dim)] hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Expand/Collapse Button */}
                    {activeSessions.length > 0 && (
                        <button
                            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                            className="w-full flex justify-center py-1 text-[var(--text-dim)] hover:text-white transition-colors"
                        >
                            {isHistoryExpanded ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronDown size={14} className="transition-transform" />}
                        </button>
                    )}
                </div>

                <div className="py-4">
                    <div className="px-4 mb-2 text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                        Core System
                    </div>
                    <NavItem
                        icon={Activity}
                        label="Neural Stream"
                        active={activeView === 'memory'}
                        onClick={() => { setActiveView('memory'); onNavigate?.(); }}
                    />
                </div>

                <div className="py-2 border-t border-white/5">
                    <div className="px-4 mb-2 text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                        Data
                    </div>
                    <NavItem
                        icon={Database}
                        label="Archives"
                        active={activeView === 'history'}
                        onClick={() => { setActiveView('history'); onNavigate?.(); }}
                    />
                    <NavItem
                        icon={Box}
                        label="Models"
                        active={activeView === 'models'}
                        onClick={() => { setActiveView('models'); onNavigate?.(); }}
                        badge="3"
                    />
                </div>

                <div className="py-2 border-t border-white/5">
                    <div className="px-4 mb-2 text-[9px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
                        System
                    </div>
                    <NavItem
                        icon={Settings}
                        label="Configuration"
                        active={activeView === 'settings'}
                        onClick={() => { setActiveView('settings'); onNavigate?.(); }}
                    />
                    <NavItem
                        icon={Shield}
                        label="Security"
                        active={activeView === 'security'}
                        onClick={() => { setActiveView('security'); onNavigate?.(); }}
                    />
                </div>
            </div>

            {/* Status Footer */}
            <div className="p-3 border-t border-white/10 bg-[#080808]">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-white uppercase">US-EAST-1</span>
                        <span className="text-[9px] font-mono text-[var(--text-dim)]">Connected</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

// Internal NavItem Component
const NavItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-mono transition-all border-l-2 cursor-pointer ${active
            ? 'border-[var(--accent-primary)] bg-white/5 text-white'
            : 'border-transparent text-[var(--text-dim)] hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon
            size={14}
            className={`${active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-dim)]'}`}
        />
        <span>{label}</span>

        {badge && (
            <span className="ml-auto text-[9px] bg-white/10 text-white px-1.5 py-0.5 rounded-sm">
                {badge}
            </span>
        )}
    </button>
);
