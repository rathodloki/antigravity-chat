
interface RateLimitConfig {
    rpm: number; // Requests Per Minute
    tpm: number; // Tokens Per Minute
    rpd: number; // Requests Per Day
}

interface UsageMetrics {
    requestsMinute: number;
    tokensMinute: number;
    requestsDay: number;
    lastResetMinute: number;
    lastResetDay: number;
}

export type TrafficStatus = 'GREEN' | 'YELLOW' | 'RED';

export class GeminiRateLimiter {
    private usage: UsageMetrics;
    private readonly limits: Record<string, RateLimitConfig>;

    constructor() {
        // Load usage from localStorage to persist across reloads
        const saved = localStorage.getItem('gemini_rate_usage');
        this.usage = saved ? JSON.parse(saved) : {
            requestsMinute: 0,
            tokensMinute: 0,
            requestsDay: 0,
            lastResetMinute: Date.now(),
            lastResetDay: Date.now()
        };

        // Define Limits according to your specs
        this.limits = {
            'PRO': { rpm: 2, tpm: 32000, rpd: 50 },
            'FLASH': { rpm: 15, tpm: 1000000, rpd: 1500 }
        };
    }

    private load() {
        const saved = localStorage.getItem('gemini_rate_usage');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Safety: Ensure valid numbers
            this.usage = {
                ...this.usage,
                ...parsed
            };
        }
    }

    private checkReset() {
        // SYNC: Always reload latest state from storage before checking/modifying
        this.load();

        const now = Date.now();

        // Reset Minute Counters
        if (now - this.usage.lastResetMinute > 60000) {
            this.usage.requestsMinute = 0;
            this.usage.tokensMinute = 0;
            this.usage.lastResetMinute = now;
        }

        // Reset Day Counters
        if (now - this.usage.lastResetDay > 86400000) {
            this.usage.requestsDay = 0;
            this.usage.lastResetDay = now;
        }

        this.save();
    }

    private getModelType(modelName: string): 'PRO' | 'FLASH' {
        return modelName.toLowerCase().includes('pro') ? 'PRO' : 'FLASH';
    }

    public estimateTokens(text: string): number {
        // Simple accurate estimation: ~4 chars per token
        return Math.ceil(text.length / 4);
    }

    public checkStatus(modelName: string): { status: TrafficStatus, msg: string } {
        this.checkReset();
        const type = this.getModelType(modelName);
        const limit = this.limits[type];

        const rpmPct = this.usage.requestsMinute / limit.rpm;
        const tpmPct = this.usage.tokensMinute / limit.tpm;
        const rpdPct = this.usage.requestsDay / limit.rpd;

        const maxPct = Math.max(rpmPct, tpmPct, rpdPct);

        let status: TrafficStatus = 'GREEN';
        let msg = `[🟢 GREEN] ${type} | RPM: ${this.usage.requestsMinute}/${limit.rpm} | TPM: ${this.usage.tokensMinute}/${limit.tpm} | "Safe to send"`;

        if (maxPct >= 1) {
            status = 'RED';
            msg = `[🔴 RED] ${type} | LIMIT REACHED | RPM: ${this.usage.requestsMinute}/${limit.rpm} | Waiting 60s...`;
        } else if (maxPct >= 0.8) {
            status = 'YELLOW';
            msg = `[🟡 YELLOW] ${type} | High Traffic | RPM: ${this.usage.requestsMinute}/${limit.rpm} | Slow down safely.`;
        }

        return { status, msg };
    }

    public logUsage(_modelName: string, tokens: number) {
        this.checkReset();
        this.usage.requestsMinute++;
        this.usage.requestsDay++;
        this.usage.tokensMinute += tokens;
        this.save();
    }

    private save() {
        localStorage.setItem('gemini_rate_usage', JSON.stringify(this.usage));
    }

    public getMetrics() {
        return this.usage;
    }
}
