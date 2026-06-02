const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Gemini
const getGenAI = () => {
    let apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey === "YOUR_ACTUAL_API_KEY_HERE" || apiKey === "MY_GEMINI_API_KEY") {
        apiKey = (process.env.GOOGLE_API_KEY || "").trim();
    }
    const standardPrefix = "AI" + "za";
    if (!apiKey || !apiKey.startsWith(standardPrefix)) {
        console.warn("Invalid or missing GEMINI_API_KEY in Cloud Functions env.");
        return null;
    }
    return new GoogleGenerativeAI(apiKey);
};

// Health check
app.get(["/health", "/api/health"], (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    res.json({
        status: "ok",
        geminiKeyExists: !!apiKey && apiKey !== "MY_GEMINI_API_KEY",
        geminiKeyLength: apiKey ? apiKey.length : 0,
        aiClientInitialized: !!getGenAI()
    });
});


const getGeminiApiKey = () => {
    let apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey === "YOUR_ACTUAL_API_KEY_HERE" || apiKey === "MY_GEMINI_API_KEY") {
        apiKey = (process.env.GOOGLE_API_KEY || "").trim();
    }
    return apiKey;
};

function pcmBase64ToWavBase64(pcmBase64, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
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


function sanitizeTtsText(input) {
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
        .replace(/\s+/g, " ")
        .trim();
    const chunks = cleaned.split(/(?<=[.!؟؛])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
    const seen = new Set();
    const unique = [];
    for (const chunk of chunks) {
        const key = chunk.replace(/[\s:：،.؟!؛]+/g, "").slice(0, 120);
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(chunk);
        }
    }
    return unique.join(" ").slice(0, 1400).trim();
}

function sampleRateFromMime(mimeType = "") {
    const match = String(mimeType).match(/rate=(\d+)/i);
    return match ? Number(match[1]) : 24000;
}

async function generateTtsAudio({ text, voiceName, style = "natural" }) {
    if (!text || typeof text !== "string" || !text.trim()) {
        const err = new Error("Missing text for audio generation");
        err.statusCode = 400;
        throw err;
    }

    const cleanText = sanitizeTtsText(text);
    if (!cleanText) {
        const err = new Error("Missing clean text for audio generation");
        err.statusCode = 400;
        throw err;
    }

    const femaleVoices = ["Kore", "Aoede"];
    const maleVoices = ["Charon", "Fenrir", "Puck", "Zephyr"];
    const allVoices = [...femaleVoices, ...maleVoices];
    const selectedVoice = voiceName && allVoices.includes(voiceName)
        ? voiceName
        : allVoices[Math.floor(Math.random() * allVoices.length)];

    const apiKey = getGeminiApiKey();
    const standardPrefix = "AI" + "za";
    if (!apiKey || !apiKey.startsWith(standardPrefix)) {
        return {
            audioData: "",
            mimeType: "audio/wav",
            offline: true,
            message: "وضع القراءة الصوتية متوقف مؤقتاً بسبب عدم تفعيل مفتاح الصوت على الخادم."
        };
    }

    const naturalizedText = `
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
            speechConfig: {
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
        let body;
        try { body = JSON.parse(bodyText); } catch { body = { raw: bodyText }; }
        if (!r.ok) {
            const err = new Error(body?.error?.message || bodyText || `Gemini TTS HTTP ${r.status}`);
            err.statusCode = r.status;
            throw err;
        }
        return body;
    }, "Gemini TTS");

    const audioPart = response?.candidates?.[0]?.content?.parts?.find((part) => part?.inlineData?.data);
    const rawAudioData = audioPart?.inlineData?.data;
    const rawMimeType = audioPart?.inlineData?.mimeType || "audio/L16;codec=pcm;rate=24000";

    if (!rawAudioData) {
        throw new Error("No audio data returned from Gemini TTS");
    }

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isGeminiBusyError = (error) => {
    const message = String(error?.message || error || "").toLowerCase();
    return (
        message.includes("503") ||
        message.includes("service unavailable") ||
        message.includes("high demand") ||
        message.includes("overloaded") ||
        message.includes("temporarily unavailable") ||
        message.includes("try again") ||
        message.includes("deadline exceeded")
    );
};

const generateWithRetry = async (operation, label = "Gemini request") => {
    const delays = [0, 1000, 3000, 8000];
    let lastError;

    for (let attempt = 0; attempt < delays.length; attempt++) {
        if (delays[attempt] > 0) {
            console.warn(`${label} busy. Retry ${attempt + 1}/${delays.length} after ${delays[attempt]}ms.`);
            await sleep(delays[attempt]);
        }

        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!isGeminiBusyError(error)) {
                throw error;
            }
            console.warn(`${label} busy/high demand on attempt ${attempt + 1}:`, error?.message || error);
        }
    }

    throw lastError;
};

// AI Audio / Podcast Speech
app.post(["/audio", "/api/ai/audio", "/api/audio"], async (req, res) => {
    try {
        const audio = await generateTtsAudio(req.body || {});
        return res.json(audio);
    } catch (error) {
        console.error("TTS Error:", error);
        if (error?.statusCode === 400) {
            return res.status(400).json({ error: error.message });
        }
        const errStr = String(error?.message || error || "").toLowerCase();
        if (
            errStr.includes("api key") ||
            errStr.includes("invalid") ||
            errStr.includes("401") ||
            errStr.includes("suspended") ||
            errStr.includes("403") ||
            errStr.includes("forbidden") ||
            errStr.includes("permission")
        ) {
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

// AI Generation
app.post(["/generate", "/api/ai/generate", "/api/generate"], async (req, res) => {
    const { model: modelName, contents } = req.body;
    
    if (!contents) {
        return res.status(400).json({ error: "Missing contents" });
    }

    const genAI = getGenAI();
    if (!genAI) {
        if (process.env.NODE_ENV !== "production") {
            const wantsJson = req.body.config?.responseMimeType === "application/json";
            const isArray = req.body.config?.responseSchema?.type === 'ARRAY';
            const mockResponse = wantsJson ? (isArray ? "[]" : "{}") : "وضع التجربة المحلي يعمل، لكن مفتاح Gemini غير مفعّل على الخادم.";
            return res.json({ text: mockResponse });
        } else {
            return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
        }
    }

    try {
        let finalModel = modelName || "gemini-2.5-flash";
        if (finalModel.includes("gemini-1.5")) {
            if (finalModel.includes("pro")) finalModel = "gemini-2.5-pro";
            else finalModel = "gemini-2.5-flash";
        } else if (finalModel === "gemini" || finalModel === "gemini-pro") {
            finalModel = "gemini-2.5-flash";
        }

        const generativeModelConfig = { model: finalModel };
        const config = req.body.config;
        if (config) {
            if (config.systemInstruction) {
                generativeModelConfig.systemInstruction = config.systemInstruction;
            }
            const genConfig = {};
            if (config.temperature !== undefined) genConfig.temperature = config.temperature;
            if (config.responseMimeType) genConfig.responseMimeType = config.responseMimeType;
            if (config.responseSchema) genConfig.responseSchema = config.responseSchema;
            if (Object.keys(genConfig).length > 0) {
                generativeModelConfig.generationConfig = genConfig;
            }
        }

        const model = genAI.getGenerativeModel(generativeModelConfig);
        
        let requestInput;
        if (Array.isArray(contents) && contents.length > 0 && ('role' in contents[0] || 'parts' in contents[0])) {
            requestInput = { contents: contents };
        } else {
            requestInput = contents;
        }

        const result = await model.generateContent(requestInput);
        const responseText = result.response.text();
        
        res.json({ text: responseText });
    } catch (error) {
        console.error("AI Error:", error);
        const errStr = (error.message || "").toLowerCase();
        if (errStr.includes("api key") || errStr.includes("invalid") || errStr.includes("401")) {
            if (process.env.NODE_ENV !== "production") {
                const wantsJson = typeof req !== 'undefined' && req.body?.config?.responseMimeType === "application/json";
                const isArray = typeof req !== 'undefined' && req.body?.config?.responseSchema?.type === 'ARRAY';
                const mockResponse = wantsJson ? (isArray ? "[]" : "{}") : "وضع التجربة المحلي يعمل، لكن مفتاح Gemini غير مفعّل على الخادم.";
                return res.json({ text: mockResponse });
            } else {
                return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
            }
        }
        res.status(500).json({ error: error.message || "AI Generation Failed" });
    }
});


// Export the app as 'api' function
exports.api = functions.https.onRequest(app);
