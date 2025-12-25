import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Check for the specific "length" crash or others
        if (error.message.includes("length") || error.message.includes("undefined")) {
            console.warn("CRITICAL DATA CORRUPTION DETECTED. AUTO-HEALING IN PROGRESS...");

            // 1. Nuke potential bad data
            localStorage.removeItem('antigravity_memory_v1');
            localStorage.removeItem('antigravity_history_v1');
            localStorage.removeItem('antigravity_firebase_config');

            // 2. Clear Session
            sessionStorage.clear();

            // 3. Reload after brief delay to let user see empty state if needed, 
            // but for this crash we want immediate recovery.
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    width: '100vw',
                    backgroundColor: '#000',
                    color: '#0f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'monospace'
                }}>
                    <h1 style={{ fontSize: '24px', letterSpacing: '4px' }}>SYSTEM FAILURE DETECTED</h1>
                    <p style={{ color: '#888', marginTop: '10px' }}>INITIATING AUTO-RECOVERY SEQUENCE...</p>
                    <div style={{ marginTop: '20px', width: '200px', height: '2px', background: '#333' }}>
                        <div style={{ width: '100%', height: '100%', background: '#0f0', animation: 'loading 1s infinite' }} />
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
