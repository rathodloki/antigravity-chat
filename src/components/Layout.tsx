import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row fixed inset-0 overflow-hidden text-[var(--text-main)] selection:bg-[var(--accent-primary)] selection:text-black">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar (slides in) - MOVED TO TOP LEVEL TO FIX Z-INDEX */}
            {/* It must be outside the z-10 wrapper to be above the z-40 overlay */}
            <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar className="flex h-full shadow-2xl" onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Mobile Header Bar - Fixes overlap issue */}
            <div className="flex md:hidden items-center justify-between px-4 py-3 bg-[#050505] border-b border-white/10 relative z-30 flex-shrink-0">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-1 text-white hover:bg-white/10 rounded-md"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <span className="font-mono font-bold text-sm tracking-widest text-white uppercase select-none">
                    ANTIGRAVITY
                </span>

                {/* Spacer for balance */}
                <div className="w-8" />
            </div>

            <div className="relative z-10 flex w-full flex-1 overflow-hidden backdrop-blur-sm">
                {/* Desktop Sidebar (hidden on mobile) */}
                <Sidebar className="hidden md:flex flex-shrink-0" />

                <main className="flex-1 min-w-0 relative flex flex-col bg-black/20 h-full">
                    {children}
                </main>
            </div>
        </div>
    );
};
