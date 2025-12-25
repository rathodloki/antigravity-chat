import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Copy, Check, Terminal } from 'lucide-react';
import type { Message } from '../types';

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}
        >
            <div className={`flex flex-col max-w-4xl w-full ${isUser ? 'items-end' : 'items-start'}`}>

                {/* Header / Identity */}
                <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-mono tracking-wider uppercase">
                    {isUser ? (
                        <>
                            <span>User@Local</span>
                            <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full" />
                        </>
                    ) : (
                        <>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            <span>Antigravity_Core</span>
                        </>
                    )}
                </div>

                {/* Content Container */}
                <div className={`
                    relative transition-all duration-300 border
                    ${isUser
                        ? 'bg-[#151515] border-[var(--accent-primary)]/20 text-white px-5 py-3 rounded-none border-l-2 border-l-[var(--accent-primary)]'
                        : 'bg-transparent border-transparent text-[var(--text-main)] px-0 py-1 w-full'
                    }
                `}>
                    <div className={`prose prose-invert max-w-none break-words whitespace-pre-wrap prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-none ${isUser ? 'prose-p:text-gray-100' : 'prose-p:text-gray-300'}`}>
                        <ReactMarkdown
                            components={{
                                // Custom Code Block Renderer
                                pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                                code: ({ node, className, children, ...props }) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isInline = !match && !String(children).includes('\n');

                                    return isInline ? (
                                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-[var(--accent-primary)] font-mono text-xs" {...props}>
                                            {children}
                                        </code>
                                    ) : (
                                        <code className={`${className} block`} {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>

                    {/* Footer Metadata */}
                    <div className={`flex items-center gap-4 mt-2 ${isUser ? 'justify-end' : ''} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <span className="text-[9px] text-[var(--text-dim)] font-mono">
                            T: {new Date(message.timestamp).toLocaleTimeString([], { hour12: false })}
                        </span>
                        {!isUser && (
                            <span className="text-[9px] text-[var(--text-dim)] font-mono">
                                HASH: {message.id.slice(-6)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Internal Code Block Component
const CodeBlock = ({ children }: { children: React.ReactNode }) => {
    const [copied, setCopied] = useState(false);

    // Extract text from children (safely)
    const extractText = (node: React.ReactNode): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(extractText).join('');
        if (React.isValidElement(node)) {
            const element = node as React.ReactElement<any>;
            if (element.props.children) return extractText(element.props.children);
        }
        return '';
    };

    const handleCopy = () => {
        const text = extractText(children);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative mt-4 mb-4 group/code border border-white/10 rounded-lg overflow-hidden bg-[#0a0a0b]">
            {/* Code Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-[var(--text-dim)]" />
                    <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase">Code Snippet</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-dim)] hover:text-white transition-colors"
                >
                    {copied ? (
                        <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto text-xs font-mono leading-relaxed">
                {children}
            </div>
        </div>
    );
};
