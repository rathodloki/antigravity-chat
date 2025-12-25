import React, { useEffect, useState } from 'react';
import { GeminiRateLimiter } from '../services/RateLimiter';
import type { TrafficStatus } from '../services/RateLimiter';

export const TrafficLight: React.FC = () => {
    const [status, setStatus] = useState<TrafficStatus>('GREEN');
    useEffect(() => {
        const limiter = new GeminiRateLimiter();

        const check = () => {
            // Check status for primary model (usually flash or the one active)
            const { status: s } = limiter.checkStatus('gemini-3-flash-preview');
            setStatus(s);
        };

        check();
        const interval = setInterval(check, 1000); // Poll every second to update countdowns/metrics
        return () => clearInterval(interval);
    }, []);

    const getColor = (s: TrafficStatus) => {
        switch (s) {
            case 'GREEN': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
            case 'YELLOW': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
            case 'RED': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
        }
    };

    return (
        <div className="flex items-center gap-2 px-2 py-1 rounded-none border border-white/5 bg-black/20">
            <div className={`w-1.5 h-3 rounded-[1px] ${getColor(status)}`} />
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white font-mono leading-none tracking-widest">
                    {status}
                </span>
            </div>
        </div>
    );
};
