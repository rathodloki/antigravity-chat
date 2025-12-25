// Firebase Realtime Database Service for Cross-Device Sync
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database';
import type { DatabaseReference } from 'firebase/database';
import type { UserProfile, ChatSession } from '../types';

// Firebase Configuration - Using Realtime Database only
const firebaseConfig = {
    databaseURL: 'https://antigravity-sync-c07bf-default-rtdb.firebaseio.com/'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export interface NeuralPayload {
    profile: UserProfile;
    sessions: ChatSession[];
    lastUpdated: number;
}

export class FirebaseService {
    private syncCode: string;
    private userRef: DatabaseReference;
    private unsubscribe: (() => void) | null = null;

    constructor(syncCode: string) {
        this.syncCode = syncCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        this.userRef = ref(database, `users/${this.syncCode}`);
    }

    // Upload data to Firebase
    async uploadData(payload: NeuralPayload): Promise<void> {
        try {
            await set(this.userRef, {
                ...payload,
                lastUpdated: Date.now()
            });
            console.log('[FIREBASE] Data uploaded successfully');
        } catch (error) {
            console.error('[FIREBASE] Upload failed:', error);
            throw error;
        }
    }

    // Download data from Firebase
    async downloadData(): Promise<NeuralPayload | null> {
        try {
            const snapshot = await get(this.userRef);
            if (snapshot.exists()) {
                console.log('[FIREBASE] Data downloaded successfully');
                return snapshot.val() as NeuralPayload;
            }
            console.log('[FIREBASE] No data found for sync code');
            return null;
        } catch (error) {
            console.error('[FIREBASE] Download failed:', error);
            throw error;
        }
    }

    // Subscribe to real-time updates
    subscribeToUpdates(callback: (data: NeuralPayload | null) => void): void {
        this.unsubscribe = onValue(this.userRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val() as NeuralPayload);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('[FIREBASE] Subscription error:', error);
        });
    }

    // Unsubscribe from real-time updates
    unsubscribeFromUpdates(): void {
        if (this.unsubscribe) {
            off(this.userRef);
            this.unsubscribe = null;
        }
    }

    // Generate a random sync code
    static generateSyncCode(): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Validate sync code format
    static isValidSyncCode(code: string): boolean {
        return /^[a-z0-9]{4,16}$/.test(code.trim().toLowerCase());
    }
}
