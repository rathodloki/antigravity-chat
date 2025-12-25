import React, { useState, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import type { Message } from '../types';
import { GeminiService } from '../services/GeminiService';
import { useMemoryContext } from '../context/MemoryContext';
import { Key, ArrowDown } from 'lucide-react';

export const ChatInterface: React.FC = () => {
    const { apiKey, setApiKey, profile, updateMemory, isReflecting, currentMessages, saveMessage, setActiveView, model } = useMemoryContext();
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Imperative Scroll Control (No useEffect to prevent auto-scrolling during stream)

    const handleSendMessage = async (text: string) => {
        // Unique ID generation to prevent collisions
        const userMsgId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userMsg: Message = {
            id: userMsgId,
            role: 'user',
            content: text,
            timestamp: Date.now()
        };

        // 1. Save User Message
        saveMessage(userMsg);
        setIsLoading(true);

        // SCROLL 1: Show User Message
        setTimeout(scrollToBottom, 50);

        // Optimistic update for local processing
        // We need to create a temporary history for the service call,
        // as currentMessages might not have updated yet in the same render cycle.
        const tempHistory = [...currentMessages, userMsg];

        try {
            const service = new GeminiService(apiKey);

            // 2. Create Placeholder AI Message with unique ID
            const aiMsgId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const aiMsg: Message = {
                id: aiMsgId,
                role: 'assistant',
                content: '', // Start empty
                timestamp: Date.now()
            };

            // Add the placeholder AI message to the context state
            saveMessage(aiMsg);

            // SCROLL 2: Jump to start of AI message (Empty bubble)
            // This ensures user sees the beginning of the reply.
            setTimeout(scrollToBottom, 50);

            let fullResponseText = '';

            // 3. Stream Response
            // We pass the currently selected model. The Service handles fallback internally.
            const stream = service.generateResponseStream(tempHistory, profile, undefined, model);

            for await (const chunk of stream) {
                fullResponseText += chunk;
                // Update the specific AI message in the context state
                saveMessage({ ...aiMsg, content: fullResponseText });

                // NO auto-scroll here. User stays at the top of the AI message where we left them.
            }

            // 4. Finalize
            // The final history for memory update should include the full AI response.
            // We reconstruct it here to ensure the memory service gets the complete, final state.
            const finalHistory = [...tempHistory, { ...aiMsg, content: fullResponseText }];

            if (!fullResponseText.startsWith('⚠️')) {
                console.log('[MEMORY] Triggering memory update with', finalHistory.length, 'messages');
                // Don't await this, let it happen in background
                updateMemory(finalHistory).then(() => {
                    console.log('[MEMORY] Memory update complete.');
                });
            }

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: "⚠️ **Connection Error**: Please try again.",
                timestamp: Date.now()
            };
            saveMessage(errorMsg);
            setTimeout(scrollToBottom, 50);
        } finally {
            setIsLoading(false);
        }
    };

    // Scroll Button Logic
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            // Show button if user is more than 100px from bottom, and we are not at the very top (optional)
            const isDistanceFromBottom = scrollHeight - scrollTop - clientHeight > 100;
            setShowScrollButton(isDistanceFromBottom);
        }
    };

    const scrollToBottomSmooth = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (!apiKey) {
        return <ApiKeyInput onSetKey={setApiKey} />;
    }

    const showHero = currentMessages.length === 0;

    return (
        <div className="flex flex-col h-full w-full relative bg-transparent">
            {/* Header / Top Bar - Pro Dashboard Style */}
            <header className="flex justify-between items-center px-6 py-3 w-full z-20 bg-[#0a0a0b] border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 group cursor-pointer">
                        <span className="text-xl font-bold font-mono tracking-tighter text-white">
                            ANTIGRAVITY<span className="text-[var(--accent-primary)]">.AI</span>
                        </span>
                        <div className="px-2 py-0.5 rounded-sm bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[10px] font-mono text-[var(--accent-primary)]">
                            v2.0
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats / Controls */}
                <div className="flex items-center gap-6">
                    {/* Memory Active Indicator */}
                    {profile.lastUpdated && (
                        <div className={`hidden md:flex items-center gap-2 text-[9px] font-mono transition-opacity duration-500`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isLoading || isReflecting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="text-[var(--text-dim)] uppercase">
                                {isLoading ? 'Processing...' : (isReflecting ? 'Reflecting...' : 'Memory Active')}
                            </span>
                        </div>
                    )}

                    <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setActiveView('models')} className="hover:text-white transition-colors cursor-pointer uppercase">
                                Model: {model}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Latency: 14ms</span>
                        </div>
                    </div>

                    <div className="h-4 w-px bg-white/10 mx-2" />

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
                            <span className="text-xs font-bold text-white font-mono">{profile.name[0]}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Wrapper (Relative for button positioning) */}
            <div className="relative flex-1 min-h-0 overflow-hidden">

                {/* Scrollable Message Area */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="h-full w-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent px-4 pb-4"
                >
                    {showHero ? (
                        <div className="h-full flex flex-col items-center justify-center font-mono">
                            <div className="mb-6 text-center">
                                <div className="inline-block p-4 border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 rounded-none mb-4">
                                    <Key size={32} className="text-[var(--accent-primary)]" />
                                </div>
                                <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-2">
                                    ANTIGRAVITY v2.0
                                </h1>
                                <p className="text-[var(--text-dim)] text-xs uppercase tracking-widest">
                                    System Online • Ready for Input
                                </p>
                            </div>

                            {/* Suggestion Grid - Terminal Style */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                                {['/generate_workout_plan', '/explain_quantum', '/python_script_gen', '/dinner_ideas_rnd'].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(suggestion.replace('/', '').replace('_', ' '))}
                                        className="text-left p-3 border border-white/10 hover:border-[var(--accent-primary)] bg-black/20 hover:bg-[var(--accent-primary)]/10 transition-all group"
                                    >
                                        <span className="text-xs font-mono text-[var(--accent-primary)] mr-2">{'>'}</span>
                                        <span className="text-xs font-mono text-[var(--text-muted)] group-hover:text-white uppercase">{suggestion}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-4xl mx-auto pt-8">
                            {currentMessages.map((msg) => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}
                            {isLoading && (
                                <div className="pl-4 mb-8">
                                    <div className="w-10 h-10 bg-black/50 border border-white/10 rounded-full flex items-center justify-center mb-2 shadow-lg backdrop-blur-sm">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 bg-[var(--accent-secondary)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 bg-[var(--accent-tertiary)] rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Scroll Button - Anchored to Bottom of View Area */}
                <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                    <button
                        onClick={scrollToBottomSmooth}
                        className="p-2 bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 text-[var(--accent-primary)] rounded-full shadow-xl hover:bg-[var(--accent-primary)] hover:text-black transition-all flex items-center justify-center transform hover:scale-105 active:scale-95 group"
                        title="Scroll to bottom"
                    >
                        <ArrowDown size={14} className="group-hover:animate-bounce" />
                    </button>
                </div>

            </div>

            {/* Input Area - Floating at bottom */}
            <div className="flex-shrink-0 w-full bg-transparent z-30">
                <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
        </div>
    );
};

// Internal Component Reused (API Key)
const ApiKeyInput = ({ onSetKey }: { onSetKey: (k: string) => void }) => {
    const [val, setVal] = useState('');
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 bg-transparent relative z-10">
            <div className="glass-panel p-10 rounded-[32px] max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-tertiary)]" />

                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
                    <Key className="text-[var(--accent-primary)] w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-3 text-white">Welcome</h2>
                <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed">
                    Enter your Gemini API Key to experience the next generation of AI interaction.
                </p>
                <input
                    type="password"
                    placeholder="sk-..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all mb-4 placeholder-gray-600"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                />
                <button
                    onClick={() => val && onSetKey(val)}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-[var(--accent-primary)] hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-300"
                >
                    Start Chatting
                </button>
            </div>
        </div>
    );
};
