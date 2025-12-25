import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-screen overflow-hidden text-[var(--text-main)] selection:bg-[var(--accent-primary)] selection:text-black">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-[#050505] border border-white/10 rounded-md md:hidden"
            >
                {isMobileMenuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>

            <div className="relative z-10 flex w-full h-full backdrop-blur-sm">
                {/* Desktop Sidebar (hidden on mobile) */}
                <Sidebar className="hidden md:flex flex-shrink-0" />

                {/* Mobile Sidebar (slides in) */}
                <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Sidebar className="flex h-full" onNavigate={() => setIsMobileMenuOpen(false)} />
                </div>

                <main className="flex-1 min-w-0 relative flex flex-col bg-black/20">
                    {children}
                </main>
            </div>
        </div>
    );
};
