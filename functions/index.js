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

    const genAI = getGenAI();
    if (!genAI) {
        return res.status(200).json({
            audioData: "",
            offline: true,
            message: "وضع القراءة الصوتية متوقف مؤقتاً بسبب عدم تفعيل مفتاح الصوت على الخادم."
        });
    }

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

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });
        const result = await generateWithRetry(async () => {
            return await model.generateContent({
                contents: [{ role: "user", parts: [{ text: naturalizedText }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: selectedVoice }
                        }
                    }
                }
            });
        }, "Gemini TTS");

        const audioPart = result.response.candidates?.[0]?.content?.parts?.find((part) => {
            return part?.inlineData?.mimeType?.startsWith("audio/");
        });
        const audioData = audioPart?.inlineData?.data;

        if (!audioData) {
            throw new Error("No audio data returned from Gemini TTS");
        }

        return res.json({ audioData });
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
