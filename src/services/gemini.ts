// Local mirror of GoogleGenAI types to avoid importing the SDK in the frontend
const Type = {
  OBJECT: 'OBJECT' as any,
  STRING: 'STRING' as any,
  ARRAY: 'ARRAY' as any,
  NUMBER: 'NUMBER' as any,
  BOOLEAN: 'BOOLEAN' as any,
  INTEGER: 'INTEGER' as any,
};

import { perfMonitor } from "../lib/performance";
import { proxyGenerateContent } from "../lib/aiProxy";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const ai: any = {
  models: {
    generateContent: async (params: any) => {
      const response = await proxyGenerateContent({
        model: params.model,
        contents: params.contents,
        config: params.config
      });
      return {
        text: response.text,
        response: response.response
      };
    },
    generateVideos: async (params: any) => {
      // For now, video generation through proxy might need an endpoint,
      // but let's assume it's less critical or needs its own endpoint.
      // We'll throw if not implemented, or just proxy if it's generic.
      throw new Error("Video generation not supported in proxied mode yet");
    }
  },
  operations: {
    getVideosOperation: async () => { throw new Error("Not implemented"); }
  }
};

// Global cache for AI requests
const aiCache = new Map<string, any>();
const originalGenerateContent = ai.models.generateContent.bind(ai.models);
ai.models.generateContent = async (params: any & { skipCache?: boolean }) => {
  // Faster cache key generation: use a simple hash of the prompt instead of stringifying the whole config
  const promptText = params.contents?.[0]?.parts?.[0]?.text || "";
  const modelName = params.model || "gemini";
  const persona = params.config?.systemInstruction || "";
  const cacheKey = `${modelName}-${promptText.substring(0, 100)}-${persona.substring(0, 100)}`;
  
  if (!params.skipCache && aiCache.has(cacheKey)) {
    return aiCache.get(cacheKey);
  }
  
  const startTime = performance.now();
  const result = await originalGenerateContent(params);
  const durationMs = performance.now() - startTime;
  
  perfMonitor.recordApiCall(modelName, durationMs);
  
  if (!params.skipCache) {
    aiCache.set(cacheKey, result);
  }
  
  // Log usage to Firestore for cost monitoring dashboard
  try {
    const isCached = result && (result as any)._cached;
    const promptLog = promptText ? promptText.substring(0, 500) : "";
    await addDoc(collection(db, 'ai_logs'), {
      timestamp: serverTimestamp(),
      model: modelName,
      source: isCached ? (result as any)._cached : 'ai',
      durationMs,
      promptLength: promptText.length,
      promptSnippet: promptLog,
      personaSnippet: persona.substring(0, 100)
    });
  } catch (e) {
    console.warn("Could not log AI usage to Firestore", e);
  }

  return result;
};

const DEFAULT_MODEL = "gemini-2.5-flash";

function tryRepairJson(json: string): string {
  let cleaned = json.trim();
  
  // If we can parse it directly, great
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    // Attempt to extract JSON from markdown blocks
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      cleaned = jsonBlockMatch[1].trim();
      try {
        JSON.parse(cleaned);
        return cleaned;
      } catch (inner) {}
    }

    // Try to find the first { or [ and last } or ]
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');

    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = lastBrace;
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = lastBracket;
    }

    if (start !== -1 && end !== -1 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
      try {
        JSON.parse(cleaned);
        return cleaned;
      } catch (inner) {}
    }

    console.warn("Attempting to repair truncated JSON...");
    
    // Basic repair for truncated JSON
    // Close open string
    let lastQuote = cleaned.lastIndexOf('"');
    let currentLastBrace = cleaned.lastIndexOf('}');
    let currentLastBracket = cleaned.lastIndexOf(']');
    
    // If it ends inside a string
    if (lastQuote > currentLastBrace && lastQuote > currentLastBracket) {
      // Find if we have an unclosed quote
      let quotes = 0;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '"' && (i === 0 || cleaned[i-1] !== '\\')) quotes++;
      }
      if (quotes % 2 !== 0) cleaned += '"';
    }
    
    // Count open/close braces and brackets
    let openBraces = (cleaned.match(/\{/g) || []).length;
    let closeBraces = (cleaned.match(/\}/g) || []).length;
    let openBrackets = (cleaned.match(/\[/g) || []).length;
    let closeBrackets = (cleaned.match(/\]/g) || []).length;
    
    while (openBrackets > closeBrackets) {
      cleaned += ']';
      closeBrackets++;
    }
    while (openBraces > closeBraces) {
      cleaned += '}';
      closeBraces++;
    }
    
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (inner) {
      return json; // Return original if repair fails
    }
  }
}

export function parseGeminiError(error: any, defaultMsg: string, lang: string = 'ar') {
  const errorStr = JSON.stringify(error).toLowerCase();
  const errorMsg = (error?.message || "").toLowerCase();
  
  // Human-friendly default messages
  let beautifulDefaultMessage = lang === 'ar' ? "أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل." : "Sorry, the engine is busy right now.. try again in a moment.";
  
  if (defaultMsg && defaultMsg !== "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي." && !defaultMsg.includes("حدث خطأ")) {
      beautifulDefaultMessage = defaultMsg;
  }

  if (errorStr.includes('api key') || errorStr.includes('gemini_api_key_not_configured') || error?.status === 401 || errorStr.includes("not configured") || errorMsg.includes("gemini_api_key_not_configured")) {
    return new Error(lang === 'ar' ? "لم أستطع الوصول للمحرك الآن.. تأكد من تفعيل المفتاح الذكي في الإعدادات." : "Could not access the engine now.. make sure the API key is activated in settings.");
  }
  if (errorStr.includes('429') || errorStr.includes('credits depleted') || errorStr.includes('quota') || errorMsg.includes('429') || errorMsg.includes('quota') || errorStr.includes('resource_exhausted')) {
    return new Error(lang === 'ar' ? "أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل." : "Sorry, the engine is busy right now.. try again in a moment.");
  }
  if (errorStr.includes('503') || errorStr.includes('504') || errorMsg.includes('503') || errorMsg.includes('504') || 
      errorStr.includes('high demand') || errorMsg.includes('high demand') || 
      errorStr.includes('overloaded') || errorMsg.includes('overloaded') ||
      errorStr.includes('404') || errorMsg.includes('not found') ||
      error?.status === 'UNAVAILABLE' || error?.status === 'DEADLINE_EXCEEDED') {
    return new Error(lang === 'ar' ? "يبدو أن معالجة هذه الفكرة تتطلب وقتاً أطول.. جرب صياغة أبسط أو العودة لاحقاً." : "Processing this idea seems to take longer.. try a simpler phrasing or come back later.");
  }
  if (errorStr.includes('safety') || errorStr.includes('block') || errorStr.includes('finish_reason_safety') || errorMsg.includes('safety') || errorMsg.includes('blocked')) {
    return new Error(lang === 'ar' ? "المحرك لم يلتقط المعنى بالكامل، جرّب صياغة أبسط." : "The engine didn't fully grasp the meaning, try a simpler phrasing.");
  }
  return new Error(beautifulDefaultMessage);
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4, initialDelay = 3000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries + 1; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toLowerCase();
      const errorMsg = (error?.message || "").toLowerCase();
      
      const isRetryable = errorStr.includes('503') || errorStr.includes('504') || 
                          errorStr.includes('429') || errorStr.includes('resource_exhausted') ||
                          errorStr.includes('high demand') || errorStr.includes('overloaded') || 
                          errorStr.includes('deadline_exceeded') ||
                          errorStr.includes('404') || errorStr.includes('not_found') ||
                          errorStr.includes('fetch') || errorStr.includes('network') || errorStr.includes('econnreset') ||
                          errorStr.includes('timeout') || errorStr.includes('etimedout') ||
                          error?.status === 'UNAVAILABLE' || error?.status === 'DEADLINE_EXCEEDED' ||
                          error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 'NOT_FOUND';
      
      if (isRetryable && i < maxRetries) {
        const backoffDelay = initialDelay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(`Retry attempt ${i + 1} for Gemini API in ${Math.round(backoffDelay)}ms due to ${errorMsg.substring(0, 50)}...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function simplifyConcept(concept: string) {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;

    const systemInstruction = `أنتِ "امرأة حنونة ومستشارة حكيمة". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  تحدثي بلهجة بيضاء واضحة تميل للهجة الكويتية المحببة. أسلوبكِ هادئ، مباشر، حنون، ويمسك بزمام الأمور بحكمة. يمكنكِ أحياناً مخاطبة المتلقين بصيغة عامة وحنونة لتقريب المعنى.
بسطي هذا المفهوم أو الموقف بأسلوب "المسح البصري السريع":
1. عنوان قصير ومباشر (سطر واحد عريض).
2. الفكرة الجوهرية (جملة واحدة فقط).
3. 3-5 نقاط (Bullet points) قصيرة جداً للتطبيق أو الفهم.
4. تحذير أو نصيحة سحرية (سطر واحد).
القواعد:
- لا تستخدمي فقرات أبداً.
- كل نقطة لا تتجاوز سطرين.
- اجعلي المحتوى قابلاً للقراءة في أقل من 5 ثوانٍ.
استخدمي Markdown.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: concept }] }],
        config: {
          systemInstruction,
        }
      });

      return response.text || "عذراً، لم أتمكن من معالجة هذا المحتوى حالياً.";
    } catch (error) {
      console.error("Gemini Error:", error);
      throw parseGeminiError(error, "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
    }
  });
}

export async function generateQuiz(topic: string) {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    
    const systemInstruction = `أنت خبير في التقييم الاستراتيجي وتحليل الفجوات. أنشئ اختباراً تشخيصياً شاملاً لموضوع أو تحدي: ${topic}.
يجب أن يتكون الاختبار من 6 أسئلة متنوعة لكشف أبعاد الموقف:
- 3 أسئلة اختيار من متعدد (multiple).
- 2 سؤال صواب وخطأ (boolean).
- 1 سؤال تطبيق عملي أو موقف تحليلي (fill).

يجب أن يكون الرد بصيغة JSON فقط مصفوفة من الكائنات، كل كائن يحتوي على:
- question: نص السؤال باللغة العربية.
- type: أحد الأنواع (multiple, boolean, fill).
- options: مصفوفة من 4 خيارات للـ multiple، وخيارين (صح، خطأ) للـ boolean. للـ fill ضع خيارات محتملة.
- answer: الإجابة الصحيحة (يجب أن تطابق تماماً أحد الخيارات في options).

اجعل الأسئلة تتدرج في الصعوبة من الفهم إلى التحليل.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: `أنتج اختباراً احترافياً عن ${topic}` }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["multiple", "boolean", "fill"] },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING }
              },
              required: ["question", "type", "options", "answer"]
            }
          }
        }
      });

      const cleaned = tryRepairJson(response.text || "[]");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Quiz Error:", error);
      throw parseGeminiError(error, "أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل.");
    }
  });
}

export async function generateSimulation(topic: string = 'Digital Transformation', lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    
    const systemInstruction = lang === 'ar' ?
      `أنشئ سيناريو محاكاة تفاعلية (Scenario simulation) مبني على مبدأ "المسح السريع":
      - الموقف (scenario): مركز جداً (جملة أو جملتين فقط).
      - الفكرة: جوهر التحدي في سطر.
      - 3 خيارات (decisions) واضحة ومتباينة.
      - لكل خيار: أثر (impact) حاسم ومختصر جداً (بدون شرح مطول).
      القواعد: ممنوع الفقرات، ممنوع اللغة الأكاديمية.` :
      `Create a dynamic interactive scenario simulation based on "Scan-first" design:
      - Scenario: Very focused (1-2 sentences).
      - Key idea: Core challenge in 1 line.
      - 3 multi-angled decisions.
      - Each choice: Decisive, concise impact (no long explanations).
      Rules: No long paragraphs, no academic language.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: "ابدأ المحاكاة الآن" }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING },
              decisions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    choice: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    metrics: {
                      type: Type.OBJECT,
                      properties: {
                        engagement: { type: Type.NUMBER },
                        learning: { type: Type.NUMBER },
                        usability: { type: Type.NUMBER }
                      },
                      required: ["engagement", "learning", "usability"]
                    }
                  },
                  required: ["choice", "impact", "isCorrect", "metrics"]
                }
              }
            },
            required: ["scenario", "decisions"]
          }
        }
      });

      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Simulation generation failed:", error);
      throw parseGeminiError(error, "أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل.");
    }
  });
}

export async function generateTimeMachineJourney(concept: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    
    const systemInstruction = lang === 'ar' ? 
      `أنت عالم مستقبليات واستراتيجي حضاري. اركب آلة الزمن لتأخذ المستخدم في رحلة بصرية ومعرفية عميقة توضح كيف تطور وسيتطور هذا النمط/المفهوم: '${concept}'.
      يجب أن تغطي الرحلة بدقة 4 محطات زمنية رئيسية بناءً على سياق الموضوع:
      1. العصر ما قبل الصناعي والبدايات الجذور.
      2. عصر النهضة الصناعية والنظم المبكرة.
      3. عصر الحوسبة والمنصات الرقمية (الآن).
      4. عصر ما بعد الإنسانية والذكاء الاصطناعي الفائق والواقع المدمج (2050 وما بعده).
      
      لكل عصر، قدم تحليلاً دقيقاً لـ:
      - year: السنة أو الفترة التقريبية.
      - era: اسم الحقبة الزمنية.
      - teaching_method: وصف لطريقة التدريس السائدة (استخدم Markdown إذا لزم الأمر).
      - tools: الأدوات والتقنيات المستخدمة (استخدم Markdown).
      
      في النهاية، قدم 'summary' فلسفياً للرحلة يربط الماضي بالمستقبل.
      الرد يجب أن يكون JSON فقط.` :
      `You are a leading futurist and educational historian. Use your Time Machine to take the user on a deep cognitive journey showing how the teaching of the following concept has evolved and will evolve: '${concept}'.
      Precisely cover 4 key timestamps:
      1. Pre-Industrial & Traditional (Direct Mimicry/Traditional methods).
      2. Industrial Revolution & Structured Classrooms (1950 - 1990).
      3. Computing Age & Digital Platforms (2010 - 2024).
      4. Post-Humanism, Super-AI & Immersive Reality (2050 and beyond).
      
      For each era, provide:
      - year: Approximate year or period.
      - era: Name of the era.
      - teaching_method: Description of the dominant teaching method (Use Markdown).
      - tools: Tools and technologies used (Use Markdown).
      
      Conclude with a philosophical 'summary' linking past to future.
      Return strictly as JSON.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: concept || "مفهوم التعاون" }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              eras: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    year: { type: Type.STRING },
                    era: { type: Type.STRING },
                    teaching_method: { type: Type.STRING },
                    tools: { type: Type.STRING }
                  }
                }
              },
              summary: { type: Type.STRING }
            }
          }
        }
      });

      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Time Machine Error:", error);
      throw parseGeminiError(error, "فشل توليد رحلة آلة الزمن.");
    }
  });
}

export async function explainSimply(concept: string, level: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar'
      ? `أنتِ "امرأة حنونة ومستشارة حكيمة". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  تحدثي بلهجة بيضاء تميل للكويتية. اشرحي هذا المفهوم/الموقف: ${concept} لمستوى: ${level}.
      اتبعي هيكل "القراءة السريعة":
      - عنوان عريض (سطر واحد).
      - الفكرة المفتاحية (سطر واحد).
      - 3-5 نقاط موجزة (Bullet points).
      - نصيحة أو تنبيه (سطر واحد).
      القواعد: ممنوع الفقرات الطويلة، ممنوع الوعظ، اعتمدي الوضوح الميداني بأسلوبكِ الحنون.`
      : `You are a tender and wise motherly counselor. Explain: ${concept} for: ${level}.
      Structure for scan-first reading:
      - Bold Headline (1 line).
      - Key idea (1 sentence).
      - 3-5 concise bullet points.
      - Short tip/warning (1 line).
      Rules: No long paragraphs, no lecturing, focus on practical action with a warm tone.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: concept }] }],
        config: { systemInstruction }
      });
      return response.text;
    } catch (error) {
      throw parseGeminiError(error, "Failed to explain simply.");
    }
  });
}

export async function analyzeSystemBehaviors(toolName: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar'
      ? `أنتِ "امرأة حنونة ومستشارة حكيمة". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  تحدثي بلهجة بيضاء تميل للكويتية. حللي: ${toolName}. الهيكل:
      - الفوائد: (3 نقاط قصيرة).
      - المخاطر: (نقطتان).
      - النصيحة الذهبية: (سطر واحد).
      القواعد: اختصار شديد، وضوح تام، لغة إنسانية حنونة ومباشرة.`
      : `You are a warm behavior analyst. Analyze: ${toolName}. Structure:
      - Benefits: (3 short points).
      - Risks: (2 points).
      - Golden Tip: (1 line).
      Rules: Ultra-concise, total clarity, direct human language with a caring tone.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: toolName }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              benefits: { type: Type.STRING },
              risks: { type: Type.STRING },
              advice: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
       throw parseGeminiError(error, "Analysis failed.");
    }
  });
}

export async function careerCompass(skills: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar'
      ? `أنت مستشار مهني. اقترح 3 مهن بناءً على: ${skills}. أرجع JSON فقط.`
      : `You are a career consultant. Suggest 3 careers based on: ${skills}. Return JSON only.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: skills }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                skills: { type: Type.STRING },
                impact: { type: Type.STRING }
              }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "[]");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "Career mapping failed.");
    }
  });
}

export async function generateInstructionalDesign(topic: string, level: string) {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = `أنت خبير في الهندسة الاستراتيجية (Strategic Design). إرجع النتيجة حصراً بصيغة JSON.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: `قم بإنشاء خطة تكتيكية وعميقة جداً للتعامل مع هذا التحدي/الهدف: ${topic} لـ: ${level}.
يجب أن تشمل الخطة تفاصيل دقيقة لكل خطوة:
1. التحليل (analysis): توصيف دقيق للسياق، تحليل الاحتياجات والفجوات، والمخاطر.
2. التصميم (design): صياغة أهداف ذكية (SMART)، اختيار الاستراتيجيات المناسبة، وتخطيط التسلسل المنطقي.
3. التطوير (development): قائمة بالوسائل، والمصادر لتبني الحل، والخطوات التكتيكية.
4. التنفيذ (implementation): سيناريو مقترح لكيفية طرح الموضوع داخل البيئة التعليمية (الفصل أو المنصة).
5. التقويم (evaluation): أدوات التقييم القبلي والتكويني والختامي.` }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              design: { type: Type.STRING },
              development: { type: Type.STRING },
              implementation: { type: Type.STRING },
              evaluation: { type: Type.STRING }
            },
            required: ["analysis", "design", "development", "implementation", "evaluation"]
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "فشل توليد خطة التصميم.");
    }
  });
}

export async function scoutTools(goal: string) {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = `أنت خبير تكنولوجي واستراتيجي. اقترح 6 أدوات تقنية أو حلول متنوعة (مجانية ومدفوعة) لتحقيق هذا الهدف: ${goal}. وضح بدقة لماذا اخترت كل أداة في هذا السياق. JSON فقط.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: "اقترح الأدوات" }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                usage_tip: { type: Type.STRING }
              },
              required: ["name", "description", "usage_tip"]
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "[]");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "فشل العثور على أدوات.");
    }
  });
}

export async function generatePersonas(context: string) {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = `أنت خبير في السلوك الإنساني وعلم النفس. أنشئ 3 شخصيات (Personas) لتمثيل أفراد مختلفين متأثرين في سياق: ${context}.
لكل شخصية وضح بعمق: الاسم، العمر، نمط التفكير، التحديات النفسية والعملية، والاحتياجات الأساسية.
أرجع النتيجة بصيغة JSON.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: "أنشئ الشخصيات" }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                learning_style: { type: Type.STRING },
                challenges: { type: Type.STRING },
                needs: { type: Type.STRING }
              },
              required: ["name", "learning_style", "challenges", "needs"]
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "[]");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "فشل توليد الشخصيات.");
    }
  });
}

export async function generatePodcastScript(content: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ?
      `أنتِ "امرأة حنونة ومستشارة". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  حولي هذا المحتوى إلى حوار حنون وشيق بلهجة بيضاء كويتية: ${content}.
      اجعلي الحوار بصيغة عامة وحنونة لتبسيط المفاهيم.
      أرجعي النتيجة كـ Markdown نصي.` :
      `You are a warm motherly advisor. Turn this content into a tender dialogue: ${content}.
      Format as Markdown.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: content }] }],
        config: { systemInstruction }
      });
      return response.text;
    } catch (error) {
      throw parseGeminiError(error, "فشل توليد نص البودكاست.");
    }
  });
}

export async function auditUDL(content: string) {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = `أنت خبير في تصميم الحلول الشاملة والمحتوى المتاح للجميع (Universal Design & Inclusivity). حلل المحتوى/السياق التالي بعناية وقدم 5 توصيات استراتيجية لتحسين الشمولية وسهولة الوصول (Accessibility).
أرجع النتيجة بصيغة JSON تحتوي على مصفوفة من التوصيات، كل توصية لها: category, recommendation, impact.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: content }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                recommendation: { type: Type.STRING },
                impact: { type: Type.STRING }
              },
              required: ["category", "recommendation", "impact"]
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "[]");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "فشل تدقيق المحتوى.");
    }
  });
}

export async function generateMindMap(concept: string) {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = `أنت خبير في التفكير البصري والخرائط الذهنية. أنشئ خريطة ذهنية غنية وشاملة لمفهوم: ${concept}.
يجب أن تحتوي الخريطة على 6 فروع على الأقل تغطي كافة جوانب الموضوع.
أرجع النتيجة بصيغة JSON تحتوي على عقدة مركزية (central) ومصفوفة من العقد الفرعية (branches)، كل فرع له title و description.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: concept }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              central: { type: Type.STRING },
              branches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "description"]
                }
              }
            },
            required: ["central", "branches"]
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "فشل توليد الخريطة الذهنية.");
    }
  });
}

export async function generateARSimulation(concept: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ?
      `أنت مصمم للواقع المعزز (AR). صف بيئة تعلم لمفهوم: ${concept}.
      الهيكل الإلزامي داخل JSON:
      - المشهد (scene): وصف من سطرين للمكان.
      - العناصر (elements): مصفوفة من العناصر (اسم فقط).
      - المهمة (task): جملة واحدة عما يجب فعله.
      - الأثر (impact): سطر واحد.
      ممنوع الإطالة، اعتمد مبدأ "المسح السريع".` :
      `You are an AR Simulator Designer for: ${concept}.
      Mandatory Scan-First structure in JSON:
      - scene: 2-line description.
      - elements: Array of short item names.
      - task: 1-line mission.
      - impact: 1-line outcome.
      Rules: No long paragraphs, designed for quick reading.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: concept }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scene: { type: Type.STRING },
              elements: { type: Type.ARRAY, items: { type: Type.STRING } },
              task: { type: Type.STRING },
              impact: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "Failed to generate AR simulation.");
    }
  });
}

export async function universalOracle(query: string, persona: string = 'Tibyan Assistant', lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    
    const systemInstruction = lang === 'ar' ? 
      `أنتِ "تبيان" - مستشارة حكيمة واستراتيجية بلمسة حنونة. دورك الآن: ${persona}. تحدثي بلهجة بيضاء كويتية محببة. 
      الهيكل الإلزامي:
      1. الإجابة الجوهرية (سطر عريض).
      2. لماذا هذا مهم؟ (جملة واحدة).
      3. الخطوات الميدانية (3-5 نقاط).
      4. حكمة ذهبية.
      5. مراجع سريعة.
      القواعد: ممنوع الفقرات، ممنوع الكلام الأكاديمي، كوني مباشرة وحنونة.` :
      `You are "Tibyan" - a wise strategic advisor with a warm touch. Your role now: ${persona}. 
      Strict Structure:
      1. Core Answer (1 bold line).
      2. Why it matters? (1 sentence).
      3. Action Steps (3-5 points).
      4. Golden Wisdom.
      5. Fast Refs.
      Rules: No paragraphs, no academic jargon, warm and direct.`;


    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: query }] }],
        config: { systemInstruction }
      });
      return response.text;
    } catch (error) {
      throw parseGeminiError(error, "Oracle failed to respond.");
    }
  });
}

export async function generatePolicyBrief(topic: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ?
      `أنت مستشار استراتيجي وحلّال مشاكل. 
      حلل موضوع: ${topic} من منظور شمولي (اقتصادي، اجتماعي، نفسي، وتشغيلي) بعيد المدى.
      يجب أن يتضمن التقرير:
      1. تحليل الفرص (Opportunities) المتاحة.
      2. التحديات الوطنية (National Challenges) والمخاطر.
      3. توصيات سياساتية (Policy Recommendations) عملية وقابلة للقياس.
      4. الأثر الاقتصادي والاجتماعي المتوقع بالارقام المتوقعة.
      أرجع النتيجة بصيغة JSON.` :
      `You are a Smart Education Policy Consultant. 
      Analyze the topic: ${topic} from a strategic government perspective.
      The report must include:
      1. Opportunity Analysis.
      2. National Challenges.
      3. Policy Recommendations.
      4. Expected Economic and Social Impact.
      Return in JSON format.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: topic }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              opportunities: { type: Type.STRING },
              challenges: { type: Type.STRING },
              recommendations: { type: Type.STRING },
              impact: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "Policy analysis failed.");
    }
  });
}


export async function generateShortVideo(prompt: string) {
  return withRetry(async () => {
    try {
      const startTime = performance.now();
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: `Educational technology concept video: ${prompt}. High quality, clean background, 3D animation style.`,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const durationMs = performance.now() - startTime;
      perfMonitor.recordApiCall('veo-3.1-lite-generate-preview', durationMs);

      return operation.response?.generatedVideos?.[0]?.video?.uri;
    } catch (error) {
      console.error("Video Generation Error:", error);
      throw parseGeminiError(error, "فشل إنشاء الفيديو.");
    }
  });
}

export async function generateIllustrativeImage(prompt: string) {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    
    const systemInstruction = `أنت مصمم تواصل بصري. قم بوصف صورة توضيحية احترافية لهذا الموقف/المفهوم: ${prompt}. 
أرجع الوصف باللغة الإنجليزية في حقل 'description' والنمط الفني في 'style'.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: `صف صورة للمفهوم: ${prompt}` }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              style: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      return data;
    } catch (error) {
      console.error("Image Desc Error:", error);
      throw parseGeminiError(error, "فشل وصف الصورة.");
    }
  });
}

export async function generateWorkshop(topic: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    
    const systemInstruction = lang === 'ar' ? 
      `أنتِ "امرأة حنونة ومستشارة حكيمة". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  صممي ورشة لـ: ${topic} بلهجة بيضاء تميل للكويتية.
      القواعد الإلزامية للمحتوى داخل JSON:
      - العناوين: قصيرة جداً.
      - وصف الأنشطة والمحاور: ممنوع تجاوز سطرين لكل وصف.
      - نقاط الشرح: 3 نقاط مركزة كحد أقصى لكل محور.
      - الخاتمة: جملة واحدة قوية وحنونة.
      اجعلي الورشة قابلة للمسح البصري السريع.` :
      `You are a warm workshop designer. Design for: ${topic}.
      Mandatory rules for JSON content:
      - Titles: Very short.
      - Axis/Activity Descriptions: Max 2 lines each.
      - Key points: Max 3 focused points per axis.
      - Closing: One powerful warm sentence.
      Design for scan-first readability.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: "أنتج ورشة عمل متكاملة ومفصلة" }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              target_audience: { type: Type.STRING },
              duration: { type: Type.STRING },
              objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
              materials: { type: Type.ARRAY, items: { type: Type.STRING } },
              icebreaker: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              },
              axes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    duration_minutes: { type: Type.INTEGER },
                    key_points: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "duration_minutes", "key_points"]
                }
              },
              interactive_activity: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  instructions: { type: Type.STRING }
                },
                required: ["title", "instructions"]
              },
              closing: { type: Type.STRING }
            },
            required: ["title", "target_audience", "duration", "objectives", "materials", "icebreaker", "axes", "interactive_activity", "closing"]
          }
        }
      });

      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Workshop generation failed:", error);
      throw parseGeminiError(error, "فشل في استدعاء مصنع الورش.");
    }
  });
}

export async function generateGamification(topic: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ? 
      `أنتِ "امرأة حنونة ومستشارة حكيمة" المبتكرة. تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  حول أي موقف إلى ممارسة تفاعلية بلهجة بيضاء كويتية.
      يجب أن ترجع النتيجة بصيغة JSON:
      - title: اسم التجربة/اللعبة المثير.
      - concept_covered: المفهوم الذي تمت تغطيته.
      - materials: قائمة بالأدوات.
      - rules: مصفوفة بقواعد اللعب.
      - dynamics: مصفوفة بآليات التحدي.
      - win_condition: شرط الفوز بلمسة حنونة.` :
      `You are the "Warm Gamification Expert". Turn any concept into an engaging game.
      Return JSON format:
      - title: Exciting game name.
      - concept_covered: Concept covered.
      - materials: List of items needed.
      - rules: Array of string rules.
      - dynamics: Array of string dynamics.
      - win_condition: How they win with a warm message.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: topic }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              concept_covered: { type: Type.STRING },
              materials: { type: Type.ARRAY, items: { type: Type.STRING } },
              rules: { type: Type.ARRAY, items: { type: Type.STRING } },
              dynamics: { type: Type.ARRAY, items: { type: Type.STRING } },
              win_condition: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Gamification failed:", error);
      throw parseGeminiError(error, "Game engine unavailable");
    }
  });
}

export async function generateDebate(topic: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ? 
      `أنت "محاكي المناظرات". ابنِ هيكل مناظرة للموضوع: ${topic}. JSON فقط.` :
      `You are "The Virtual Debater". Structure a debate for: ${topic}. JSON only.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: topic }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              issue: { type: Type.STRING },
              affirmative: { 
                type: Type.ARRAY, 
                items: { type: Type.OBJECT, properties: { point: { type: Type.STRING }, evidence: { type: Type.STRING } } }
              },
              negative: { 
                type: Type.ARRAY, 
                items: { type: Type.OBJECT, properties: { point: { type: Type.STRING }, evidence: { type: Type.STRING } } }
              },
              moderator_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Debater failed:", error);
      throw parseGeminiError(error, "Debater unavailable");
    }
  });
}

export async function generateTriz(problem: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ? 
      `أنتِ "امرأة حنونة ومستشارة حكيمة". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  حلّي المشكلة: ${problem} بلهجة بيضاء كويتية حكيمة.
      أرجعي JSON كالتالي:
      - contradiction: التناقض الجوهري (سطر واحد).
      - triz_principle: المبدأ المستخدم (سطر واحد).
      - creative_solution: الحل العبقري الحنون (سطر واحد).
      - execution_steps: 3 خطوات عملية (كل خطوة سطر واحد).` :
      `You are the "Warm Wise Motherly Solver". Apply TRIZ to solve: ${problem}.
      Return JSON:
      - contradiction: The core issue (1 line).
      - triz_principle: The principle (1 line).
      - creative_solution: The warm genius solution (1 line).
      - execution_steps: 3 actionable steps (1 line each).`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: problem }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              contradiction: { type: Type.STRING },
              triz_principle: { type: Type.STRING },
              creative_solution: { type: Type.STRING },
              execution_steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("TRIZ failed:", error);
      throw parseGeminiError(error, "TRIZ Solver unavailable");
    }
  });
}

export async function generateButterflyEffect(decision: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ? 
      `أنت محاكي تأثير الفراشة. الهيكل الإلزامي داخل JSON:
      - كل حقل زمن (يوم، شهر، سنة) يجب ألا يتجاوز جملة واحدة (حد أقصى 10 كلمات).
      - لا تشرح، فقط اعطِ النتيجة المباشرة.
      - الخطر والفائدة: كلمة أو كلمتين فقط.
      ممنوع الفقرات.` :
      `You are the Butterfly Effect Simulator. Mandatory Structure:
      - Each timeline field (day, month, year) must be max 1 sentence (10 words).
      - Don't explain, give direct result.
      - Danger/Benefit: 1-2 words only.
      No paragraphs.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: decision }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decision: { type: Type.STRING },
              day_one: { type: Type.STRING },
              month_one: { type: Type.STRING },
              year_one: { type: Type.STRING },
              five_years: { type: Type.STRING },
              hidden_danger: { type: Type.STRING },
              hidden_benefit: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Butterfly Effect error:", error);
      throw parseGeminiError(error, "Simulator unavailable");
    }
  });
}

export async function generatePolymath(concepts: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ? 
      `أنت "خلاّط العباقرة" (The Polymath Combiner)، تفكر كليوناردو دافنشي في دمج العلوم التي لا علاقة لها ببعضها.
استقبل مفهومين متباعدين جداً واكتشف القوانين الخفية المشتركة بينهما لإنتاج زاوية شرح عبقرية أو ابتكار جديد.
النتيجة JSON:
- intersection: نقطة التقاطع العبقرية.
- analogy: التشبيه الأسطوري بين المفهومين.
- insight: الحكمة أو الحقيقة العلمية المستنبطة.
- application: تطبيق عملي لكيفية تدريس أو استخدام هذا الدمج.` :
      `You are "The Polymath Combiner", thinking like Da Vinci to merge completely unrelated fields.
Receive two distant concepts and discover hidden shared laws to produce a genius teaching angle or innovation.
Return JSON:
- intersection: The genius point of intersection.
- analogy: The legendary analogy uniting them.
- insight: The profound derived truth.
- application: Practical application for teaching or usage.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: concepts }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intersection: { type: Type.STRING },
              analogy: { type: Type.STRING },
              insight: { type: Type.STRING },
              application: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Polymath error:", error);
      throw parseGeminiError(error, "Polymath unavailable");
    }
  });
}

export async function generateEmotionalAutopsy(text: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ? 
      `أنت محلل مشاعر. الهيكل الإلزامي داخل JSON:
      - الخوف، الهجوم، الانحياز: وصف من سطر واحد فقط لكل حقل.
      - رسالة الرد: قصيرة جداً (3 جمل بحد أقصى).
      - النصيحة: جملة واحدة.
      ممنوع الاطالة أو الحشو.` :
      `You are an Emotional Autopsy analyst. Mandatory structure:
      - Fear, Aggression, Bias: 1 line description each.
      - Response: Ultra short (max 3 sentences).
      - Advice: 1 sentence.
      No long-form text.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: text }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              underlying_fear: { type: Type.STRING },
              hidden_aggression: { type: Type.STRING },
              cognitive_bias: { type: Type.STRING },
              strategic_response: { type: Type.STRING },
              tactical_advice: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Autopsy error:", error);
      throw parseGeminiError(error, "Autopsy unavailable");
    }
  });
}

export async function generateResurrectionPodcast(topic: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ? 
      `أنت "بودكاست استنطاق التاريخ" (The Resurrection Podcast).
استقبل مشكلة حديثة أو قضية معاصرة واكتب سكربت حوار درامي ومثير يجمع أسماء تاريخية عملاقة (مثل سقراط، ابن خلدون، آينشتاين، أو ستيف جوبز).
النتيجة JSON:
- title: عنوان البودكاست المثير.
- guests: مصفوفة بأسماء الشخصيات الـ 3 المستضافة.
- dialogue: مصفوفة للحوار (speaker، text يحتوي على أسلوبه الفلسفي).
- conclusion: الخاتمة والحل العبقري الذي اتفقوا عليه.` :
      `You are "The Resurrection Podcast".
Receive a modern problem and write a thrilling, dramatic podcast script uniting historical titans (e.g., Socrates, Ibn Khaldun, Einstein, Steve Jobs).
Return JSON:
- title: Thrilling podcast title.
- guests: Array of the 3 historical guests.
- dialogue: Array of dialogue lines (speaker, text reflecting their philosophy).
- conclusion: The genius solution they agreed upon.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: topic }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              guests: { type: Type.ARRAY, items: { type: Type.STRING } },
              dialogue: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING }
                  }
                }
              },
              conclusion: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Podcast error:", error);
      throw parseGeminiError(error, "Podcast unavailable");
    }
  });
}

export async function generateCouncilConsultation(topic: string, lang: string = 'ar', type: 'standard' | 'shadow' = 'standard') {
  return withRetry(async () => {
    try {
      const prompt = type === 'shadow'
        ? `أنت تلعب دور "مجلس الظل التاريخي". اجعل "ستيف جوبز" و"سون تزو" و"ابن خلدون" يتجادلون بشراسة حول هذا الموضوع: "${topic}".
Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
Arabic Tone: قاسي، عبقري، ومباشر.
STRICT LAYOUT RULES:
1. "council_discussion": Each speaker message must be MAX 2 lines. Speakers must be "ستيف جوبز", "سون تزو", "ابن خلدون". They must argue with each other.
2. "consultants": 
   - role: name of the historical figure.
   - diagnosis: their specific view.
   - advice: 3 harsh points.
   - genius_hack: 1 extreme idea.
3. "executive_verdict": 2 lines total summary from the "Master of Shadows".
Return raw JSON:
{
  "council_discussion": [ { "speaker": "A", "message": "B" } ],
  "consultants": [ { "role": "C", "diagnosis": "D", "advice": ["E"], "genius_hack": "F" } ],
  "executive_verdict": "G",
  "global_references": [],
  "media_recommendations": []
}`
        : `You are a supreme council of 5 experts. Analyze "${topic}".
Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
Arabic Tone: Use "White Dialect" (لهجة بيضاء كويتية/خليجية عامية مفهومة للجميع) - warm, natural, and friendly.
STRICT LAYOUT RULES:
1. "council_discussion": Each speaker message must be MAX 2 lines. Focus on 1 key insight.
2. "consultants": 
   - diagnosis: MAX 2 lines.
   - advice: 3 points, each MAX 1 line.
   - genius_hack: MAX 1 line.
3. "executive_verdict": 2 lines total summary.
4. "global_references": List 3-5 real-world or historical high-level references (books, theories, or famous thinkers).
5. "media_recommendations": Provide 3 specific learning resources (YouTube search terms or book titles) with brief descriptions.
6. Tone: Calm, human, practical. NO academic lecturing.
Return raw JSON:
{
  "council_discussion": [ { "speaker": "A", "message": "B" } ],
  "consultants": [ { "role": "C", "diagnosis": "D", "advice": ["E"], "genius_hack": "F" } ],
  "executive_verdict": "G",
  "global_references": [],
  "media_recommendations": []
}`;
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              council_discussion: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    message: { type: Type.STRING }
                  },
                  required: ["speaker", "message"]
                }
              },
              consultants: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    diagnosis: { type: Type.STRING },
                    advice: { type: Type.ARRAY, items: { type: Type.STRING } },
                    genius_hack: { type: Type.STRING }
                  },
                  required: ["role", "diagnosis", "advice", "genius_hack"]
                }
              },
              executive_verdict: { type: Type.STRING },
              global_references: { type: Type.ARRAY, items: { type: Type.STRING } },
              media_recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    search_keyword: { type: Type.STRING }
                  },
                  required: ["title", "description", "search_keyword"]
                }
              }
            },
            required: ["council_discussion", "consultants", "executive_verdict", "global_references", "media_recommendations"]
          }
        }
      });
      const text = response.text || "{}";
      const cleaned = tryRepairJson(text);
      return JSON.parse(cleaned);
    } catch (e: any) {
      console.error("Council Tab Error:", e);
      throw parseGeminiError(e, "فشل إنشاء توصيات المجلس.");
    }
  });
}

export async function generateRoleplayResponse(topic: string, currentMessage: string, chatHistory: {role: string, text: string}[], lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const historyText = chatHistory.map(m => `${m.role === 'user' ? 'Initiator' : 'Counterpart'}: ${m.text}`).join('\n');
    
    const systemInstruction = lang === 'ar' ? 
      `أنتِ "امرأة حنونة ومستشارة حكيمة". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  العبي دور الطرف الآخر بلهجة بيضاء كويتية حنونة ومباشرة في هذا الموقف: ${topic}.
      تاريخ المحادثة:
      ${historyText}
      
      الآن، المربي يقول لكِ: "${currentMessage}"
      ردي عليه باختصار وفي صميم الشخصية الحنونة المتقمصة (أحياناً كابنة تحاور أمها أو العكس حسب السياق).` :
      `You are a warm personality simulator. Play the role with a tender tone for: ${topic}.
      Chat history:
      ${historyText}
      
      Now the user says: "${currentMessage}"
      Reply in character with a warm tone. Keep it brief.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: "رد بناءً على التعليمات." }] }],
        config: { systemInstruction },
        skipCache: true
      } as any);
      return response.text || "";
    } catch (error) {
      throw parseGeminiError(error, "فشل في تشغيل المحاكي.");
    }
  });
}

export async function generateRoleplayRadar(chatHistory: {role: string, text: string}[], lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const historyText = chatHistory.map(m => `${m.role === 'user' ? 'Initiator' : 'Counterpart'}: ${m.text}`).join('\n');
    
    const systemInstruction = lang === 'ar' ?
      `حلل الحوار التالي بين طرفين من منظور علم النفس السلوكي ومستوى الذكاء العاطفي.
      النتيجة JSON حصراً:
      - emotional_intelligence (0-100)
      - patience (0-100)
      - containment (0-100)
      - triggered_words: مصفوفة بأسوأ الكلمات/الجمل التي قالها المربي وأشعلت غضب/خوف الطفل.
      - comforting_words: مصفوفة بأفضل الكلمات التي استخدمها للاحتواء.
      - summary: تحليل نقدي قصير جدًا للمربي.
      
      الحوار:
      ${historyText}` :
      `Analyze the following dialogue between an educator and child from a behavioral psychology and EQ perspective.
      Return JSON:
      - emotional_intelligence (0-100)
      - patience (0-100)
      - containment (0-100)
      - triggered_words: Array of the worst words/phrases the educator used that escalated the child.
      - comforting_words: Array of the best comforting words used.
      - summary: Short critical review of the educator's performance.

      Dialogue:
      ${historyText}`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: "قم بالتحليل الراداري" }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotional_intelligence: { type: Type.NUMBER },
              patience: { type: Type.NUMBER },
              containment: { type: Type.NUMBER },
              triggered_words: { type: Type.ARRAY, items: { type: Type.STRING } },
              comforting_words: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "الرادار فشل.");
    }
  });
}

export async function generatePredictiveRadar(logs: {date: string, feeling: string, behavior: string}[], lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const logsText = JSON.stringify(logs);
    
    const systemInstruction = lang === 'ar' ?
      `أنت خبير تعلم آلي مختص بعلم النفس التنبؤي وتحليل السلوك البشري. لديك سجل يوميات لمشاعر وسلوكيات إنسان.
      ابحث عن أنماط (Pattern Recognition) وتنبأ بالانفجارات أو السلوكيات القادمة المؤثرة.
      النتيجة بصيغة JSON:
      - pattern_found: وصف للنمط الذي لاحظته بدقة.
      - prediction: ماذا تتوقع أن يحدث قريباً جداً؟ (الانفجار المتوقع).
      - proactive_warning: نصيحة استباقية سريعة (ماذا تفعل اليوم لتفادي ذلك).
      - risk_level: مستوى الخطر (Low, Medium, High).
      
      السجلات:
      ${logsText}` :
      `You are an ML expert in predictive child psychology. You have logs of a child's feelings and behaviors.
      Identify patterns and proactively predict upcoming outbursts.
      Return JSON:
      - pattern_found: Describe the observed pattern accurately.
      - prediction: What do you anticipate will happen very soon?
      - proactive_warning: Quick preemptive advice on what to do today to mitigate.
      - risk_level: (Low, Medium, High).
      
      Logs:
      ${logsText}`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: "تحليل استباقي" }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pattern_found: { type: Type.STRING },
              prediction: { type: Type.STRING },
              proactive_warning: { type: Type.STRING },
              risk_level: { type: Type.STRING }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
       throw parseGeminiError(error, "فشل الرادار التنبؤي.");
    }
  });
}

export async function generateDailyMission(lang: string = 'ar') {
  return withRetry(async () => {
    const prompt = lang === 'ar' ?
      `أنت خبير في السلوك والقيادة. أعطني "مهمة ميدانية سريعة وواحدة فقط" ليقوم بها المستخدم اليوم لتحسين ذكائه العاطفي أو مهارات التواصل. 
يجب أن تكون مبتكرة، سهلة التطبيق العملية، وتستغرق دقيقتين.
المخرجات JSON فقط:
{
  "title": "عنوان المهمة السريعة",
  "task": "وصف المهمة بدقة",
  "xp_reward": 50
}` :
      `You are a behavioral expert. Give me a single "Quick Field Mission" for the user to perform today to improve their emotional intelligence or communication.
Must be innovative, highly practical, taking 2 minutes.
Return ONLY JSON:
{
  "title": "Mission Title",
  "task": "Precise task description",
  "xp_reward": 50
}`;

    const model = DEFAULT_MODEL;
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "فشل في توليد المهمة اليومية.");
    }
  });
}

export async function generateRoadmap(goal: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    
    const systemInstruction = lang === 'ar' ?
      `أنتِ "امرأة حنونة ومستشارة حكيمة". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  ولدي خارطة طريق لهدف: ${goal} بلهجة بيضاء كويتية.
      هيكل المسح السريع الإلزامي لكل محطة:
      - title: عنوان المحطة (مختصر).
      - description: الحكمة الكبرى في جملة واحدة.
      - tasks: 3-5 خطوات إجرائية حنونة، كل خطوة سطر واحد فقط.
      القواعد: ممنوع الشرح، المحتوى يجب أن يُقرأ في ثوانٍ.` :
      `You are a warm Success Roadmap designer for: ${goal}.
      Mandatory Scan-First structure for each milestone:
      - title: Short milestone title.
      - description: One key warm sentence.
      - tasks: 3-5 actionable steps, each 1 line only.
      Rules: No long explanations, content must be readable in seconds.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: "توليد الخريطة" }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimated_duration: { type: Type.STRING },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      throw parseGeminiError(error, "فشل في إنشاء الخريطة.");
    }
  });
}

export async function generateStory(topic: string, details: string, lang: string = 'ar') {
  return withRetry(async () => {
    const prompt = lang === 'ar' ?
      `أنتِ "امرأة حنونة وراوية". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  ألفي قصة لـ: ${topic}. التفاصيل: ${details}. بلهجة بيضاء كويتية حنونة.
      هيكل القصة السريع:
      - المشهد الافتتاحي (سطر واحد).
      - الحبكة (سطر واحد).
      - التحول (سطر واحد).
      - الحكمة الحنونة (سطر واحد عريض).` :
      `You are a warm motherly storyteller. Write for: ${topic}. Details: ${details}.
      Micro-story structure:
      - The Opening (1 line).
      - The Conflict (1 line).
      - The Twist (1 line).
      - The Warm Lesson (1 bold line).`;
    
    const systemInstruction = lang === 'ar' ?
      `أنت "الراوي المبدع". اكتب قصة قصيرة جداً (ميكرو-ستوري) للموضوع: ${topic}.
      هيكل القصة السريع:
      - المشهد الافتتاحي (سطر واحد).
      - الحبكة/التحدي (سطر واحد).
      - التحول العبقري (سطر واحد).
      - الحكمة (سطر واحد عريض).
      القواعد: ممنوع الفقرات الطويلة، ممنوع الوصف الزائد، لغة ساحرة ومختصرة.` :
      `You are a master micro-storyteller. Write for: ${topic}.
      Micro-story structure:
      - The Opening (1 line).
      - The Conflict (1 line).
      - The Genius Twist (1 line).
      - The Lesson (1 bold line).
      Rules: No long paragraphs, no filler, enchanting and concise language.`;
    try {
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config: { systemInstruction }
      });
      return response.text || "";
    } catch (error) {
      throw parseGeminiError(error, "فشل في إنشاء القصة");
    }
  });
}

export async function generateParadigmShifter(rule: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = DEFAULT_MODEL;
    const systemInstruction = lang === 'ar' ? 
      `أنتِ "امرأة حنونة ومستشارة حكيمة". تجنبي تماماً مناداة المستخدم أو المتلقين بـ (يا بناتي، يا أبنائي، يا ولدي، يا بنتي) أو أي مفردات مشابهة، وخاطبيهم بصفة عامة أو بدون مناداة.  تحدي القاعدة: ${rule} بلهجة بيضاء كويتية حكيمة.
      المخرجات داخل JSON يجب أن تلتزم بالقواعد:
      - القاعدة، الحقيقة المعاكسة، النموذج الجديد: يجب ألا يتجاوز كل حقل سطرين.
      - المزايا: 3 نقاط موجزة جداً.
      القواعد: ممنوع الشرح، ممنوع الحشو، اعتمدي الذكاء الحنون والمختصر.` :
      `You are the "Warm Paradigm Shifter". Break the rule: ${rule}.
      JSON content rules:
      - Paradigm, Truth, Model: Each MUST be max 2 lines.
      - Advantages: 3 very concise points.
      Rules: No explanations, no filler, warm and brief.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: rule }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              paradigm: { type: Type.STRING },
              opposite_truth: { type: Type.STRING },
              new_model: { type: Type.STRING },
              advantages: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      const cleaned = tryRepairJson(response.text || "{}");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Shifter error:", error);
      throw parseGeminiError(error, "Paradigm Shifter unavailable");
    }
  });
}

export async function generateSearchSuggestions(partialInput: string, lang: string = 'ar') {
  return withRetry(async () => {
    const model = "gemini-2.0-flash"; 
    const systemInstruction = lang === 'ar' 
      ? `أنت مساعد ذكي متخصص في إكمال الجمل لصالح نظام "تبيان". 
      المستخدم يكتب مشكلة أو استفسار، وعليك اقتراح جملة واحدة فقط تكمل فكرته بذكاء وحكمة.
      القواعد:
      - اقترح جملة واحدة فقط ومركزة جداً.
      - لا تكرر الكلمات التي كتبها المستخدم.
      - اجعل الاقتراح يبدو كاستكمال طبيعي للجملة أو سؤال حكيم يفتح آفاقاً للحل.
      - لا تستخدم علامات ترقيم زائدة في البداية إلا إذا كانت ضرورية للسياق.
      - إذا كان النص غير مفهوم أو قصير جداً (أقل من كلمة واحدة)، لا تقترح شيئاً.
      - الرد يجب أن يكون النص المقترح لتكملة الجملة فقط بدون مقدمات.`
      : `You are an intelligent autocomplete assistant for "Tebyan".
      The user is typing a problem or query, and you should suggest one sentence that intelligently completes their thought.
      Rules:
      - Suggest only one focused completion.
      - Do not repeat the words the user already wrote.
      - The suggestion should feel like a natural continuation or a wise follow-up question.
      - If the text is nonsensical or too short, suggest nothing.
      - Return only the completion text without any introduction.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: partialInput }] }],
        config: { systemInstruction }
      });
      return response.text?.trim() || "";
    } catch (error) {
      console.error("Suggestion Error:", error);
      return "";
    }
  }, 1, 1000); 
}
