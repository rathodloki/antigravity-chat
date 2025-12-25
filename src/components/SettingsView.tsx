import React, { useState } from 'react';
import { useMemoryContext } from '../context/MemoryContext';
import { Trash2, Download, Key, ShieldAlert, Cpu, User, Brain, Fingerprint, Sparkles, Save, RefreshCw, Copy, LogOut } from 'lucide-react';
import { FirebaseService } from '../services/FirebaseService';

export const SettingsView: React.FC = () => {
    const {
        apiKey, setApiKey, profile, clearMemory, updateManualProfile,
        cloudConfig, setSyncCode, syncStatus, syncMemory, disconnectCloud
    } = useMemoryContext();
    const [keyInput, setKeyInput] = useState(apiKey || '');
    const [syncCodeInput, setSyncCodeInput] = useState(cloudConfig.syncCode || '');
    const [showKey, setShowKey] = useState(false);

    // Profile State
    const [writingStyle, setWritingStyle] = useState(profile.writingStyle || '');
    const [knowledgeBase, setKnowledgeBase] = useState(profile.knowledgeBase || '');
    const [persona, setPersona] = useState(profile.persona || '');
    const [neuralScene, setNeuralScene] = useState(profile.neuralScene || '');
    const [isSaved, setIsSaved] = useState(false);

    const handleSaveKey = () => {
        setApiKey(keyInput);
        console.log('[SETTINGS] API Key manually updated.');
        alert('SUCCESS: API access token validated and stored.');
    };

    const handleSaveProfile = () => {
        updateManualProfile({
            ...profile,
            writingStyle,
            knowledgeBase,
            persona,
            neuralScene,
            lastUpdated: Date.now()
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "antigravity_core_dump.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleClearMemory = () => {
        if (window.confirm('WARNING: Initiate global memory wipe? This action is irreversible.')) {
            clearMemory();
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-transparent text-[var(--text-main)] p-8 md:p-12 font-mono">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="border-b border-white/10 pb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 tracking-widest uppercase text-white">System Configuration</h1>
                        <p className="text-[var(--text-dim)] text-xs uppercase tracking-wider">Parameters & Core Settings</p>
                    </div>
                    <div className="text-[var(--accent-primary)] text-xs animate-pulse">
                        ● EDIT MODE
                    </div>
                </div>

                {/* Secure Access Token */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-1.5 border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                            <Key size={16} />
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Secure Access Token</h2>
                    </div>

                    <div className="border border-white/10 bg-[#050505] p-6 relative">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />

                        <div className="flex gap-0 mb-3">
                            <div className="flex-1 group relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={keyInput}
                                    onChange={(e) => setKeyInput(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 px-4 py-3 text-xs text-white focus:border-[var(--accent-primary)] outline-none transition-all placeholder-[var(--text-dim)]"
                                    placeholder="ENTER_KEY_HERE"
                                />
                            </div>
                            <button
                                onClick={handleSaveKey}
                                className="px-6 py-3 bg-[var(--accent-primary)] text-black font-bold text-xs uppercase hover:bg-[var(--accent-secondary)] transition-all border border-[var(--accent-primary)]"
                            >
                                UPDATE
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="showKey"
                                checked={showKey}
                                onChange={e => setShowKey(e.target.checked)}
                                className="appearance-none w-3 h-3 border border-white/30 checked:bg-[var(--accent-primary)] checked:border-[var(--accent-primary)] cursor-pointer"
                            />
                            <label htmlFor="showKey" className="text-[10px] text-[var(--text-dim)] cursor-pointer select-none uppercase tracking-wider">Reveal Token</label>
                        </div>
                    </div>
                </section>

                {/* Neural Cloud (Firebase Sync) */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Neural Cloud (Sync)</h2>
                    </div>

                    <div className="border border-white/10 bg-[#050505] p-6 relative">
                        <div className="flex gap-4 items-start mb-4">
                            <div className="flex-1">
                                <label className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider mb-2 block">Sync Code (Share across devices)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter or generate a sync code..."
                                        value={syncCodeInput}
                                        onChange={(e) => setSyncCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                        className="flex-1 bg-black/40 border border-white/10 px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none placeholder-[var(--text-dim)] font-mono tracking-widest"
                                        maxLength={16}
                                    />
                                    <button
                                        onClick={() => setSyncCodeInput(FirebaseService.generateSyncCode())}
                                        className="px-3 py-2 bg-white/5 border border-white/10 text-[var(--text-dim)] hover:text-white hover:bg-white/10 transition-all"
                                        title="Generate Random Code"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                    <button
                                        onClick={() => setSyncCode(syncCodeInput)}
                                        disabled={syncStatus === 'syncing' || syncCodeInput.length < 4}
                                        className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all text-xs font-bold uppercase disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {syncStatus === 'syncing' ? '...' : (cloudConfig.syncCode ? 'Update' : 'Connect')}
                                    </button>
                                </div>
                                <p className="text-[9px] text-[var(--text-dim)] mt-2">Use the same code on all devices to sync your memory and chat history.</p>
                            </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                    syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' :
                                        syncStatus === 'error' ? 'bg-red-500' :
                                            'bg-gray-700'
                                    }`} />
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${syncStatus === 'connected' ? 'text-emerald-500' :
                                    syncStatus === 'error' ? 'text-red-500' :
                                        'text-[var(--text-dim)]'
                                    }`}>
                                    {syncStatus === 'connected' ? 'Live Sync Active' :
                                        syncStatus === 'syncing' ? 'Connecting...' :
                                            syncStatus === 'error' ? 'Connection Failed' :
                                                'Offline'}
                                </span>
                            </div>

                            {cloudConfig.lastSync > 0 && (
                                <div className="text-[10px] text-[var(--text-dim)] font-mono">
                                    LAST: {new Date(cloudConfig.lastSync).toLocaleTimeString()}
                                </div>
                            )}

                            <div className="flex gap-2">
                                {syncStatus === 'connected' && (
                                    <>
                                        <button
                                            onClick={syncMemory}
                                            className="text-[10px] text-[var(--text-dim)] hover:text-white underline decoration-white/30 hover:decoration-white transition-all cursor-pointer uppercase"
                                        >
                                            Force Sync
                                        </button>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(cloudConfig.syncCode)}
                                            className="text-[10px] text-[var(--text-dim)] hover:text-emerald-500 transition-all cursor-pointer uppercase flex items-center gap-1"
                                        >
                                            <Copy size={10} /> Copy Code
                                        </button>
                                        <button
                                            onClick={disconnectCloud}
                                            className="text-[10px] text-red-500/70 hover:text-red-500 transition-all cursor-pointer uppercase flex items-center gap-1"
                                        >
                                            <LogOut size={10} /> Disconnect
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {syncStatus === 'connected' && (
                            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded text-[10px] text-emerald-400/80 font-mono flex items-center justify-between">
                                <span>SYNC CODE: <span className="text-emerald-400 font-bold tracking-widest">{cloudConfig.syncCode.toUpperCase()}</span></span>
                                <span className="text-[9px] text-[var(--text-dim)]">Real-time sync enabled</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* User Behavior & Style */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-1.5 border border-blue-500/30 bg-blue-500/10 text-blue-500">
                            <User size={16} />
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-white">User Identity & Style</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-white/10 bg-[#050505] p-6">
                            <label className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider mb-2 block">Writing Style / Voice</label>
                            <input
                                value={writingStyle}
                                onChange={e => setWritingStyle(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs text-white focus:border-blue-500 outline-none mb-2"
                                placeholder="e.g. Concise, Technical, Witty..."
                            />
                            <p className="text-[9px] text-[var(--text-dim)]">Defines how the system interprets your inputs.</p>
                        </div>
                        <div className="border border-white/10 bg-[#050505] p-6">
                            <label className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider mb-2 block">Knowledge Domain</label>
                            <input
                                value={knowledgeBase}
                                onChange={e => setKnowledgeBase(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs text-white focus:border-blue-500 outline-none mb-2"
                                placeholder="e.g. Full Stack Dev, Quantum Physics..."
                            />
                            <p className="text-[9px] text-[var(--text-dim)]">System assumes this background context.</p>
                        </div>
                    </div>
                </section>


                {/* Neural Persona & Scenes */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-1.5 border border-purple-500/30 bg-purple-500/10 text-purple-500">
                            <Brain size={16} />
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Neural Persona & Scenes</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-white/10 bg-[#050505] p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Fingerprint size={12} className="text-purple-500" />
                                    <label className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider block">Chatbot Persona</label>
                                </div>
                                <select
                                    onChange={e => setPersona(e.target.value)}
                                    className="bg-black/40 border border-white/10 px-2 py-1 text-[10px] text-[var(--text-dim)] focus:border-purple-500 outline-none appearance-none cursor-pointer hover:text-white"
                                    defaultValue=""
                                >
                                    <option value="" disabled>Load Preset...</option>
                                    <option value="Antigravity (Default)">Antigravity</option>
                                    <option value="Technical Mentor">Technical Mentor</option>
                                    <option value="Creative Strategist">Creative Strategist</option>
                                    <option value="Brutal Roaster">Brutal Roaster</option>
                                    <option value="Chill Guy Companion">Chill Guy Companion</option>
                                </select>
                            </div>
                            <textarea
                                value={persona}
                                onChange={e => setPersona(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-xs text-white focus:border-purple-500 outline-none mb-2 resize-none h-24 placeholder-[var(--text-dim)]"
                                placeholder="Define exact behavioral instructions here..."
                            />
                            <p className="text-[9px] text-[var(--text-dim)]">Deep customization enabled. Direct neural overrides.</p>
                        </div>
                        <div className="border border-white/10 bg-[#050505] p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={12} className="text-purple-500" />
                                <label className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider block">Neural Scene</label>
                            </div>
                            <select
                                value={neuralScene}
                                onChange={e => setNeuralScene(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 px-4 py-2 text-xs text-white focus:border-purple-500 outline-none mb-2 appearance-none"
                            >
                                <option value="Standard Void">Standard Void</option>
                                <option value="Cyberpunk Lab">Cyberpunk Lab</option>
                                <option value="Zen Garden">Zen Garden</option>
                                <option value="War Room">War Room</option>
                                <option value="Deep Space">Deep Space</option>
                            </select>
                            <p className="text-[9px] text-[var(--text-dim)]">Environmental context context for responses.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        className={`mt-6 w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all border ${isSaved
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            }`}
                    >
                        <Save size={14} />
                        {isSaved ? 'Configuration Saved' : 'Save Neural Configuration'}
                    </button>
                </section>

                {/* Memory Data Management */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-1.5 border border-white/10 bg-white/5 text-white">
                            <Cpu size={16} />
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Data Management</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Export */}
                        <div className="border border-white/10 bg-[#050505] p-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-white uppercase mb-2">Core Dump</h3>
                                <p className="text-[10px] text-[var(--text-dim)] mb-6">Export neural state to localized JSON.</p>
                            </div>
                            <button
                                onClick={handleExport}
                                className="w-full py-2 border border-white/20 hover:border-white hover:bg-white/5 text-[10px] text-white uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={12} /> Init Export
                            </button>
                        </div>

                        {/* Danger Zone */}
                        <div className="border border-red-900/30 bg-red-900/5 p-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-2">
                                    <ShieldAlert size={14} /> Global Wipe
                                </h3>
                                <p className="text-[10px] text-red-400/70 mb-6">Irreversible deletion of all stored nodes.</p>
                            </div>
                            <button
                                onClick={handleClearMemory}
                                className="w-full py-2 border border-red-500/30 hover:bg-red-500/10 text-[10px] text-red-500 uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={12} /> Execute Purge
                            </button>
                        </div>
                    </div>
                </section>

                <div className="mt-12 pt-6 border-t border-white/5 flex justify-between text-[9px] text-[var(--text-dim)] uppercase tracking-widest">
                    <span>Antigravity Sys V2.0</span>
                    <span>Status: Optimal</span>
                </div>

            </div>
        </div>
    );
};
