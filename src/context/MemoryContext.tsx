import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile, Message, ChatSession } from '../types';
import { GeminiService } from '../services/GeminiService';
import { GistService } from '../services/GistService';

interface CloudConfig {
    pat: string;
    gistId: string | null;
    lastSync: number;
}

interface MemoryContextType {
    profile: UserProfile;
    updateMemory: (messages: Message[]) => Promise<void>;
    isReflecting: boolean;
    apiKey: string;
    setApiKey: (key: string) => void;
    // State
    activeView: 'chat' | 'memory' | 'settings' | 'history' | 'models' | 'security';
    setActiveView: (view: 'chat' | 'memory' | 'settings' | 'history' | 'models' | 'security') => void;
    model: string;
    setModel: (model: string) => void;

    // Chat History
    sessions: ChatSession[];
    currentSessionId: string | null;
    currentMessages: Message[];
    startNewChat: () => void;
    openChat: (sessionId: string) => void;
    saveMessage: (msg: Message) => void;
    deleteSession: (sessionId: string) => void;
    archiveSession: (sessionId: string) => void;
    unarchiveSession: (sessionId: string) => void;
    clearAllSessions: () => void;
    clearMemory: () => void;
    updateManualProfile: (profile: UserProfile) => void;
    deleteFact: (index: number) => void;

    // Neural Cloud (Sync)
    cloudConfig: CloudConfig;
    setGithubPat: (token: string) => Promise<void>;
    syncStatus: 'idle' | 'syncing' | 'error' | 'connected';
    syncMemory: () => Promise<void>;
}

const MemoryContext = createContext<MemoryContextType | null>(null);

const DEFAULT_PROFILE: UserProfile = {
    name: 'User',
    preferences: [],
    facts: [],
    mood: 'Neutral',
    writingStyle: 'Concise & Direct',
    knowledgeBase: 'General Knowledge',
    persona: 'Antigravity (Default)',
    neuralScene: 'Standard Void',
    lastUpdated: Date.now()
};

export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
    const [isReflecting, setIsReflecting] = useState(false);
    const [apiKey, setApiKeyState] = useState(localStorage.getItem('gemini_api_key') || '');
    const [activeView, setActiveView] = useState<'chat' | 'memory' | 'settings' | 'history' | 'models' | 'security'>('chat');
    const [model, setModel] = useState(localStorage.getItem('antigravity_model') || 'gemini-2.0-flash');

    // Chat History State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentMessages, setCurrentMessages] = useState<Message[]>([]);

    // Cloud Sync State
    const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => {
        const saved = localStorage.getItem('antigravity_cloud_config');
        return saved ? JSON.parse(saved) : { pat: '', gistId: null, lastSync: 0 };
    });
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'connected'>('idle');

    // Persist Cloud Config
    useEffect(() => {
        localStorage.setItem('antigravity_cloud_config', JSON.stringify(cloudConfig));
    }, [cloudConfig]);

    // Auto-Connect on Load
    useEffect(() => {
        if (cloudConfig.pat && cloudConfig.gistId) {
            console.log('[CLOUD] Auto-connecting...');
            setSyncStatus('syncing');
            // Pass current sessions explicitly
            syncMemoryInternal(cloudConfig, profile, sessions).catch(e => {
                console.error('[CLOUD] Auto-sync failed', e);
                setSyncStatus('error');
            });
        }
    }, [cloudConfig.pat, cloudConfig.gistId]); // Depends on config loading

    const setApiKey = (key: string) => {
        setApiKeyState(key);
        localStorage.setItem('gemini_api_key', key);
    }

    // Persist Model Change & Validate Obsolete IDs
    // Persist Model Change
    useEffect(() => {
        localStorage.setItem('antigravity_model', model);
    }, [model]);

    // Load Data
    useEffect(() => {
        // Profile
        const savedProfile = localStorage.getItem('antigravity_memory_v1');
        if (savedProfile) {
            try { setProfile(JSON.parse(savedProfile)); } catch (e) { console.error(e); }
        }

        // History
        const savedHistory = localStorage.getItem('antigravity_history_v1');
        if (savedHistory) {
            try {
                const parsedSessions: ChatSession[] = JSON.parse(savedHistory);
                setSessions(parsedSessions);

                // If we have history, maybe open the latest one?
                if (parsedSessions.length > 0) {
                    // Sort by timestamp desc to get latest
                    const latest = parsedSessions.sort((a, b) => b.timestamp - a.timestamp)[0];
                    setCurrentSessionId(latest.id);
                    setCurrentMessages(latest.messages);
                } else {
                    startNewChat();
                }
            } catch (e) { console.error(e); }
        } else {
            startNewChat();
        }
    }, []);

    // Save History Persistence
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('antigravity_history_v1', JSON.stringify(sessions));
        }
    }, [sessions]);

    const startNewChat = () => {
        // 1. Prevent duplicate empty sessions
        if (currentMessages.length === 0) {
            setActiveView('chat');
            return;
        }

        const newId = Date.now().toString();
        const newSession: ChatSession = {
            id: newId,
            title: 'New Chat',
            messages: [], // Empty for Hero Screen
            timestamp: Date.now()
        };

        // 2. Add new session & Clean up any previous empty sessions (Ghost Protocols)
        setSessions(prev => {
            const validSessions = prev.filter(s => s.messages.length > 0);
            return [newSession, ...validSessions];
        });

        setCurrentSessionId(newId);
        setCurrentMessages([]);
        setActiveView('chat');
    };

    const openChat = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setCurrentSessionId(session.id);
            setCurrentMessages(session.messages);
            setActiveView('chat');
        }
    };

    const deleteSession = (sessionId: string) => {
        const newSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(newSessions);
        // Force update local storage immediately for safety
        localStorage.setItem('antigravity_history_v1', JSON.stringify(newSessions));

        // If we deleted the current session
        if (currentSessionId === sessionId) {
            if (newSessions.length > 0) {
                openChat(newSessions[0].id);
            } else {
                startNewChat();
            }
        }
    };

    const archiveSession = (sessionId: string) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return { ...s, isArchived: true };
            }
            return s;
        }));
        if (currentSessionId === sessionId) {
            startNewChat();
        }
    };

    const unarchiveSession = (sessionId: string) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return { ...s, isArchived: false };
            }
            return s;
        }));
    };

    const clearAllSessions = () => {
        setSessions([]);
        localStorage.removeItem('antigravity_history_v1');
        startNewChat();
    };

    const clearMemory = () => {
        // Wipe Profile
        setProfile(DEFAULT_PROFILE);
        localStorage.removeItem('antigravity_memory_v1');

        // Wipe History
        clearAllSessions();
    };

    const updateManualProfile = (newProfile: UserProfile) => {
        setProfile(newProfile);
        localStorage.setItem('antigravity_memory_v1', JSON.stringify(newProfile));
    };

    const deleteFact = (index: number) => {
        const newFacts = profile.facts.filter((_, i) => i !== index);
        const newProfile = { ...profile, facts: newFacts, lastUpdated: Date.now() };
        setProfile(newProfile);
        localStorage.setItem('antigravity_memory_v1', JSON.stringify(newProfile));
    };

    const saveMessage = (msg: Message) => {
        // 1. Update Current View (With Deduplication & update)
        setCurrentMessages(prev => {
            const exists = prev.find(m => m.id === msg.id);
            if (exists) {
                // Update existing message content (e.g. streaming update)
                return prev.map(m => m.id === msg.id ? msg : m);
            }
            // Append new message
            return [...prev, msg];
        });

        // 2. Update Persistent Session (With Deduplication)
        if (currentSessionId) {
            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    let newTitle = s.title;
                    if (msg.role === 'user' && s.messages.length <= 1) {
                        newTitle = msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '');
                    }

                    const msgExists = s.messages.find(m => m.id === msg.id);
                    let newMessages;

                    if (msgExists) {
                        newMessages = s.messages.map(m => m.id === msg.id ? msg : m);
                    } else {
                        newMessages = [...s.messages, msg];
                    }

                    return { ...s, messages: newMessages, title: newTitle, timestamp: Date.now() };
                }
                return s;
            }));
        }
    };

    const updateMemory = async (messages: Message[]) => {
        console.log('[MEMORY] updateMemory called with', messages.length, 'messages');
        console.log('[MEMORY] Current apiKey exists:', !!apiKey);

        if (!apiKey) {
            console.log('[MEMORY] No API key, skipping memory update');
            return;
        }
        if (messages.length < 2) {
            console.log('[MEMORY] Not enough messages, skipping');
            return;
        }

        console.log('[MEMORY] Starting memory distillation...');
        console.log('[MEMORY] Current profile before update:', JSON.stringify(profile));

        setIsReflecting(true);
        try {
            const service = new GeminiService(apiKey);
            const newProfile = await service.distillMemory(messages, profile);

            console.log('[MEMORY] Received new profile:', JSON.stringify(newProfile));

            if (newProfile && newProfile.facts) {
                console.log('[MEMORY] New facts count:', newProfile.facts.length);
                setProfile(newProfile);
                localStorage.setItem('antigravity_memory_v1', JSON.stringify(newProfile));

                // Verify it was saved
                const saved = localStorage.getItem('antigravity_memory_v1');
                console.log('[MEMORY] Verified saved to localStorage:', !!saved);
                console.log('[MEMORY] Saved facts:', JSON.parse(saved || '{}').facts);
            } else {
                console.warn('[MEMORY] Invalid profile returned, keeping old profile');
            }
        } catch (error) {
            console.error('[MEMORY] Memory distillation FAILED:', error);
        } finally {
            setIsReflecting(false);
            console.log('[MEMORY] isReflecting set to false');
        }
    };

    // --- Neural Cloud Sync Logic ---
    // --- Neural Cloud Sync Logic ---
    const syncMemoryInternal = async (config: CloudConfig, currentProfile: UserProfile, currentSessions: ChatSession[]) => {
        try {
            const service = new GistService(config.pat);
            // 1. Download Cloud Data
            if (!config.gistId) return;

            const cloudResult = await service.downloadMemory(config.gistId);

            if (!cloudResult) {
                // Cloud Empty? Upload Local.
                const payload = {
                    profile: currentProfile,
                    sessions: currentSessions,
                    lastUpdated: Date.now()
                };
                await service.updateMemory(config.gistId, payload);
                setSyncStatus('connected');
                return;
            }

            // Handle legacy format (where root was UserProfile) vs new format
            const cloudData = cloudResult.data as any; // Force any to inspect structure

            let cloudProfile: UserProfile;
            let cloudSessions: ChatSession[] = [];

            if (cloudData.profile) {
                // New NeuralPayload format
                cloudProfile = cloudData.profile;
                cloudSessions = cloudData.sessions || [];
            } else {
                // Legacy UserProfile format
                cloudProfile = cloudData as UserProfile;
            }
            const cloudTime = new Date(cloudProfile.lastUpdated || 0).getTime();
            const localTime = new Date(currentProfile.lastUpdated || 0).getTime();

            console.log(`[SYNC] Cloud: ${cloudTime}, Local: ${localTime}`);

            // Simple "Last Write Wins" based on Gist Update Time
            if (cloudTime > localTime + 2000) { // 2s buffer
                console.log('[SYNC] Cloud is newer. Overwriting local.');

                if (cloudProfile && cloudProfile.name) {
                    setProfile(cloudProfile);
                    localStorage.setItem('antigravity_memory_v1', JSON.stringify(cloudProfile));
                }

                // Merge Sessions: smart merge? For now, Cloud Overwrite to ensure consistency across devices
                if (cloudSessions.length > 0) {
                    setSessions(cloudSessions);
                    localStorage.setItem('antigravity_history_v1', JSON.stringify(cloudSessions));

                    // Reload current view if empty
                    if (currentMessages.length === 0 && cloudSessions.length > 0) {
                        const latest = cloudSessions.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
                        setCurrentSessionId(latest.id);
                        setCurrentMessages(latest.messages);
                    }
                }
            } else if (localTime > cloudTime + 2000) {
                console.log('[SYNC] Local is newer. Uploading to cloud.');
                const payload = {
                    profile: currentProfile,
                    sessions: currentSessions,
                    lastUpdated: Date.now()
                };
                await service.updateMemory(config.gistId, payload);
            } else {
                console.log('[SYNC] Fully synced.');
            }

            setCloudConfig(prev => ({ ...prev, lastSync: Date.now() }));
            setSyncStatus('connected');

        } catch (error) {
            console.error('[SYNC] Failed:', error);
            setSyncStatus('error');
        }
    };

    const setGithubPat = async (token: string) => {
        if (!token.trim()) return;

        setSyncStatus('syncing');
        try {
            const service = new GistService(token);
            let gistId = await service.findExistingGistId();

            if (!gistId) {
                console.log('[CLOUD] No Gist found. Creating new...');
                gistId = await service.createGist({
                    profile,
                    sessions,
                    lastUpdated: Date.now()
                });
            }

            const newConfig = { pat: token, gistId, lastSync: Date.now() };
            setCloudConfig(newConfig);
            setSyncStatus('connected');

            // Trigger initial sync
            await syncMemoryInternal(newConfig, profile, sessions);
        } catch (error) {
            console.error('[CLOUD] Connection failed:', error);
            setSyncStatus('error');
        }
    };

    const syncMemory = async () => {
        if (!cloudConfig.pat || !cloudConfig.gistId) return;
        setSyncStatus('syncing');
        await syncMemoryInternal(cloudConfig, profile, sessions);
    };


    return (
        <MemoryContext.Provider value={{
            profile,
            updateMemory,
            isReflecting,
            apiKey,
            setApiKey,
            activeView,
            setActiveView,
            model,
            setModel,
            sessions,
            currentSessionId,
            currentMessages,
            startNewChat,
            openChat,
            saveMessage,
            deleteSession,
            archiveSession,
            unarchiveSession,
            clearAllSessions,
            clearMemory,
            updateManualProfile,
            deleteFact,
            cloudConfig,
            setGithubPat,
            syncStatus,
            syncMemory
        }}>
            {children}
        </MemoryContext.Provider>
    );
};

export const useMemoryContext = () => {
    const context = useContext(MemoryContext);
    if (!context) {
        throw new Error('useMemoryContext must be used within a MemoryProvider');
    }
    return context;
};
