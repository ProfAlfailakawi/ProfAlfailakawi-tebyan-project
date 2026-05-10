import { proxyGenerateContent } from '../lib/aiProxy';

const Type = {
  OBJECT: 'OBJECT' as any,
  STRING: 'STRING' as any,
  ARRAY: 'ARRAY' as any,
  NUMBER: 'NUMBER' as any,
  BOOLEAN: 'BOOLEAN' as any,
};

type Schema = any;

const qawlFaslSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    mainCategory: { type: Type.STRING },
    categorySlug: { type: Type.STRING },
    ageGroups: { type: Type.ARRAY, items: { type: Type.STRING } },
    riskLevel: { type: Type.STRING },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    quickSummary: { type: Type.STRING },
    quickAnswer: {
      type: Type.OBJECT,
      properties: {
        sayThis: { type: Type.STRING },
        dontSayThis: { type: Type.STRING },
        doThisNow: { type: Type.STRING },
      },
      required: ["sayThis", "dontSayThis", "doThisNow"],
    },
    commonMistake: { type: Type.STRING },
    educationalView: { type: Type.STRING },
    suggestedAnswer: { type: Type.STRING },
    byAgeVersions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            age: { type: Type.STRING },
            text: { type: Type.STRING },
        },
        required: ["age", "text"],
      },
    },
    practicalSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
    exercises: { type: Type.ARRAY, items: { type: Type.STRING } },
    whenToWorry: { type: Type.STRING },
    religiousReference: { type: Type.STRING },
    scientificStat: { type: Type.STRING },
    resources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          url: { type: Type.STRING },
        },
        required: ["type", "title", "description", "url"],
      },
    },
    closingThought: { type: Type.STRING },
    sourceStatus: { type: Type.STRING }
  },
  required: [
    "question", "mainCategory", "categorySlug", "ageGroups", "riskLevel", "keywords",
    "quickSummary", "quickAnswer", "commonMistake", "educationalView",
    "suggestedAnswer", "byAgeVersions", "practicalSteps", "exercises",
    "whenToWorry", "religiousReference", "scientificStat", "resources", "closingThought", "sourceStatus"
  ],
};

const SYSTEM_INSTRUCTION = `
You are a VERIFIED CONTENT GENERATION SYSTEM for a case-analysis and decision intelligence platform called "قول فصل".
🎯 CORE RULE: DO NOT fabricate information.
TALE: Arabic (Kuwaiti influence for empathy).

قاعدة أسلوبية نهائية صارمة: 
1. حوّل النص ولا تخاطب المستخدم بصيغة مذكر أو مؤنث نهائياً.
2. ممنوع استخدام كلمات مثل (أنت، أنتِ، عليك، عليكِ، يمكنك، حاول، حاولي، تذكر، تذكري، كن، كوني).
3. استخدم بدلاً منها صياغة إرشادية هادئة أو جماعية (مثال: "يمكن التعامل عبر..."، "من الأفضل..."، "يُنصح بـ...").
4. اجعل الإجابة موجهة للموقف وليس للشخص بشكل مباشر.
`;

const chatSessions: Record<string, any> = {};

export async function generateFollowUp(questionId: string, message: string, history: any[] = []): Promise<string> {
    return withRetry(async () => {
        const response = await proxyGenerateContent({
          model: 'gemini-1.5-flash',
          contents: [...history, { role: 'user', parts: [{ text: message }] }],
          config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "";
    });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 7, initialDelay = 4000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toLowerCase();
      const errorMsg = (error?.message || "").toLowerCase();
      
      const isRetryable = errorStr.includes('429') || 
                          errorStr.includes('500') ||
                          errorStr.includes('503') || 
                          errorStr.includes('high demand') ||
                          errorStr.includes('unavailable') ||
                          errorStr.includes('overloaded') ||
                          errorStr.includes('deadline') ||
                          errorStr.includes('limit') ||
                          errorStr.includes('quota') ||
                          errorMsg.includes('unavailable') ||
                          errorMsg.includes('overloaded') ||
                          errorMsg.includes('high demand');

      if (isRetryable && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i) + Math.random() * 2000;
        console.warn(`[AI Retry] Attempt ${i + 1} failed with ${errorMsg.substring(0, 50)}... Retrying in ${Math.round(delay)}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export class GeminiKeyMissingError extends Error {
  code: string;
  constructor() {
    super("GEMINI_API_KEY_NOT_CONFIGURED");
    this.name = "GeminiKeyMissingError";
    this.code = "GEMINI_API_KEY_NOT_CONFIGURED";
  }
}

export async function generateQawlFaslContent(question: string, context?: string) {
  return withRetry(async () => {
    const prompt = `Situation/Question from a user: "${question}"\nAdditional context: ${context || 'None'}`;
    
    // Check if key is configured (by checking if the proxy fails in a way that suggests it)
    let response;
    try {
      response = await proxyGenerateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: qawlFaslSchema,
          temperature: 0.2,
        }
      });
    } catch (e: any) {
      if (e.code === "GEMINI_API_KEY_NOT_CONFIGURED" || e.message.includes("GEMINI_API_KEY_NOT_CONFIGURED") || e.message.includes("API_KEY") || e.message.includes("401")) {
        throw new GeminiKeyMissingError();
      }
      throw e;
    }

    if (response && response.text) {
      const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
    throw new Error('No content returned from AI');
  }).catch(error => {
    if (!(error instanceof GeminiKeyMissingError)) {
        console.warn('Handling failure in generateQawlFaslContent:', error.message);
    }
    throw error;
  });
}
