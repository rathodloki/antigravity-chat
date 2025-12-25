import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface AlertOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
}

interface UIContextType {
    showAlert: (options: AlertOptions) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within UIProvider');
    return context;
};

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        options: AlertOptions | null;
    }>({
        isOpen: false,
        options: null
    });

    const showAlert = (options: AlertOptions) => {
        setAlertState({ isOpen: true, options });
    };

    const closeAlert = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = () => {
        if (alertState.options?.onConfirm) {
            alertState.options.onConfirm();
        }
        closeAlert();
    };

    return (
        <UIContext.Provider value={{ showAlert }}>
            {children}

            {/* Custom Alert Modal */}
            {alertState.isOpen && alertState.options && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-[#0a0a0b] border border-white/10 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        {/* Decorative Top Line */}
                        <div className={`h-1 w-full ${alertState.options.type === 'danger' ? 'bg-red-500' : 'bg-[var(--accent-primary)]'}`} />

                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`p-2 rounded-lg ${alertState.options.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'}`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold font-mono tracking-wider uppercase text-sm mb-1">
                                        {alertState.options.title}
                                    </h3>
                                    <p className="text-[var(--text-dim)] text-xs leading-relaxed">
                                        {alertState.options.message}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    onClick={closeAlert}
                                    className="px-4 py-2 text-[10px] uppercase tracking-wider font-mono text-[var(--text-dim)] hover:text-white transition-colors"
                                >
                                    {alertState.options.cancelLabel || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`px-4 py-2 text-[10px] uppercase tracking-wider font-mono font-bold transition-all border ${alertState.options.type === 'danger'
                                        ? 'border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                        : 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black'
                                        }`}
                                >
                                    {alertState.options.confirmLabel || 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </UIContext.Provider>
    );
};
