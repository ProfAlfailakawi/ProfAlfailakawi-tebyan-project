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
const parseAudioMime = (mimeType = "") => {
    const rateMatch = String(mimeType).match(/rate=(\d+)/i);
    return {
        sampleRate: rateMatch ? Number(rateMatch[1]) : 24000,
        isRawPcm: /audio\/(l16|pcm)/i.test(String(mimeType)) || /codecs=pcm/i.test(String(mimeType))
    };
};

const pcm16Base64ToWavBase64 = (pcmBase64, sampleRate = 24000, channels = 1) => {
    const pcmBuffer = Buffer.from(pcmBase64, "base64");
    const header = Buffer.alloc(44);
    const byteRate = sampleRate * channels * 2;
    const blockAlign = channels * 2;

    header.write("RIFF", 0);
    header.writeUInt32LE(36 + pcmBuffer.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcmBuffer.length, 40);

    return Buffer.concat([header, pcmBuffer]).toString("base64");
};

const normalizeAudioPayload = (audioData, mimeType) => {
    if (!audioData) return { audioData: "", mimeType: "audio/wav" };
    const parsed = parseAudioMime(mimeType);
    if (parsed.isRawPcm) {
        return {
            audioData: pcm16Base64ToWavBase64(audioData, parsed.sampleRate, 1),
            mimeType: "audio/wav"
        };
    }
    return { audioData, mimeType: mimeType || "audio/wav" };
};

const extractAudioFromGeminiResponse = (payload) => {
    const parts = payload?.candidates?.[0]?.content?.parts || payload?.response?.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find((part) => part?.inlineData?.data && part?.inlineData?.mimeType?.startsWith("audio/"));
    return {
        audioData: audioPart?.inlineData?.data || "",
        mimeType: audioPart?.inlineData?.mimeType || ""
    };
};

const generateTtsViaRest = async ({ text, voiceName, style }) => {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    if (!apiKey) throw new Error("Missing Gemini API key");

    const naturalizedText = `
تحدث بطريقة طبيعية جداً وكأنك داخل بودكاست عربي حقيقي.
لا تقرأ النص كروبوت.
استخدم نبرة بشرية هادئة وعفوية.
أضف توقفات قصيرة طبيعية بين الجمل.
لا تبالغ في الأداء المسرحي.
اجعل الإلقاء دافئاً وقريباً من الإنسان.
أسلوب الأداء المطلوب: ${style === "podcast" ? "حوار بودكاست ذكي وعفوي" : "حديث بشري طبيعي وهادئ"}.

النص:
${text}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: naturalizedText }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName }
                    }
                }
            }
        })
    });

    const raw = await response.text();
    let payload;
    try { payload = JSON.parse(raw); } catch (_) { payload = { error: { message: raw } }; }

    if (!response.ok) {
        throw new Error(payload?.error?.message || `Gemini TTS HTTP ${response.status}`);
    }

    return extractAudioFromGeminiResponse(payload);
};

app.post(["/audio", "/api/ai/audio", "/api/audio"], async (req, res) => {
    const { text, voiceName, style = "natural" } = req.body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Missing text for audio generation" });
    }

    const femaleVoices = ["Kore", "Aoede"];
    const maleVoices = ["Charon", "Fenrir", "Puck", "Zephyr"];
    const allVoices = [...femaleVoices, ...maleVoices];
    const selectedVoice = voiceName && allVoices.includes(voiceName)
        ? voiceName
        : allVoices[Math.floor(Math.random() * allVoices.length)];

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    const standardPrefix = "AI" + "za";
    if (!apiKey || !apiKey.startsWith(standardPrefix)) {
        return res.status(200).json({
            audioData: "",
            mimeType: "audio/wav",
            offline: true,
            message: "وضع القراءة الصوتية متوقف مؤقتاً بسبب عدم تفعيل مفتاح الصوت على الخادم."
        });
    }

    try {
        const generated = await generateWithRetry(async () => {
            return await generateTtsViaRest({ text, voiceName: selectedVoice, style });
        }, "Gemini TTS");

        const normalized = normalizeAudioPayload(generated.audioData, generated.mimeType);
        if (!normalized.audioData) {
            throw new Error("No audio data returned from Gemini TTS");
        }

        return res.json(normalized);
    } catch (error) {
        console.error("TTS Error:", error);
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
