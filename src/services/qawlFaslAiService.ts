import { proxyGenerateContent, proxyGenerateAudio } from '../lib/aiProxy';

function createWavBlobUrl(base64: string, sampleRate: number = 24000): string {
  // Check if it's already a WAV (starts with 'RIFF' which is 'UklGR' in base64)
  if (base64.startsWith('UklGR')) {
    console.log("Detected pre-existing WAV format, skipping header addition.");
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const pcmData = bytes;
  const wavBuffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);

  const wavBytes = new Uint8Array(wavBuffer);
  wavBytes.set(pcmData, 44);

  return URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' }));
}

export async function generateAudioForText(text: string): Promise<string | null> {
  return withRetry(async () => {
    console.log(`Starting High-Quality AI Audio Generation...`);
    const audioData = await proxyGenerateAudio({
      text: text.substring(0, 3000),
      voiceName: 'Puck' 
    });
    
    if (audioData) {
      return createWavBlobUrl(audioData);
    }
    throw new Error("No audio data returned");
  }, 5, 5000).catch(err => {
    console.error("TTS Generation final failure (service issue):", err);
    // Explicitly return null if TTS failed, to trigger the browser fallback in the UI.
    return null;
  });
}

export async function generatePodcastScript(questionData: any): Promise<string> {
  return withRetry(async () => {
    const prompt = `
    أنت مستشار كويتي فاضل، حكيم، ودافئ المشاعر، لغتك تشبه الأب الحنون أو المرشد المحب. تكتب "سوالف وتأملات" (Podcast Script) تدخل القلب.
    المهمة: تحويل هذا الموقف أو الاستشارة إلى خاطرة صوتية بلهجة كويتية بيضاء جميلة، تحكيها كإنسان خبير وحكيم.

    الموضوع والمعلومات الأساسية:
    - السؤال: ${questionData.question}
    - الملخص: ${questionData.quickSummary}
    - ماذا نقول للمعني: ${questionData.quickAnswer?.sayThis}
    - الخطوات العملية: ${questionData.practicalSteps?.join(' ')}
    - التفسير والتحليل: ${questionData.educationalView}
    - الخاتمة العاطفية: ${questionData.closingThought}
    
    الأسلوب المطلوب (ضروري جداً لحل مشكلة "الصوت المصطنع والروبوتي"):
    1. **اللهجة والروح:** استخدم "اللهجة الكويتية البيضاء اللطيفة" المفهومة والسلسة. نريدها عفوية وتلقائية جداً! وكأنك جالس مع شخص تعزه تسولف معاه بصدق، بدون رسميات.
    2. **الكلمات المفتاحية الدافئة:** ابدأ بترحيب حنون (مثلاً: "يا هلا والله"، "يا حيّ الله من جانا"، "اسمعني يا عزيزي").
    3. **النطق والتقطيع الصوتي:** استخدم الفواصل والنقاط بكثرة لتعطي الذكاء الاصطناعي فرصة ليأخذ نفساً (Breathing space) لكي لا يبدو روبوتياً سريعا.
    4. **الصياغة:** ابتعد تماماً عن الفصحى الجافة، الكلمات المعقدة، أو السرد الإخباري المعقم.
    5. **الطول:** مكثف جداً وواضح ومريح للاستماع.
    `;

    const response = await proxyGenerateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.8 }
    });

    return response.text || "عذراً لم نتمكن من توليد السيناريو.";
  });
}

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
