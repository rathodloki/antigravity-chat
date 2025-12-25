import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen w-screen overflow-hidden text-[var(--text-main)] selection:bg-[var(--accent-primary)] selection:text-black">
            {/* 
               Global background is handled in index.css (body). 
               We just layer content on top with z-index if needed.
             */}
            <div className="relative z-10 flex w-full h-full backdrop-blur-sm">
                <Sidebar className="hidden md:flex flex-shrink-0" />
                <main className="flex-1 min-w-0 relative flex flex-col bg-black/20">
                    {children}
                </main>
            </div>
        </div>
    );
};
