import type { UserProfile } from "../types";

const GIST_FILENAME = 'antigravity_memory.json';
const GIST_DESCRIPTION = 'Antigravity AI Memory Backup - Do Not Edit Manually';

interface GistFile {
    content: string;
}

interface GistResponse {
    id: string;
    files: Record<string, GistFile>;
    updated_at: string;
}

export class GistService {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private get headers() {
        return {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        };
    }

    /**
     * searches for an existing Antigravity Gist.
     * Returns the ID if found, null otherwise.
     */
    async findExistingGistId(): Promise<string | null> {
        try {
            const response = await fetch('https://api.github.com/gists', {
                headers: this.headers
            });

            if (!response.ok) {
                console.error('Failed to list gists:', await response.text());
                throw new Error('Failed to connect to GitHub. Check key.');
            }

            const gists: GistResponse[] = await response.json();
            const found = gists.find(g => g.files[GIST_FILENAME]);
            return found ? found.id : null;
        } catch (error) {
            console.error('Error finding gist:', error);
            throw error;
        }
    }

    /**
     * Creates a new Gist with the initial memory data.
     */
    async createGist(initialData: UserProfile): Promise<string> {
        const body = {
            description: GIST_DESCRIPTION,
            public: false, // Secret Gist
            files: {
                [GIST_FILENAME]: {
                    content: JSON.stringify(initialData, null, 2)
                }
            }
        };

        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error('Failed to create Gist');
        const data: GistResponse = await response.json();
        return data.id;
    }

    /**
     * Downloads the memory from the Gist.
     */
    async downloadMemory(gistId: string): Promise<{ data: UserProfile, lastUpdated: string } | null> {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: this.headers
        });

        if (!response.ok) return null;

        const gist: GistResponse = await response.json();
        const file = gist.files[GIST_FILENAME];

        if (!file || !file.content) return null;

        try {
            const data = JSON.parse(file.content) as UserProfile;
            return { data, lastUpdated: gist.updated_at };
        } catch (e) {
            console.error('Failed to parse Gist content', e);
            return null;
        }
    }

    /**
     * Updates the Gist with new memory data.
     */
    async updateMemory(gistId: string, data: UserProfile): Promise<void> {
        const body = {
            files: {
                [GIST_FILENAME]: {
                    content: JSON.stringify(data, null, 2)
                }
            }
        };

        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error('Failed to sync to Cloud');
    }
}
