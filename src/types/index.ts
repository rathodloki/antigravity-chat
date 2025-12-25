export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
    isArchived?: boolean;
}

export interface UserProfile {
    name: string;
    preferences: string[];
    facts: string[];
    mood: string;
    writingStyle?: string;
    knowledgeBase?: string;
    persona?: string;
    neuralScene?: string;
    lastUpdated: number;
}
