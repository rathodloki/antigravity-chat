import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Message, UserProfile } from "../types";
import { GeminiRateLimiter } from "./RateLimiter";

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private limiter: GeminiRateLimiter;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.limiter = new GeminiRateLimiter();
    }

    async generateResponse(
        history: Message[],
        userProfile: UserProfile,
        systemInstruction?: string,
        modelId: string = "gemini-2.0-flash",
        retryCount = 0
    ): Promise<string> {
        // Initialize Model Dynamic
        this.model = this.genAI.getGenerativeModel({
            model: modelId,
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
            ]
        });

        // RATE LIMIT CHECK
        const { status, msg } = this.limiter.checkStatus(this.model.model);
        console.log(msg);

        if (status === 'RED') {
            return `⚠️ **Traffic Light RED**: Quota exceeded. ${msg.replace(/.*\|/, '')}`;
        }

        try {
            // 1. Construct MEMORY-AWARE system prompt
            const factsSection = userProfile.facts.length > 0
                ? `\n## IMPORTANT - THINGS I KNOW ABOUT ${userProfile.name.toUpperCase()}:\n${userProfile.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n`
                : '\n(No facts stored yet about this user)\n';

            const preferencesSection = userProfile.preferences.length > 0
                ? `\n## USER PREFERENCES:\n${userProfile.preferences.map(p => `- ${p}`).join('\n')}\n`
                : '';

            const memoryContext = `You are Antigravity, a personal AI assistant with PERSISTENT MEMORY.

# USER PROFILE
Name: ${userProfile.name}
Current Mood: ${userProfile.mood}
Writing Style: ${userProfile.writingStyle || 'Standard'}
Expertise: ${userProfile.knowledgeBase || 'General'}
${factsSection}${preferencesSection}

# SYSTEM CONFIGURATION
Active Persona: ${userProfile.persona || 'Default Assistant'}
Neural Scene: ${userProfile.neuralScene || 'Standard Void'}

# CRITICAL INSTRUCTIONS:
1. You MUST remember and reference the facts listed above when relevant.
2. ADOPT the 'Active Persona' defined above. Tone and style should reflect this personality.
3. CONTEXTUALIZE responses based on the 'Neural Scene'. (e.g., if 'War Room', be strategic and direct).
4. RESPECT the user's 'Writing Style' and 'Expertise'. Don't over-explain concepts they already know.
5. If the user asks "what do you know about me?", LIST the facts above.
6. Current time: ${new Date().toLocaleString()}
${systemInstruction || ''}`;

            // 2. Convert history to Gemini format
            const chatHistory = history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            // 3. Create chat session
            // EDGE CASE: If this is the FIRST message, pastHistory is empty.
            // API REQUIREMENT: History must match valid turn-taking (User -> Model -> User).
            // It cannot start with 'model'.

            let pastHistory = chatHistory.slice(0, -1);
            const lastMessage = chatHistory[chatHistory.length - 1];

            // Ensure history starts with user
            while (pastHistory.length > 0 && pastHistory[0].role !== 'user') {
                pastHistory.shift();
            }

            // Debugging logs
            console.log("Memory Context:", memoryContext);
            console.log("Filtered History:", pastHistory);
            console.log("Last Message:", lastMessage);

            const chatSession = this.model.startChat({
                history: pastHistory,
                systemInstruction: {
                    role: 'system',
                    parts: [{ text: memoryContext }]
                }
            });

            const result = await chatSession.sendMessage(lastMessage.parts[0].text);
            const responseText = result.response.text();

            // LOG ACTUAL USAGE
            const outputTokens = this.limiter.estimateTokens(responseText);
            // Input was memory + history. estimate roughly
            const inputTokens = this.limiter.estimateTokens(memoryContext + JSON.stringify(history));
            this.limiter.logUsage(this.model.model, inputTokens + outputTokens);

            return responseText;
        } catch (error: any) {
            console.error("Gemini Generation Error:", error);

            // AUTO-RECOVERY: Handle Quota (429) & Model Errors
            if (retryCount < 2 && (error.toString().includes('429') || error.toString().includes('404'))) {
                let nextModel = "gemini-2.5-flash";
                if (retryCount === 1) nextModel = "gemini-2.0-flash";

                console.warn(`Quota hit. Retry ${retryCount + 1}: Falling back to '${nextModel}'...`);

                // Fallback Model
                this.model = this.genAI.getGenerativeModel({
                    model: nextModel,
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
                        { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
                    ]
                });

                // Retry the request with the new model
                return this.generateResponse(history, userProfile, systemInstruction, nextModel, retryCount + 1);
            }

            // Return the actual error to the UI so the user can see it
            return `⚠️ **API Error**: ${error.message || error.toString()}`;
        }
    }

    async *generateResponseStream(
        history: Message[],
        userProfile: UserProfile,
        systemInstruction?: string,
        modelId: string = "gemini-2.0-flash",
        retryCount = 0
    ): AsyncGenerator<string, void, unknown> {
        // Initialize Model Dynamic
        this.model = this.genAI.getGenerativeModel({
            model: modelId,
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any },
            ]
        });

        // RATE LIMIT CHECK IS SKIPPED FOR STREAMING TO START FAST

        try {
            // 1. Construct MEMORY-AWARE system prompt (Same as before)
            const factsSection = userProfile.facts.length > 0
                ? `\n## IMPORTANT - THINGS I KNOW ABOUT ${userProfile.name.toUpperCase()}:\n${userProfile.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n`
                : '\n(No facts stored yet about this user)\n';

            const preferencesSection = userProfile.preferences.length > 0
                ? `\n## USER PREFERENCES:\n${userProfile.preferences.map(p => `- ${p}`).join('\n')}\n`
                : '';

            const memoryContext = `You are Antigravity, a personal AI assistant with PERSISTENT MEMORY.

# USER PROFILE
Name: ${userProfile.name}
Current Mood: ${userProfile.mood}
Writing Style: ${userProfile.writingStyle || 'Standard'}
Expertise: ${userProfile.knowledgeBase || 'General'}
${factsSection}${preferencesSection}

# SYSTEM CONFIGURATION
Active Persona: ${userProfile.persona || 'Default Assistant'}
Neural Scene: ${userProfile.neuralScene || 'Standard Void'}

# CRITICAL INSTRUCTIONS:
1. You MUST remember and reference the facts listed above when relevant.
2. ADOPT the 'Active Persona' defined above. Tone and style should reflect this personality.
3. CONTEXTUALIZE responses based on the 'Neural Scene'. (e.g., if 'War Room', be strategic and direct).
4. RESPECT the user's 'Writing Style' and 'Expertise'. Don't over-explain concepts they already know.
5. If the user asks "what do you know about me?", LIST the facts above.
6. Current time: ${new Date().toLocaleString()}
${systemInstruction || ''}`;

            // 2. Convert history to Gemini format
            const chatHistory = history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

            // 3. Create chat session
            let pastHistory = chatHistory.slice(0, -1);
            const lastMessage = chatHistory[chatHistory.length - 1];

            // Ensure history starts with user
            while (pastHistory.length > 0 && pastHistory[0].role !== 'user') {
                pastHistory.shift();
            }

            const chatSession = this.model.startChat({
                history: pastHistory,
                systemInstruction: {
                    role: 'system',
                    parts: [{ text: memoryContext }]
                }
            });

            // 4. Send Streaming Message
            const result = await chatSession.sendMessageStream(lastMessage.parts[0].text);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                yield chunkText;
            }

        } catch (error: any) {
            console.error("Gemini Streaming Error:", error);

            // AUTO-RECOVERY: Handle Quota (429) & Model Errors
            if (retryCount < 2 && (error.toString().includes('429') || error.toString().includes('404'))) {
                let nextModel = "gemini-2.5-flash";
                if (retryCount === 1) nextModel = "gemini-2.0-flash";

                console.warn(`Streaming Quota hit. Retry ${retryCount + 1}: Falling back to '${nextModel}'...`);

                // Add a small delay before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Recursive call for fallback
                const fallbackStream = this.generateResponseStream(history, userProfile, systemInstruction, nextModel, retryCount + 1);

                for await (const chunk of fallbackStream) {
                    yield chunk;
                }
                return;
            }

            yield `⚠️ **Stream Error**: ${error.message || error.toString()}`;
        }
    }

    async distillMemory(
        recentHistory: Message[],
        currentProfile: UserProfile,
        retryCount = 0
    ): Promise<UserProfile> {
        // Default: Gemini 2.5 Flash Lite (Fastest). Fallback: Gemini 2.5 Flash (Stable)
        const modelName = retryCount > 0 ? "gemini-2.5-flash" : "gemini-2.5-flash-lite";

        const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `You are a Memory Core. Your job is to UPDATE the User Profile based on the new conversation.
        
CURRENT PROFILE (JSON):
${JSON.stringify(currentProfile)}

RECENT CONVERSATION:
${recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

INSTRUCTIONS:
1. Identify any NEW facts, preferences, or personal details mentioned by the USER. (e.g. "I won the Bharat Ratna", "I like sushi").
2. MERGE these new facts into the existing 'facts' and 'preferences' arrays.
3. DO NOT remove existing facts unless explicitly contradicted.
4. Keep 'mood' updated based on recent tone.
5. Return the FULL updated JSON object.

OUTPUT FORMAT (JSON ONLY):
{"name":"string","preferences":["string"],"facts":["string"],"mood":"string","lastUpdated":${Date.now()}}`;

        try {
            console.log(`[MEMORY_CORE] Starting memory distillation on ${modelName}...`);
            // console.log("[MEMORY_CORE] Current facts:", currentProfile.facts);
            const result = await model.generateContent(prompt);
            let text = result.response.text();
            // console.log("[MEMORY_CORE] Raw distillation response:", text);

            // Robust JSON extraction: Find the first '{' and the last '}'
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');

            if (start !== -1 && end !== -1) {
                text = text.substring(start, end + 1);
            } else {
                // Fallback: match markdown code blocks
                const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (jsonMatch) text = jsonMatch[1].trim();
            }

            const parsed = JSON.parse(text) as UserProfile;
            // console.log("[MEMORY_CORE] Parsed new profile:", parsed);

            // SAFETY: Merge facts from LLM response with existing facts to prevent data loss
            const mergedFacts = [...new Set([...currentProfile.facts, ...parsed.facts])];
            const mergedPreferences = [...new Set([...currentProfile.preferences, ...parsed.preferences])];

            const finalProfile: UserProfile = {
                ...parsed,
                facts: mergedFacts,
                preferences: mergedPreferences,
                lastUpdated: Date.now()
            };

            console.log("[MEMORY_CORE] Profile updated successfully.");
            return finalProfile;
        } catch (e: any) {
            console.error(`[MEMORY_CORE] Distillation failed on ${modelName}:`, e.message);

            // AUTO-RECOVERY: Handle Quota (429) & Model Errors
            if (retryCount < 1 && (e.toString().includes('429') || e.toString().includes('404'))) {
                console.warn(`[MEMORY_CORE] Switching to backup model 'gemini-2.5-flash'...`);
                return this.distillMemory(recentHistory, currentProfile, retryCount + 1);
            }

            return currentProfile;
        }
    }
}
