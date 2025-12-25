import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
    const [text, setText] = useState('');
    const [mode, setMode] = useState<'plain' | 'markdown'>(() => {
        const saved = localStorage.getItem('chat_input_mode');
        return (saved === 'plain' || saved === 'markdown') ? saved : 'plain';
    });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        localStorage.setItem('chat_input_mode', mode);
    }, [mode]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [text]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (text.trim() && !disabled) {
            onSend(text);
            setText('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleAddContext = () => {
        const contextTemplate = `\n\n--- [CONTEXT BLOCK] ---\n> Paste context here...\n`;
        setText(prev => prev + contextTemplate);
        // Auto focus logic
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
                textareaRef.current.focus();
            }
        }, 10);
    };

    return (
        <div className="w-full max-w-5xl mx-auto relative px-6 pb-6">
            {/* Terminal Input Container */}
            <div className="relative flex flex-col bg-[#0f0f10] border border-white/10 focus-within:border-[var(--accent-primary)]/50 transition-colors">

                {/* Input Header/Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-4 text-[10px] uppercase font-mono text-[var(--text-dim)]">
                        <button
                            onClick={() => setMode('plain')}
                            className={`hover:text-white cursor-pointer transition-colors ${mode === 'plain' ? 'text-[var(--accent-primary)] font-bold' : ''}`}
                        >
                            Plain Text
                        </button>
                        <button
                            onClick={() => setMode('markdown')}
                            className={`hover:text-white cursor-pointer transition-colors ${mode === 'markdown' ? 'text-[var(--accent-primary)] font-bold' : ''}`}
                        >
                            Markdown
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAddContext}
                            className="text-[10px] font-mono text-[var(--text-dim)] hover:text-[var(--accent-primary)] flex items-center gap-1 transition-colors"
                        >
                            <Plus size={12} /> ADD CONTEXT
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 p-2">
                    <span className="text-[var(--accent-primary)] mt-3.5 pl-2 font-mono">{'>'}</span>
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder={mode === 'markdown' ? "Execute command (Markdown enabled)..." : "Enter raw text input..."}
                        className={`flex-1 bg-transparent text-[var(--text-main)] ${mode === 'markdown' ? 'font-mono' : 'font-sans'} placeholder-[var(--text-dim)] py-3 px-2 max-h-[300px] outline-none resize-none scrollbar-hide text-[14px] leading-[1.6]`}
                        rows={1}
                    />
                </div>

                {/* Footer Actions */}
                <div className="flex justify-between items-center px-4 py-2">
                    <div className="text-[10px] text-[#444] font-mono">buffer: {text.length} chars | mode: {mode.toUpperCase()}</div>

                    <button
                        onClick={handleSend}
                        disabled={!text.trim() || disabled}
                        className={`px-4 py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider transition-all border border-transparent ${text.trim()
                            ? 'bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-secondary)]'
                            : 'text-[var(--text-dim)]'
                            }`}
                    >
                        {text.trim() ? 'SEND REQUEST' : 'READY'}
                    </button>
                </div>
            </div>

            <div className="flex justify-between mt-2 px-1">
                <div className="text-[9px] font-mono text-[#444] uppercase">Antigravity Term v2</div>
                <div className="text-[9px] font-mono text-[#444] uppercase">Secure Connection</div>
            </div>
        </div>
    );
};
