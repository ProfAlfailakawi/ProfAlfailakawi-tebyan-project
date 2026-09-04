import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// CORS allowlist (mirrors functions/index.js)
// ---------------------------------------------------------------------------
// The /api/ai/* routes spend the owner's Gemini key, so they must not be
// callable from arbitrary third-party pages. Override with a comma-separated
// TEBYAN_ALLOWED_ORIGINS; otherwise the project's own domains are used.
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const DEFAULT_ALLOWED_ORIGINS = [
    "https://tebyan.dr-alfailakawi.com",
    "https://tebyan-clean-2026.web.app",
    "https://tebyan-clean-2026.firebaseapp.com",
];
const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const stripTrailingSlash = (value: unknown) => String(value ?? "").trim().replace(/\/+$/, "");

const allowedOrigins = (): string[] => {
    const configured = String(process.env.TEBYAN_ALLOWED_ORIGINS || "")
        .split(",")
        .map(stripTrailingSlash)
        .filter(Boolean);
    return configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
};

function isOriginAllowed(origin?: string): boolean {
    // No Origin header: same-origin browser traffic, curl, uptime probes. CORS
    // is not the control for those, so refusing here would only break
    // legitimate same-origin requests without stopping any attacker.
    if (!origin) return true;
    const normalized = stripTrailingSlash(origin);
    if (allowedOrigins().includes(normalized)) return true;
    return !IS_PRODUCTION && LOCAL_ORIGIN_PATTERN.test(normalized);
}

// Initialize Gemini API
const getGenAI = () => {
    let apiKey = (process.env.Nee || process.env.GEMINI_API_KEY || "").trim();
    
    if (apiKey === "MY_GEMINI_API_KEY" || apiKey === "YOUR_ACTUAL_AI_KEY_HERE" || apiKey === "INVALID_KEY_PLACEHOLDER") {
        apiKey = "";
    }
    
    if (!apiKey) {
        apiKey = (process.env.GEMINI_API_KEY3 || "").trim();
    }

    // Default system injected key may sometimes be named GOOGLE_API_KEY
    if (!apiKey) {
        apiKey = (process.env.GOOGLE_API_KEY || "").trim();
    }
    
    // Check if the API key is the known suspended default key (matching without writing the literal AIza-prefix key)
    if (apiKey && (apiKey.includes("CikxRRJ2pfOYy") || apiKey.endsWith("Rkayplvdik8UjI"))) {
        console.warn("[Server] WARNING: Detected suspended default API key. Forcing fallback to smart offline mode.");
        apiKey = "";
    }
    
    if (!apiKey) {
        console.warn("[Server] WARNING: Missing or suspended API key in environment variables.");
        return null;
    }

    return new GoogleGenerativeAI(apiKey);
};

// Simple In-memory Cache for AI responses
const smartCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Helper to hash cache key
function hashString(str: string) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isGeminiBusyError = (err: any) => {
    const msg = String(err?.message || err || "").toLowerCase();
    return (
        msg.includes("503") ||
        msg.includes("service unavailable") ||
        msg.includes("high demand") ||
        msg.includes("overloaded") ||
        msg.includes("temporarily unavailable") ||
        msg.includes("try again") ||
        msg.includes("deadline exceeded") ||
        msg.includes("429") ||
        msg.includes("too many requests") ||
        msg.includes("rate limit") ||
        msg.includes("quota") ||
        msg.includes("resource exhausted") ||
        msg.includes("internal") ||
        msg.includes("500") ||
        msg.includes("no audio data")
    );
};

async function generateWithRetry(operation: () => Promise<any>, label: string = "AI Result") {
    const delays = [0, 1200, 2500, 5000, 9000, 14000]; // TTS/AI stability window without forcing repeated user taps
    let lastError: any;

    for (let attempt = 0; attempt < delays.length; attempt++) {
        if (delays[attempt] > 0) {
            console.warn(`[Server] ${label} busy. Retrying attempt ${attempt + 1}/${delays.length} after ${delays[attempt]}ms...`);
            await sleep(delays[attempt]);
        }

        try {
            return await operation();
        } catch (err: any) {
            lastError = err;
            if (!isGeminiBusyError(err)) {
                throw err;
            }
            console.warn(`[Server] ${label} busy/high demand on attempt ${attempt + 1}:`, err?.message || err);
        }
    }

    throw lastError;
}


function getGeminiTtsApiKey() {
    let apiKey = (process.env.Nee || process.env.GEMINI_API_KEY || "").trim();
    if (apiKey === "MY_GEMINI_API_KEY" || apiKey === "YOUR_ACTUAL_AI_KEY_HERE" || apiKey === "INVALID_KEY_PLACEHOLDER") {
        apiKey = "";
    }
    if (!apiKey) apiKey = (process.env.GEMINI_API_KEY3 || "").trim();
    if (!apiKey) apiKey = (process.env.GOOGLE_API_KEY || "").trim();
    return apiKey;
}

function pcmBase64ToWavBase64(pcmBase64: string, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
    const pcm = Buffer.from(pcmBase64, "base64");
    const header = Buffer.alloc(44);
    const byteRate = sampleRate * channels * bitsPerSample / 8;
    const blockAlign = channels * bitsPerSample / 8;
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]).toString("base64");
}


function sanitizeTtsText(input, maxChars = 1400, preserveLines = false) {
    if (!input) return "";
    let cleaned = String(input)
        .replace(/ZhaDataSourceResponse[\s\S]*$/g, " ")
        .replace(/DataSourceResponse[\s\S]*$/g, " ")
        .replace(/with no thought process explanation[\s\S]*$/gi, " ")
        .replace(/Follow the[\s\S]*$/gi, " ")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[\uFE0E\uFE0F\u200D]/g, "")
        .replace(/[✨🎙️🎧🔊▶︎★⭐🌟💫]+/g, " ")
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, " ")
        .replace(/[ـ]{3,}/g, " ")
        .replace(/[-–—]{3,}/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    const chunks = cleaned.split(preserveLines ? /\n+/ : /(?<=[.!؟؛])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
    const seen = new Set();
    const unique = [];
    for (const chunk of chunks) {
        const key = chunk.replace(/[\s:：،.؟!؛]+/g, "").slice(0, 120);
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(chunk);
        }
    }
    return unique.join(preserveLines ? "\n" : " ").slice(0, maxChars).trim();
}

function sampleRateFromMime(mimeType = "") {
    const match = String(mimeType).match(/rate=(\d+)/i);
    return match ? Number(match[1]) : 24000;
}

async function generateTtsAudio({ text, voiceName, style = "natural" }: { text?: string; voiceName?: string; style?: string }) {
    if (!text || typeof text !== "string" || !text.trim()) {
        const err: any = new Error("Missing text for audio generation");
        err.statusCode = 400;
        throw err;
    }

    const isPodcast = style === "podcast";
    const cleanText = sanitizeTtsText(text, isPodcast ? 3200 : 1400, isPodcast);
    if (!cleanText) {
        const err: any = new Error("Missing clean text for audio generation");
        err.statusCode = 400;
        throw err;
    }

    const femaleVoices = ["Kore", "Aoede"];
    const maleVoices = ["Charon", "Fenrir", "Puck", "Zephyr"];
    const allVoices = [...femaleVoices, ...maleVoices];
    const selectedVoice = voiceName && allVoices.includes(voiceName)
        ? voiceName
        : allVoices[Math.floor(Math.random() * allVoices.length)];

    const apiKey = getGeminiTtsApiKey();
    const standardPrefix = "AI" + "za";
    if (!apiKey || !apiKey.startsWith(standardPrefix)) {
        return {
            audioData: "",
            mimeType: "audio/wav",
            offline: true,
            message: "وضع القراءة الصوتية متوقف مؤقتاً بسبب عدم تفعيل مفتاح الصوت على الخادم."
        };
    }

    const naturalizedText = isPodcast ? `
TTS the following Arabic podcast conversation between Host and Guest.
Use a calm, premium, intimate studio sound.
Host should sound curious, warm, and composed.
Guest should sound thoughtful, grounded, and slightly deeper.
Keep the Arabic natural, clear, and close to polished everyday speech.
Do not read punctuation labels or explain these instructions.

${cleanText}
` : `
اقرأ النص بلغة عربية بيضاء طبيعية جداً، قريبة من الحديث اليومي الراقي والمفهوم في الخليج والعالم العربي.
لا تستخدم لهجة كويتية أو خليجية مصطنعة، ولا فصحى مدرسية جامدة.
اجعل النبرة إنسانية هادئة وواضحة، كأن شخصاً مثقفاً يشرح الجواب ببساطة ودفء.
لا تقلد المذيعين، ولا تمثل، ولا تستخدم مبالغات صوتية أو عبارات شعبية محلية.
لا تذكر أنك نموذج ذكاء اصطناعي ولا تشرح التعليمات.
لا تقرأ الرموز ولا الزخارف، واقرأ المعنى فقط.
استخدم توقفات قصيرة طبيعية بين الجمل.
أسلوب الأداء المطلوب: ${style === "quick-answer" ? "قراءة جواب سريع بلغة عربية بيضاء هادئة" : "حديث عربي أبيض طبيعي وهادئ"}.

النص:
${cleanText}
`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
        contents: [{ parts: [{ text: naturalizedText }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: isPodcast
                ? {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: "Host",
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
                            },
                            {
                                speaker: "Guest",
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
                            }
                        ]
                    }
                }
                : {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: selectedVoice }
                    }
                }
        }
    };

    const response = await generateWithRetry(async () => {
        const r = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const bodyText = await r.text();
        let body: any;
        try { body = JSON.parse(bodyText); } catch { body = { raw: bodyText }; }
        if (!r.ok) {
            const err: any = new Error(body?.error?.message || bodyText || `Gemini TTS HTTP ${r.status}`);
            err.statusCode = r.status;
            throw err;
        }
        const hasAudio = body?.candidates?.[0]?.content?.parts?.some((part: any) => part?.inlineData?.data);
        if (!hasAudio) {
            const err: any = new Error("No audio data returned from Gemini TTS");
            err.statusCode = 503;
            throw err;
        }
        return body;
    }, "Gemini TTS");

    const audioPart = response?.candidates?.[0]?.content?.parts?.find((part: any) => part?.inlineData?.data);
    const rawAudioData = audioPart?.inlineData?.data;
    const rawMimeType = audioPart?.inlineData?.mimeType || "audio/L16;codec=pcm;rate=24000";

    if (!rawAudioData) throw new Error("No audio data returned from Gemini TTS");

    if (/audio\/(wav|mpeg|mp3|ogg|webm)/i.test(rawMimeType)) {
        return { audioData: rawAudioData, mimeType: rawMimeType, voiceName: selectedVoice };
    }

    return {
        audioData: pcmBase64ToWavBase64(rawAudioData, sampleRateFromMime(rawMimeType)),
        mimeType: "audio/wav",
        sourceMimeType: rawMimeType,
        voiceName: selectedVoice
    };
}

// Load dataset for offline fallback
let qawlFaslDataset: any[] = [];
try {
    const filePath = path.join(process.cwd(), "qawl_fasl_full_v1.json");
    if (fs.existsSync(filePath)) {
        qawlFaslDataset = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        console.log(`[Server] Loaded ${qawlFaslDataset.length} fallback reference questions.`);
    }
} catch (e) {
    console.warn("[Server] Could not load qawl_fasl_full_v1.json for offline fallback:", e);
}

function findOfflineMatch(query: string): any {
    if (!query || qawlFaslDataset.length === 0) return null;
    
    const cleanQuery = query.toLowerCase().trim();
    
    // 1. Exact or keyword title match
    for (const item of qawlFaslDataset) {
        if (item.title && (cleanQuery.includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(cleanQuery))) {
            return item;
        }
    }
    
    // 2. Keyword score matching
    let bestMatch = null;
    let highestScore = 0;
    
    for (const item of qawlFaslDataset) {
        let score = 0;
        const keywords = [
            ...(item.tags || []),
            ...(item.title ? item.title.split(/\s+/) : []),
            ...(item.quickSummary ? item.quickSummary.split(/\s+/) : [])
        ].filter(k => k && k.length > 2);
        
        for (const kw of keywords) {
            if (cleanQuery.includes(kw.toLowerCase())) {
                score++;
            }
        }
        
        if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    }
    
    return highestScore >= 2 ? bestMatch : null;
}


function getQuestionContext(query: string) {
    const q = (query || "").toLowerCase();
    const hasChildTerms = /(طفل|طفلي|طفلك|الأطفال|اطفال|ابني|ابنتي|بنتي|ولدي|ولديّ|مراهق|مراهقة|الأبناء|الابناء|حضانة|روضة|مدرسة|واجبات|عناد|نوبات غضب|يبكي|يضرب|يكذب|يسرق|تبول|رضاعة|تربية)/i.test(q);
    const hasTimeTerms = /(اليوم|وقتي|وقت|خسائر|تعويض|فات|المسار|إنجاز|انجاز|مهام|تخطيط|أولويات|اولويات|إنتاجية|انتاجية|جدول|تقييم|تحسين يومي|عادة|عادات)/i.test(q);
    const hasSelfTerms = /(نفسي|حياتي|عملي|هدفي|أهدافي|قرار|قراري|إدارة|ادارة|أفكار|تفكير|قلق|تردد|مشاعر|إنسان|انسان|ذات|تطوير)/i.test(q);
    if (hasChildTerms && !hasTimeTerms && !hasSelfTerms) return "child";
    if (hasTimeTerms) return "life_planning";
    if (hasSelfTerms) return "self_growth";
    return "general";
}

function buildAdaptiveFallbackObject(userPrompt: string, isEnglish: boolean) {
    const context = getQuestionContext(userPrompt);
    const safeQuestion = userPrompt || (isEnglish ? "General question" : "سؤال عام");

    if (context === "child") {
        return {
            question: safeQuestion,
            mainCategory: isEnglish ? "Parenting" : "تربية الأبناء",
            categorySlug: "parenting",
            ageGroups: [isEnglish ? "All" : "الكل"],
            riskLevel: isEnglish ? "Medium" : "متوسط",
            keywords: isEnglish ? ["parenting", "guidance", "behavior"] : ["تربية", "توجيه", "سلوك"],
            quickSummary: isEnglish
                ? `This situation needs calm containment, clear boundaries, and a response suited to the child's age.`
                : `هذا الموقف يحتاج إلى احتواء هادئ، وحدود واضحة، واستجابة تناسب عمر الطفل وسياق الموقف.`,
            quickAnswer: {
                sayThis: isEnglish
                    ? "I understand what you feel. Let's talk calmly and find a better way together."
                    : "أنا أفهم ما تشعر به. خلّنا نتكلم بهدوء ونبحث عن طريقة أفضل معاً.",
                dontSayThis: isEnglish
                    ? "You always do this. I will not listen to you."
                    : "أنت دائماً تفعل هذا، ولن أسمع لك.",
                doThisNow: isEnglish
                    ? "Lower your tone, get physically closer, and give one clear next step."
                    : "اخفض نبرة صوتك، اقترب بهدوء، وقدّم خطوة واحدة واضحة الآن."
            },
            commonMistake: isEnglish ? "Reacting before understanding the child's need." : "التعامل مع السلوك قبل فهم الحاجة التي تقف خلفه.",
            educationalView: isEnglish ? "Behavior often carries an emotional message that needs decoding before correction." : "السلوك عند الطفل غالباً يحمل رسالة شعورية تحتاج إلى فهم قبل التصحيح.",
            suggestedAnswer: isEnglish ? "Start with emotional safety, then guide the behavior with calm firmness." : "ابدأ بالأمان النفسي، ثم وجّه السلوك بحزم هادئ.",
            byAgeVersions: [],
            practicalSteps: isEnglish
                ? ["Pause before responding.", "Name the feeling.", "Offer one acceptable alternative."]
                : ["توقّف لحظة قبل الرد.", "سمِّ الشعور بهدوء.", "قدّم بديلاً واحداً مقبولاً."],
            exercises: [],
            whenToWorry: isEnglish ? "If the behavior becomes repeated, intense, or harmful." : "إذا تكرر السلوك بشدة أو أصبح مؤذياً أو خارج السيطرة.",
            religiousReference: "",
            scientificStat: "",
            resources: [],
            closingThought: isEnglish ? "Calm guidance teaches more than loud correction." : "التوجيه الهادئ يعلّم أكثر مما يعلّمه الانفعال.",
            sourceStatus: "adaptive"
        };
    }

    if (context === "life_planning") {
        return {
            question: safeQuestion,
            mainCategory: isEnglish ? "Life Planning" : "إدارة اليوم والمسار",
            categorySlug: "life-planning",
            ageGroups: [],
            riskLevel: isEnglish ? "Low" : "منخفض",
            keywords: isEnglish ? ["time", "planning", "recovery"] : ["وقت", "تخطيط", "تعويض", "مسار"],
            quickSummary: isEnglish
                ? `Evaluate today's losses by separating what is gone, what can still be recovered, and what should be protected tomorrow.`
                : `تقييم خسائر اليوم يبدأ بفصل ما فات فعلاً، عما يمكن تعويضه، وما يجب حمايته في الغد.`,
            quickAnswer: {
                sayThis: isEnglish
                    ? "Name one recoverable action, do it now, then close the day without self-punishment."
                    : "حدّد عملاً واحداً يمكن إنقاذه الآن، أنجزه، ثم أغلق اليوم بلا جلد للذات.",
                dontSayThis: isEnglish
                    ? "The day is ruined, so there is no point in doing anything."
                    : "اليوم ضاع بالكامل، ولا فائدة من فعل أي شيء.",
                doThisNow: isEnglish
                    ? "Write three columns: lost, recoverable, and postponed. Start with the smallest recoverable item."
                    : "اكتب ثلاث خانات: ما فات، ما يمكن إنقاذه، وما يؤجل. وابدأ بأصغر شيء قابل للإنقاذ."
            },
            commonMistake: isEnglish ? "Treating a partial loss as a complete collapse." : "تحويل الخسارة الجزئية إلى انهيار كامل.",
            educationalView: isEnglish ? "The day is not one block; it is recoverable units of attention, energy, and priorities." : "اليوم ليس كتلة واحدة؛ بل وحدات قابلة للاسترداد من الانتباه والطاقة والأولويات.",
            suggestedAnswer: isEnglish ? "Recover one meaningful task, reduce tomorrow's damage, and learn the pattern that caused the loss." : "استرد مهمة ذات معنى، وقلّل ضرر الغد، وافهم النمط الذي تسبب في الخسارة.",
            byAgeVersions: [],
            practicalSteps: isEnglish
                ? ["Stop counting the whole day as lost.", "Choose one task that takes less than 15 minutes.", "Move the remaining tasks into a realistic tomorrow list."]
                : ["لا تحسب اليوم كله خسارة واحدة.", "اختر مهمة واحدة لا تتجاوز 15 دقيقة.", "انقل الباقي إلى قائمة واقعية للغد."],
            exercises: isEnglish ? ["End-of-day three-column review."] : ["تمرين مراجعة اليوم بثلاث خانات."],
            whenToWorry: isEnglish ? "If repeated daily loss becomes chronic avoidance or severe distress." : "إذا تحوّل ضياع اليوم إلى تجنّب مزمن أو ضيق شديد ومتكرر.",
            religiousReference: "",
            scientificStat: "",
            resources: [],
            closingThought: isEnglish ? "A day is repaired by one honest step, not by regret." : "اليوم يُرمَّم بخطوة صادقة، لا بالندم.",
            sourceStatus: "adaptive"
        };
    }

    return {
        question: safeQuestion,
        mainCategory: isEnglish ? "General Guidance" : "إرشاد عام",
        categorySlug: "general-adaptive",
        ageGroups: [],
        riskLevel: isEnglish ? "Low" : "منخفض",
        keywords: isEnglish ? ["understanding", "decision", "balance"] : ["فهم", "قرار", "اتزان"],
        quickSummary: isEnglish
            ? `The answer should follow the question's actual context without forcing a parenting frame onto it.`
            : `الجواب يجب أن يتبع سياق السؤال نفسه، دون افتراض أنه متعلق بالطفل أو التربية إن لم يكن كذلك.`,
        quickAnswer: {
            sayThis: isEnglish
                ? "Start by naming the real issue, then choose one practical next step."
                : "ابدأ بتسمية المشكلة الحقيقية، ثم اختر خطوة عملية واحدة تالية.",
            dontSayThis: isEnglish
                ? "This must fit one fixed template."
                : "لا تُجبر السؤال على قالب واحد لا يناسبه.",
            doThisNow: isEnglish
                ? "Rewrite the question in one clear sentence, then answer that sentence only."
                : "أعد صياغة السؤال في جملة واضحة، ثم أجب عن هذه الجملة فقط."
        },
        commonMistake: isEnglish ? "Using a fixed answer template for every topic." : "استخدام قالب ثابت لكل موضوع مهما اختلف السؤال.",
        educationalView: isEnglish ? "Good guidance is context-aware before it is content-rich." : "الإرشاد الجيد يبدأ بفهم السياق قبل كثرة المحتوى.",
        suggestedAnswer: isEnglish ? "Adapt the structure, examples, and language to the user's actual question." : "كيّف البنية والأمثلة واللغة بحسب سؤال المستخدم الفعلي.",
        byAgeVersions: [],
        practicalSteps: isEnglish ? ["Identify the domain.", "Remove unrelated examples.", "Give one direct answer."] : ["حدّد المجال.", "احذف الأمثلة غير المرتبطة.", "قدّم جواباً مباشراً واحداً."],
        exercises: [],
        whenToWorry: "",
        religiousReference: "",
        scientificStat: "",
        resources: [],
        closingThought: isEnglish ? "Precision is respect for the question." : "الدقة احترام للسؤال.",
        sourceStatus: "adaptive"
    };
}

function buildAdaptiveFallbackText(query: string, isEnglish: boolean): string {
    const obj = buildAdaptiveFallbackObject(query, isEnglish);
    if (isEnglish) {
        return `### Focused Answer\n${obj.quickSummary}\n\n### What to do now\n${obj.quickAnswer.doThisNow}\n\n### Avoid\n${obj.quickAnswer.dontSayThis}\n\n### Key idea\n${obj.closingThought}`;
    }
    return `### خلاصة مركزة\n${obj.quickSummary}\n\n### ماذا تفعل الآن؟\n${obj.quickAnswer.doThisNow}\n\n### تجنّب\n${obj.quickAnswer.dontSayThis}\n\n### الفكرة الأهم\n${obj.closingThought}`;
}

function formatOfflineResponse(item: any, isEnglish: boolean): string {
    if (isEnglish) {
        return `[Tebyan Preview - Smart Emergency Offline Mode activated]
Note: The default system API Key is currently suspended (403 CONSUMER_SUSPENDED) by Google. To restore real cloud-native generation, please insert your own active GEMINI_API_KEY in the platform.

Here is an authentic clinical educational response for your request:

### 🌟 Wisdom Summary
${item.quickSummary || "Analyzing the child's situation with compassion and structured logic."}

### 🗣️ Say This:
> "${item.quickAnswer?.sayThis || "I understand you are feeling this way..."}"

### 🚫 Avoid Saying This:
> "${item.quickAnswer?.dontSayThis || "No..."}"

### 🛠️ Immediate Steps to Take:
${(item.practicalSteps || []).map((step: string, i: number) => `${i+1}. ${step}`).join('\n')}

### 💡 Common Pitfalls & Mistakes:
${item.commonMistake || "Reacting with immediate high emotional charge."}

### 📘 Deep Educational View:
${item.educationalView || "Child acts on sensory or safety needs. Reframing the challenge changes the response."}

---
*Note: This response comes from the integrated Tebyan educational manual (Qawl-Fasl).*`;
    } else {
        return `[معاينة تبيان - تفعيل وضع الاستجابة الذكي المحلي (Offline Mode)]
ملاحظة: مفتاح الذكاء الاصطناعي الافتراضي معلّق حالياً من قِبل المزود (CONSUMER_SUSPENDED). لتشغيل التحليل الفعلي السحابي، يرجى تزويد المنصة بمفتاح GEMINI_API_KEY صالح في الإعدادات.

إليك استجابة تربوية منهجية كاملة من دليلك التربوي المدمج:

### 🌟 خلاصة تبيان المركزة (قول فصل)
${item.quickSummary || "يتطلب التعامل مع هذا الموقف بناء الثقة المتبادلة وتوجيه السلوك بالحب والحزم."}

### 🗣️ قل هذا لطفلك الآن:
> "${item.quickAnswer?.sayThis || "أنا هنا لأسمعك وأساعدك..."}"

### 🚫 تجنب تماماً قول هذا:
> "${item.quickAnswer?.dontSayThis || "لا تفعل هذا وإلا..."}"

### 🛠️ خطوات عملية فورية:
${(item.practicalSteps || []).map((step: string, i: number) => `${i+1}. ${step}`).join('\n')}

### 💡 خطأ تربوي شائع تجنبه:
${item.commonMistake || "الغضب الفوري أو زجر الطفل دون فهم المحرك الداخلي لسلوكه."}

### 📘 المنظور التربوي والأكاديمي لتبيان:
${item.educationalView || "الأطفال يعبرون عن رغبات غير ملباة من خلال السلوك الخارجي. عندما نوفر الأمان النفسي، يستقيم السلوك تلقائياً."}

---
*هذه الاستجابة مستخرجة من الدليل التربوي المعتمد لتبيان (مبحث القول الفصل).*`;
    }
}

function generateSmartGenerativeResponse(query: string, isEnglish: boolean): string {
    if (isEnglish) {
        return `[Tebyan Preview - Smart Emergency Response Mode (No-Connection AI)]
Note: The system GEMINI_API_KEY is currently suspended on Google Cloud. You can insert a valid key in the platform settings of AI Studio.

In the meantime, Tebyan has applied child psychology rules to provide this educational response:

### 🌟 Immediate Assessment
Analyzing your situation: "${query}". We recognize the developmental significance of this milestone and the psychological layers behind it.

### 🗣️ Suggested Guidance Dialogue:
- **Approach with empathy**: Start by validating the child's perspective.
- **Set clear boundaries**: Maintain a firm yet gentle stance on behavioral expectations.
- **Offer choices**: Empower the child by offering structured options rather than absolute commands.

### 🛠️ Practical Parent Action Plan:
1. **Model Calming Behavior**: Children mirror adult stress levels. Take a deep breath first.
2. **Quality Connection**: Dedicate 15 minutes of uninterrupted focus daily to reinforce secure attachment.
3. **Encourage Emotional Labeling**: Help them name their feelings (e.g., mad, frustrated, sad) to build self-regulation.

### 📘 Key Insight:
Behind every challenging behavior is an unmet developmental need. Safe emotional outlets allow healthy growth.`;
    } else {
        return `[معاينة تبيان - تفعيل وضع الطوارئ والاتصال الذكي المحاكي للذكاء الاصطناعي]
ملاحظة: مفتاح الذكاء الاصطناعي الافتراضي معلّق حالياً (CONSUMER_SUSPENDED). يرجى تعبئة أو تجديد مفتاح GEMINI_API_KEY في إعدادات المنصة.

في هذه الأثناء، طبق تبيان قواعد التربية وعلم نفس الطفل لتقديم هذه الاستجابة المنهجية لطلبك:

### 🌟 التحليل الأولي للموقف
تحليل الموقف لطلبك: "${query}". يتضح أن السلوك الحالي يتطلب تفهماً للمرحلة السلوكية والعمرية التي يمر بها الطفل، مع فك شفرة الرسائل النفسية الكامنة وراء التصرف.

### 🗣️ حوار مقترح مع الطفل (قل هذا):
- **الاحتواء أولاً**: "يا حبيبي أنا أفهم تماماً أنك تشعر بالضيق/الغضب الآن..."
- **تحديد التوقعات بحب**: "أنا هنا معك، ولكن يمنع الإيذاء/السلوك غير المقبول..."
- **تخيير الطفل**: "هل تحب أن نفعل هذا الخيار الأول أم الخيار الثاني معاً؟"

### 🛠️ خطة عمل فورية للتعامل:
1. **الهدوء الواعي وملاحظة الذات**: قبل التدخل، تنفس بعمق وحافظ على نبرة صوت هادئة ومنخفضة لعكس الأمان للطفل.
2. **أشرك طفلك في الحل**: اسأله في وقت لاحق يكون فيه هادئاً: "كيف يمكننا تجنب تكرار ذلك في المرة القادمة؟"
3. **تعزيز السلوك البديل**: امدح طفلك على الفور عندما يتصرف بمسؤولية أو يعبّر عن مشاعره بكلمات هادئة.

### 📘 منظور تبيان النفسي:
ما يراه الآباء سلوكاً عنيداً أو سيئاً هو في الغالب محاولة من الطفل للتعبير عن استقلاليته أو تلبية حاجة غير واعية للأمان أو الاهتمام. الأمان النفسي هو حجر الزاوية لكل نمو تربوي سليم.`;
    }
}

function handleServerSideAIFallback(contents: any, config: any, error: any) {
    let userPrompt = "";
    if (Array.isArray(contents)) {
        for (const item of contents) {
            if (item.parts && Array.isArray(item.parts)) {
                for (const part of item.parts) {
                    if (part.text) {
                        userPrompt += part.text + " ";
                    }
                }
            }
        }
    }
    userPrompt = userPrompt.trim();
    
    const promptLower = userPrompt.toLowerCase();
    const systemInstructionLower = (config?.systemInstruction || "").toLowerCase();
    const isEnglish = systemInstructionLower.includes("english") || (userPrompt && /[a-zA-Z]/.test(userPrompt));
    
    // Check if the caller expects a JSON response in multiple robust ways
    const wantsJson = 
        config?.responseMimeType === "application/json" || 
        promptLower.includes("json") ||
        promptLower.includes("refined_query") ||
        promptLower.includes("maturitylabel") ||
        promptLower.includes("classification") ||
        systemInstructionLower.includes("json") ||
        systemInstructionLower.includes("maturitylabel") ||
        systemInstructionLower.includes("classification") ||
        systemInstructionLower.includes("rage") ||
        systemInstructionLower.includes("actionable development suggestions");
    
    if (wantsJson) {
        console.log("[Server] Offline fallback requested as JSON. Formatting appropriately based on query signatures.");
        
        // 1. Check if it's a query rewrite/suggestion (useSmartSearch)
        if (promptLower.includes("refined_query") || promptLower.includes("أخرج json فقط") || promptLower.includes("إكمال وصياغة ذكي") || promptLower.includes("refined_query")) {
            let refinedText = getQuestionContext(userPrompt) === "child" ? "كيف أجيب عن سؤال طفلي بطريقة مبسطة وصادقة: من أين جئت؟" : "كيف أفهم هذا السؤال وأتعامل معه بخطوة عملية واضحة؟";
            
            if (promptLower.includes("يدخن") || promptLower.includes("دخان")) {
                refinedText = "كيف أتعامل مع ابني المراهق عند اكتشاف تدخينه؟";
            } else if (promptLower.includes("صلا") || promptLower.includes("صلي") || promptLower.includes("صلاة")) {
                refinedText = "كيف أشجع طفلي على الصلاة والعبادة بحب ودون إجبار؟";
            } else if (promptLower.includes("عناد") || promptLower.includes("عنيد") || promptLower.includes("يصرخ")) {
                refinedText = "أساليب التعامل مع عناد وصراخ الطفل في السنوات الأولى";
            } else if (promptLower.includes("أصل") || promptLower.includes("ولاد") || promptLower.includes("جئت") || promptLower.includes("بطن")) {
                refinedText = "كيف أجيب عن سؤال طفلي بطريقة مبسطة وصادقة: من أين جئت؟";
            } else if (promptLower.includes("سرق") || promptLower.includes("يسرق")) {
                refinedText = "خطوات عملية لعلاج سلوك السرقة عند الأطفال وبناء الأمان العاطفي لديهم";
            } else if (promptLower.includes("كذب") || promptLower.includes("يكذب")) {
                refinedText = "كيف يمكن تعديل سلوك الكذب عند الطفل دون عقاب قاصٍ؟";
            } else {
                let cleanPhrase = userPrompt;
                if (cleanPhrase.includes("نص المستخدم:")) {
                    cleanPhrase = cleanPhrase.split("نص المستخدم:")[1] || cleanPhrase;
                }
                cleanPhrase = cleanPhrase.replace(/[\n\r{}]/g, '').trim();
                if (cleanPhrase.length > 50) {
                    cleanPhrase = cleanPhrase.substring(0, 50) + "...";
                }
                const context = getQuestionContext(cleanPhrase);
                refinedText = context === "child"
                    ? `كيف أتعامل مع موقف ${cleanPhrase || "تربوي عابر"} بطريقة تربوية حكيمة؟`
                    : `كيف أفهم موضوع ${cleanPhrase || "هذا السؤال"} وأتعامل معه بخطوة عملية واضحة؟`;
            }
            return { text: JSON.stringify({ refined_query: refinedText }), offline: true };
        }
        
        // 2. Check if it's Rage Expression Analysis (Rage Room / ClientProfilePanel)
        if (promptLower.includes("rage") || systemInstructionLower.includes("rage") || systemInstructionLower.includes("تفريغ")) {
            const fallbackRage = {
                rage: Math.floor(Math.random() * 40) + 40,
                sad: Math.floor(Math.random() * 30) + 10,
                tired: Math.floor(Math.random() * 20) + 10
            };
            return { text: JSON.stringify(fallbackRage), offline: true };
        }
        
        // 3. Check if it's Galaxy and Maturity Analysis
        if (promptLower.includes("maturitylabel") || systemInstructionLower.includes("maturitylabel") || systemInstructionLower.includes("مجرة")) {
            const fallbackGalaxy = {
                summary: "تحليل ذكي ومكثف لمسيرتك الاستشارية وتطلعاتك التربوية الحكيمة لتبيان.",
                maturityLabel: "نضج استراتيجي وعي متزن",
                scores: [25, 18, 30],
                themes: ["تربية عاطفية", "الأمان النفسي", "الهدوء والاتزان", "الحوار الإيجابي"],
                commitments: [
                    "تخصيص روتين يومي هادئ للحوار مع الأبناء بدون عصبية.",
                    "التركيز على المدح وتأصيل لغة الصدق والأمان المتبادل."
                ]
            };
            return { text: JSON.stringify(fallbackGalaxy), offline: true };
        }
        
        // 4. Check if it's Actionable suggestions for traffic data (AdminDashboard)
        if (promptLower.includes("traffic data") || systemInstructionLower.includes("actions") || systemInstructionLower.includes("retention") || systemInstructionLower.includes("actionable development suggestions")) {
            const fallbackSuggestions = [
                {
                    title: "تعزيز قسم 'قول فصل' بدليل تفاعلي مرئي",
                    description: "إضافة صور توضيحية ومواقف فيديو تربوية تفاعلية تدعم السيناريوهات اليومية وتزيد ارتباط الآباء بالمنصة.",
                    priority: "high"
                },
                {
                    title: "إطلاق نظام تذكير ومتابعة ذكي للأهداف التربوية",
                    description: "إرسال إشعارات وتنبيهات مخصصة عبر واتساب أو البريد الإلكتروني لمساعدة الوالدين على الالتزام بتعهداتهم التربوية المتفق عليها.",
                    priority: "medium"
                },
                {
                    title: "ورش عمل مجتمعية وجلسات حوارية لمشاركة التجارب",
                    description: "توفير مساحة آمنة ومدروسة داخل المنصة لتبادل الخبرات والاستشارات المجتمعية تحت إشراف نخبة من المختصين في التربية وسلوك الطفل.",
                    priority: "low"
                }
            ];
            return { text: JSON.stringify(fallbackSuggestions), offline: true };
        }
        
        // 5. Check if it's Knowledge Memory Semantic Process
        if (promptLower.includes("classification") || systemInstructionLower.includes("classification") || promptLower.includes("exact_duplicate")) {
            const fallbackClassification = {
                classification: "new_case",
                matchId: null,
                normalizedMeaning: getQuestionContext(userPrompt) === "child" ? "استشارة تربوية جديدة تتناول الطفل أو الأسرة" : "سؤال عام يحتاج استجابة متكيفة مع سياقه",
                mainTopic: getQuestionContext(userPrompt) === "child" ? "تربية وتوجيه السلوك" : "إرشاد عام وسياقي",
                subTopics: getQuestionContext(userPrompt) === "child" ? ["تعديل سلوك", "أمان نفسي", "تواصل عاطفي"] : ["فهم السياق", "خطوة عملية", "اتزان"],
                riskLevel: "low",
                ageMentioned: null,
                emotionalTone: "seeking_help"
            };
            return { text: JSON.stringify(fallbackClassification), offline: true };
        }
        
        // 6. Check if there's a matched item in our curated dataset
        const match = findOfflineMatch(userPrompt);
        if (match) {
            console.log(`[Server] Found exact offline curated match: "${match.title || match.question}"`);
            return { text: JSON.stringify(match), offline: true };
        }
        
        // 7. Fallback compliant adaptive object: do not force child/parenting language on unrelated questions.
        console.log("[Server] No match in offline dataset. Generating adaptive fallback object.");
        const fallbackObj = buildAdaptiveFallbackObject(userPrompt, isEnglish);
        return { text: JSON.stringify(fallbackObj), offline: true };
    } else {
        // Plain text fallback
        const match = findOfflineMatch(userPrompt);
        let responseText = "";
        if (match) {
            responseText = formatOfflineResponse(match, isEnglish);
        } else {
            responseText = buildAdaptiveFallbackText(userPrompt, isEnglish);
        }
        return { text: responseText, offline: true };
    }
}

async function startServer() {
    const app = express();
    const PORT = process.env.NODE_ENV === "production" ? (process.env.PORT || 3000) : 3000;

    app.set('trust proxy', 1);
    
    // إعدادات CORS: مقصورة على نطاقات المشروع (وlocalhost في التطوير فقط).
    // Returning `false` omits the CORS headers so the browser blocks the
    // response; throwing would surface a confusing 500 instead.
    app.use(cors({
        origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Firebase-AppCheck'],
        maxAge: 3600
    }));
    
    app.use(express.json());

    // Logging Middleware (تسجيل دقيق للطلبات)
    app.use((req, res, next) => {
        if (req.url.startsWith('/api')) {
            console.log(`[${new Date().toISOString()}] [Server] API Request: ${req.method} ${req.url}`);
            console.log(`[Server] Headers: origin=${req.headers.origin}, referer=${req.headers.referer}`);
        }
        next();
    });

    // Health Endpoint
    app.get("/api/health", (req, res) => {
        const rawGemini = (process.env.GEMINI_API_KEY || "").trim();

        // Never expose the raw key value in a public endpoint.
        res.json({
            status: "ok",
            env: process.env.NODE_ENV || 'development',
            geminiKeyExists: !!rawGemini,
            geminiKeyLength: rawGemini.length,
            googleApiKeyExists: !!process.env.GOOGLE_API_KEY
        });
    });

    // AI Rate Limiter. Deliberately generous so real users are never blocked;
    // tighten with TEBYAN_AI_RATE_MAX / TEBYAN_AI_RATE_WINDOW_MS if the Gemini
    // bill shows abuse.
    const toPositiveInt = (value: unknown, fallback: number) => {
        const parsed = Number.parseInt(String(value ?? ""), 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };
    const aiRateLimit = rateLimit({
        windowMs: toPositiveInt(process.env.TEBYAN_AI_RATE_WINDOW_MS, 15 * 60 * 1000),
        max: toPositiveInt(process.env.TEBYAN_AI_RATE_MAX, 2000),
        message: { error: "Too many requests, please try again later." }
    });

    // AI Proxy Route — the audio route hits the same paid Gemini key as
    // /api/ai/generate, so it gets the same per-IP budget.
    app.post("/api/ai/audio", aiRateLimit, async (req, res) => {
        try {
            const audio = await generateTtsAudio(req.body || {});
            return res.json(audio);
        } catch (error: any) {
            console.error("[Server] TTS Error:", error);
            if (error?.statusCode === 400) {
                return res.status(400).json({ error: error.message });
            }
            const errStr = String(error?.message || error || "").toLowerCase();
            if (errStr.includes("api key") || errStr.includes("invalid") || errStr.includes("401") || errStr.includes("suspended") || errStr.includes("403") || errStr.includes("forbidden") || errStr.includes("permission")) {
                return res.status(200).json({
                    audioData: "",
                    mimeType: "audio/wav",
                    offline: true,
                    message: "وضع القراءة الصوتية متوقف مؤقتاً بسبب تعليق أو تعطيل المفتاح الذكي في الإعدادات."
                });
            }
            return res.status(500).json({ error: "أعتذر، المحرك الصوتي مزدحم حالياً.. جرّب مرة أخرى بعد قليل." });
        }
    });

    app.post("/api/ai/generate", aiRateLimit, async (req, res) => {
        const { model: modelName, contents, config } = req.body;
        
        if (!contents) {
            return res.status(400).json({ error: "Missing contents" });
        }

        // Cache check
        const cacheKey = hashString(JSON.stringify({ modelName, contents, config }));
        if (smartCache.has(cacheKey)) {
            const cached = smartCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log("[Server] Serving from cache");
                return res.json(cached.response);
            }
        }

        const genAI = getGenAI();
        if (!genAI) {
            console.log("[Server] Gemini Client not available (missing or suspended key). Serving smart offline fallback response.");
            const fallbackResult = handleServerSideAIFallback(contents, config, new Error("Gemini Key is suspended or missing."));
            return res.json(fallbackResult);
        }

        try {
            // Model Aliasing - Use stable models but allow newer versions
            let finalModel = modelName || "gemini-2.5-flash";
            // If it's a generic "gemini" or a non-standard name, fallback to stable.
            if (finalModel === "gemini" || finalModel.includes("2.5") || finalModel.includes("3.1") || finalModel.includes("3-flash") || finalModel.includes("preview")) {
                finalModel = "gemini-2.5-flash";
            }

            const attemptGeneration = async (selectedModel: string) => {
                const generationConfig: any = {};
                if (config) {
                    if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
                    if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
                    if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
                }

                const model = genAI.getGenerativeModel({ 
                    model: selectedModel,
                    generationConfig,
                    systemInstruction: config?.systemInstruction
                });

                console.log(`[Server] Generating with model: ${selectedModel}, content length: ${JSON.stringify(contents).length}`);

                return await model.generateContent({ contents });
            };

            let result;
            try {
                result = await generateWithRetry(() => attemptGeneration(finalModel), `Gemini AI (${finalModel})`);
            } catch (firstError: any) {
                const firstErrStr = (firstError.message || "").toLowerCase();
                const isSuspended = firstErrStr.includes("403") || firstErrStr.includes("suspended") || firstErrStr.includes("permission");
                const isExpired = firstErrStr.includes("expired") || firstErrStr.includes("api_key_invalid");
                const isBusy = isGeminiBusyError(firstError);
                
                console.warn(`[Server] First AI attempt failed with ${finalModel}:`, firstError.message);
                
                if (isExpired || isSuspended) {
                    console.log("[Server] Gemini key is suspended or expired. Activating smart offline fallback.");
                    const fallbackResult = handleServerSideAIFallback(contents, config, firstError);
                    return res.json(fallbackResult);
                } else if (isBusy) {
                    return res.status(429).json({
                        error: "AI_HIGH_DEMAND",
                        message: "خدمة الذكاء الاصطناعي عليها ضغط حالياً. حاول مرة أخرى بعد قليل.",
                        details: firstError.message
                    });
                } else {
                    const fallbackModel = "gemini-2.5-flash";
                    console.log(`[Server] Retrying with fallback model: ${fallbackModel}`);
                    try {
                        result = await generateWithRetry(() => attemptGeneration(fallbackModel), `Gemini AI Fallback (${fallbackModel})`);
                    } catch (secondError: any) {
                        console.error(`[Server] Fallback AI also failed. Activating smart offline fallback:`, secondError.message);
                        const fallbackResult = handleServerSideAIFallback(contents, config, secondError);
                        return res.json(fallbackResult);
                    }
                }
            }

            if (!result.response) {
                throw new Error("No response from Gemini");
            }

            let responseText = "";
            try {
                responseText = result.response.text();
            } catch (e: any) {
                console.warn("[Server] Could not get text from response (likely safety filter):", e);
                // Try to get text from the first candidate if possible
                if (result.response.candidates?.[0]?.content?.parts?.[0]?.text) {
                    responseText = result.response.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("AI response was blocked or empty. Please try a different prompt.");
                }
            }
            console.log(`[Server] AI Response length: ${responseText.length}`);
            
            const aiResponse = { text: responseText };
            smartCache.set(cacheKey, { timestamp: Date.now(), response: aiResponse });
            
            res.json(aiResponse);
        } catch (error: any) {
            console.error("[Server] AI Error:", error);
            const errStr = (error.message || "").toLowerCase();
            if (errStr.includes("api key") || errStr.includes("invalid") || errStr.includes("401")) {
                if (process.env.NODE_ENV !== "production") {
                    const wantsJson = config?.responseMimeType === "application/json";
                    const isArray = config?.responseSchema?.type === 'ARRAY';
                    const mockResponse = wantsJson ? (isArray ? "[]" : "{}") : "وضع التجربة المحلي يعمل، لكن مفتاح Gemini غير مفعّل على الخادم.";
                    return res.json({ text: mockResponse });
                } else {
                    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
                }
            }
            if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted")) {
              return res.status(500).json({ error: "أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل." });
            }
            res.status(500).json({ error: "يبدو أن معالجة هذه الفكرة تتطلب وقتاً أطول.. جرب صياغة أبسط أو العودة لاحقاً." });
        }
    });

    // Vite Integration
    if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        // In production, esbuild output is dist/server.js
        // The frontend builds into dist/
        // Since server.js is inside dist/, __dirname will be /app/applet/dist/
        const distPath = path.resolve(__dirname);
        console.log(`[Server] Production mode: Serving static files from ${distPath}`);
        
        app.use(express.static(distPath, {
          index: false, // We handle index.html manually below
          etag: true,
          lastModified: true,
          maxAge: '1y',
          immutable: true,
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('index.html') || filePath.endsWith('sw.js') || filePath.endsWith('site.webmanifest')) {
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              return;
            }

            if (/\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?)$/i.test(filePath)) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
          }
        }));
        
        app.get('*', (req, res) => {
            const indexPath = path.join(distPath, 'index.html');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.sendFile(indexPath, (err) => {
                if (err) {
                    console.error(`[Server] Error sending index.html from ${indexPath}:`, err);
                    res.status(500).send("Index file not found. Please run build.");
                }
            });
        });
    }

    app.listen(Number(PORT), "0.0.0.0", () => {
        console.log(`[Server] Running on http://localhost:${PORT}`);
    });
}

startServer().catch(err => {
    console.error("[Server] Critical Startup Error:", err);
});
