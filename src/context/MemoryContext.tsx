import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { UserProfile, Message, ChatSession } from '../types';
import { GeminiService } from '../services/GeminiService';
import { FirebaseService } from '../services/FirebaseService';

interface CloudConfig {
    syncCode: string;
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

    // Neural Cloud (Firebase Sync)
    cloudConfig: CloudConfig;
    setSyncCode: (code: string) => Promise<void>;
    syncStatus: 'idle' | 'syncing' | 'error' | 'connected';
    syncMemory: () => Promise<void>;
    disconnectCloud: () => void;
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

    // Cloud Sync State (Firebase)
    const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => {
        const saved = localStorage.getItem('antigravity_firebase_config');
        return saved ? JSON.parse(saved) : { syncCode: '', lastSync: 0 };
    });
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'connected'>('idle');
    const [isLocalDataLoaded, setIsLocalDataLoaded] = useState(false);
    const firebaseServiceRef = useRef<FirebaseService | null>(null);
    const isReceivingUpdate = useRef(false); // Prevent feedback loops

    // Persist Cloud Config
    useEffect(() => {
        localStorage.setItem('antigravity_firebase_config', JSON.stringify(cloudConfig));
    }, [cloudConfig]);

    // Auto-Connect on Load (only after local data is loaded)
    useEffect(() => {
        if (isLocalDataLoaded && cloudConfig.syncCode) {
            console.log('[FIREBASE] Auto-connecting after local data load...');
            connectToFirebase(cloudConfig.syncCode);
        }

        return () => {
            // Cleanup on unmount
            if (firebaseServiceRef.current) {
                firebaseServiceRef.current.unsubscribeFromUpdates();
            }
        };
    }, [isLocalDataLoaded]); // Only run once after local data loads

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

        // Mark local data as loaded
        setIsLocalDataLoaded(true);
    }, []);

    // Save History Persistence + Auto-Upload to Firebase
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('antigravity_history_v1', JSON.stringify(sessions));

            // Auto-upload to Firebase if connected (debounced by 2 seconds)
            if (isLocalDataLoaded && cloudConfig.syncCode && syncStatus === 'connected' && firebaseServiceRef.current && !isReceivingUpdate.current) {
                const timeoutId = setTimeout(() => {
                    console.log('[FIREBASE] Auto-uploading sessions change...');
                    const payload = {
                        profile,
                        sessions,
                        lastUpdated: Date.now()
                    };
                    firebaseServiceRef.current?.uploadData(payload).catch((e: Error) => {
                        console.error('[FIREBASE] Auto-upload failed:', e);
                    });
                }, 2000);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [sessions, cloudConfig.syncCode, syncStatus, isLocalDataLoaded]);

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

    // --- Firebase Sync Logic ---
    const connectToFirebase = async (syncCode: string) => {
        if (!syncCode.trim()) return;

        setSyncStatus('syncing');
        try {
            const service = new FirebaseService(syncCode);
            firebaseServiceRef.current = service;

            // Try to download existing data first
            const cloudData = await service.downloadData();

            if (cloudData) {
                // Cloud has data - merge it
                const cloudTime = cloudData.lastUpdated || 0;
                const localTime = profile.lastUpdated || 0;

                console.log(`[FIREBASE] Cloud: ${cloudTime}, Local: ${localTime}`);

                if (cloudTime > localTime) {
                    console.log('[FIREBASE] Cloud is newer. Downloading...');
                    isReceivingUpdate.current = true;

                    if (cloudData.profile) {
                        setProfile(cloudData.profile);
                        localStorage.setItem('antigravity_memory_v1', JSON.stringify(cloudData.profile));
                    }
                    if (cloudData.sessions && cloudData.sessions.length > 0) {
                        setSessions(cloudData.sessions);
                        localStorage.setItem('antigravity_history_v1', JSON.stringify(cloudData.sessions));

                        // Open latest session
                        const latest = cloudData.sessions.sort((a, b) => b.timestamp - a.timestamp)[0];
                        setCurrentSessionId(latest.id);
                        setCurrentMessages(latest.messages || []);
                    }

                    isReceivingUpdate.current = false;
                } else {
                    console.log('[FIREBASE] Local is newer. Uploading...');
                    await service.uploadData({
                        profile,
                        sessions,
                        lastUpdated: Date.now()
                    });
                }
            } else {
                // No cloud data - upload local
                console.log('[FIREBASE] No cloud data. Uploading local...');
                await service.uploadData({
                    profile,
                    sessions,
                    lastUpdated: Date.now()
                });
            }

            // Subscribe to real-time updates
            service.subscribeToUpdates((data) => {
                if (data && !isReceivingUpdate.current) {
                    const cloudTime = data.lastUpdated || 0;
                    const localTime = profile.lastUpdated || 0;

                    // Only update if cloud is significantly newer (to avoid feedback loops)
                    if (cloudTime > localTime + 3000) {
                        console.log('[FIREBASE] Real-time update received');
                        isReceivingUpdate.current = true;

                        if (data.profile) {
                            setProfile(data.profile);
                            localStorage.setItem('antigravity_memory_v1', JSON.stringify(data.profile));
                        }
                        if (data.sessions) {
                            setSessions(data.sessions);
                            localStorage.setItem('antigravity_history_v1', JSON.stringify(data.sessions));

                            // Update active chat view if open
                            if (currentSessionId) {
                                const activeSession = data.sessions.find(s => s.id === currentSessionId);
                                if (activeSession) {
                                    setCurrentMessages(activeSession.messages || []);
                                }
                            }
                        }

                        isReceivingUpdate.current = false;
                    }
                }
            });

            setCloudConfig({ syncCode, lastSync: Date.now() });
            setSyncStatus('connected');

        } catch (error) {
            console.error('[FIREBASE] Connection failed:', error);
            setSyncStatus('error');
        }
    };

    const setSyncCode = async (code: string) => {
        await connectToFirebase(code);
    };

    const syncMemory = async () => {
        if (!cloudConfig.syncCode || !firebaseServiceRef.current) return;

        setSyncStatus('syncing');
        try {
            await firebaseServiceRef.current.uploadData({
                profile,
                sessions,
                lastUpdated: Date.now()
            });
            setCloudConfig(prev => ({ ...prev, lastSync: Date.now() }));
            setSyncStatus('connected');
        } catch (error) {
            console.error('[FIREBASE] Sync failed:', error);
            setSyncStatus('error');
        }
    };

    const disconnectCloud = () => {
        if (firebaseServiceRef.current) {
            firebaseServiceRef.current.unsubscribeFromUpdates();
            firebaseServiceRef.current = null;
        }
        setCloudConfig({ syncCode: '', lastSync: 0 });
        setSyncStatus('idle');
        localStorage.removeItem('antigravity_firebase_config');
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
            setSyncCode,
            syncStatus,
            syncMemory,
            disconnectCloud
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
