import { proxyGenerateContent } from "../lib/aiProxy";

export interface ThoughtNode {
    id: string;
    originalText: string;
    normalizedMeaning: string;
    mainTopic: string;
    subTopics: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    ageMentioned?: string;
    emotionalTone: string;
    generatedText: string;
    timestamp: number;
    usageCount: number;
    relatedToId?: string;
    classification: 'exact_duplicate' | 'similar_case' | 'related_variant' | 'high_risk_variant' | 'new_case' | 'original';
    variants?: ThoughtNode[]; // For UI tree display
}

export class KnowledgeMemoryService {
    private static STORAGE_KEY = 'tebyan_thought_memory';

    static getMemory(): ThoughtNode[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    static saveMemory(entry: ThoughtNode) {
        const memory = this.getMemory();
        memory.push(entry);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memory));
    }

    static updateUsage(id: string) {
        const memory = this.getMemory();
        const entry = memory.find(e => e.id === id);
        if (entry) {
            entry.usageCount = (entry.usageCount || 1) + 1;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memory));
        }
    }

    static getMemoryTree(): ThoughtNode[] {
        const memory = this.getMemory();
        const roots = memory.filter(m => !m.relatedToId || m.classification === 'new_case' || m.classification === 'original');
        
        roots.forEach(root => {
            root.variants = memory.filter(m => m.relatedToId === root.id);
        });

        // Sort by usage or timestamp
        return roots.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Smart Processing of user input.
     * Evaluates similarity, reuses cached results, or generates new/variant results.
     */
    static async processUnderstanding(
        userInput: string, 
        systemInstruction: string,
        modelConfig: any,
        generateCallback: (prompt: string, instruction: string, modifiedConfig?: any) => Promise<string>
    ): Promise<{ text: string, type: string, entry: Partial<ThoughtNode> }> {
        const memory = this.getMemory();

        if (memory.length === 0) {
            return await this.generateNewCase(userInput, systemInstruction, modelConfig, generateCallback);
        }

        // Prepare context from last 50 topics to save tokens
        const recentMemory = memory.slice(-50);
        const memoryContext = recentMemory.map(e => `[ID: ${e.id}] TEXT: "${e.originalText}" | MEANING: ${e.normalizedMeaning}`).join('\n');
        
        const evaluationPrompt = `
You are a smart semantic matching engine.
We have a database of previous user inputs:
${memoryContext}

New User Input: "${userInput}"

Analyze the NEW input against the database.
Extract: 
- normalizedMeaning (short summary)
- mainTopic (core subject)
- subTopics (keywords)
- riskLevel (low/medium/high/critical)
- ageMentioned (string or null)
- emotionalTone

Determine classification:
- "exact_duplicate" or "similar_case": Same meaning, no significant new details.
- "related_variant": Same topic but new details (e.g. age, location) that slightly change context.
- "high_risk_variant": Same topic but with severe escalation (like violence, self-harm, hitting).
- "new_case": Completely different or significantly distinct topic.

Return ONLY JSON:
{
  "classification": "exact_duplicate" | "similar_case" | "related_variant" | "high_risk_variant" | "new_case",
  "matchId": "id or null",
  "normalizedMeaning": "...",
  "mainTopic": "...",
  "subTopics": ["...", "..."],
  "riskLevel": "low",
  "ageMentioned": "12",
  "emotionalTone": "..."
}`;

        try {
            const evalResponse = await proxyGenerateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: evaluationPrompt }] }],
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            });

            const evaluation = JSON.parse(evalResponse.text);
            const matchedEntry = evaluation.matchId ? memory.find(e => e.id === evaluation.matchId) : null;

            if ((evaluation.classification === 'exact_duplicate' || evaluation.classification === 'similar_case') && matchedEntry) {
                this.updateUsage(matchedEntry.id);
                // Save instance as a variant of the original to keep original text
                const usageEntry = this.createEntry(userInput, evaluation, matchedEntry.generatedText, matchedEntry.id);
                this.saveMemory(usageEntry);
                return { 
                    text: matchedEntry.generatedText, 
                    type: evaluation.classification, 
                    entry: usageEntry 
                };
            }

            if (evaluation.classification === 'related_variant' && matchedEntry) {
                // Generate delta
                const modPrompt = `We previously analyzed this case:
"${matchedEntry.originalText}"
Conclusion was:
${matchedEntry.generatedText}

User now added this variant/detail:
"${userInput}"

Update the conclusion to incorporate the new details without losing the original wisdom. Do not write from scratch. Make sure you return the output in the EXACT same format as previously generated.`;
                
                const newText = await generateCallback(modPrompt, systemInstruction, modelConfig);
                const newEntry = this.createEntry(userInput, evaluation, newText, matchedEntry.id);
                this.saveMemory(newEntry);
                return { text: newText, type: 'related_variant', entry: newEntry };
            }

            if (evaluation.classification === 'high_risk_variant' && matchedEntry) {
                const modPrompt = `Previous case: "${matchedEntry.originalText}".
New escalated case: "${userInput}".
This is a high-risk escalation! Generate a deep, serious analysis focusing on the NEW risks. Return in the requested format.`;
                const newText = await generateCallback(modPrompt, systemInstruction, modelConfig);
                const newEntry = this.createEntry(userInput, evaluation, newText, matchedEntry.id);
                this.saveMemory(newEntry);
                return { text: newText, type: 'high_risk_variant', entry: newEntry };
            }

            // Fallback or new_case
            return await this.generateNewCaseFallback(userInput, systemInstruction, modelConfig, evaluation, generateCallback);

        } catch (error) {
            console.error("Knowledge Memory Evaluation Error:", error);
            return await this.generateNewCase(userInput, systemInstruction, modelConfig, generateCallback);
        }
    }

    private static async generateNewCase(
        userInput: string, 
        baseInstruction: string, 
        modelConfig: any,
        generateCallback: (prompt: string, instruction: string, mConfig?: any) => Promise<string>
    ) {
        const newText = await generateCallback(userInput, baseInstruction, modelConfig);
        const newEntry: ThoughtNode = {
            id: 'mem_' + Date.now().toString() + Math.random().toString(36).substring(2, 6),
            originalText: userInput,
            normalizedMeaning: userInput.substring(0, 50),
            mainTopic: 'فكرة جديدة',
            subTopics: [],
            riskLevel: 'medium',
            emotionalTone: 'neutral',
            generatedText: newText,
            timestamp: Date.now(),
            usageCount: 1,
            classification: 'new_case'
        };
        this.saveMemory(newEntry);
        return { text: newText, type: 'new_case', entry: newEntry };
    }

    private static async generateNewCaseFallback(
        userInput: string, 
        baseInstruction: string, 
        modelConfig: any,
        evaluation: any,
        generateCallback: (prompt: string, instruction: string, mConfig?: any) => Promise<string>
    ) {
        const newText = await generateCallback(userInput, baseInstruction, modelConfig);
        const newEntry = this.createEntry(userInput, evaluation, newText);
        newEntry.classification = 'original';
        this.saveMemory(newEntry);
        return { text: newText, type: 'new_case', entry: newEntry };
    }

    private static createEntry(userInput: string, evaluation: any, text: string, relatedId?: string): ThoughtNode {
        return {
            id: 'mem_' + Date.now().toString() + Math.random().toString(36).substring(2, 6),
            originalText: userInput,
            normalizedMeaning: evaluation.normalizedMeaning || userInput.substring(0, 50),
            mainTopic: evaluation.mainTopic || 'Unknown',
            subTopics: evaluation.subTopics || [],
            riskLevel: evaluation.riskLevel || 'medium',
            ageMentioned: evaluation.ageMentioned,
            emotionalTone: evaluation.emotionalTone || 'neutral',
            generatedText: text,
            timestamp: Date.now(),
            usageCount: 1,
            classification: evaluation.classification || 'new_case',
            relatedToId: relatedId
        };
    }
}
