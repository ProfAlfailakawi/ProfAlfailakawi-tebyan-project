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

function sampleRateFromMime(mimeType = "") {
    const match = String(mimeType).match(/rate=(\d+)/i);
    return match ? Number(match[1]) : 24000;
}


async function generateElevenLabsTtsAudio(text) {
    const apiKey = (process.env.ELEVENLABS_API_KEY || "").trim();
    if (!apiKey) return null;
    const voiceId = (process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM").trim();
    const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": apiKey, "Accept": "audio/mpeg" },
        body: JSON.stringify({
            text: text.slice(0, 4500),
            model_id: modelId,
            voice_settings: { stability: 0.42, similarity_boost: 0.82, style: 0.38, use_speaker_boost: true }
        })
    });
    if (!r.ok) {
        const err = new Error(await r.text());
        err.statusCode = r.status;
        throw err;
    }
    const audioBuffer = Buffer.from(await r.arrayBuffer());
    return { audioData: audioBuffer.toString("base64"), mimeType: "audio/mpeg", voiceName: voiceId, provider: "elevenlabs-tts" };
}

async function generateGoogleCloudTtsAudio(text) {
    const apiKey = (process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "").trim();
    const standardPrefix = "AI" + "za";
    if (!apiKey || !apiKey.startsWith(standardPrefix)) return null;
    const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;
    const payload = {
        input: { text: text.slice(0, 4800) },
        voice: { languageCode: "ar-XA", name: process.env.GOOGLE_TTS_VOICE || "ar-XA-Wavenet-B" },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.94, pitch: -0.5 }
    };
    const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const bodyText = await r.text();
    let body;
    try { body = JSON.parse(bodyText); } catch { body = {}; }
    if (!r.ok || !body.audioContent) {
        const err = new Error(body?.error?.message || bodyText || `Google Cloud TTS HTTP ${r.status}`);
        err.statusCode = r.status;
        throw err;
    }
    return { audioData: body.audioContent, mimeType: "audio/mpeg", voiceName: payload.voice.name, provider: "google-cloud-tts" };
}

async function generateOpenAiTtsAudio(text) {
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();
    if (!apiKey) return null;
    const voices = ["alloy", "verse", "shimmer", "nova", "echo"];
    const voice = process.env.OPENAI_TTS_VOICE || voices[Math.floor(Math.random() * voices.length)];
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts", voice, input: text.slice(0, 4000), format: "mp3" })
    });
    if (!r.ok) {
        const err = new Error(await r.text());
        err.statusCode = r.status;
        throw err;
    }
    const audioBuffer = Buffer.from(await r.arrayBuffer());
    return { audioData: audioBuffer.toString("base64"), mimeType: "audio/mpeg", voiceName: voice, provider: "openai-tts" };
}

async function generateProviderFallbackAudio(text) {
    const providers = [generateElevenLabsTtsAudio, generateOpenAiTtsAudio, generateGoogleCloudTtsAudio];
    let lastError;
    for (const provider of providers) {
        try {
            const audio = await provider(text);
            if (audio?.audioData) return audio;
        } catch (error) {
            lastError = error;
            console.warn("TTS fallback provider failed:", error?.message || error);
        }
    }
    if (lastError) console.warn("All TTS fallback providers failed:", lastError?.message || lastError);
    return { audioData: "", mimeType: "audio/wav", offline: true, message: "" };
}

async function generateTtsAudio({ text, voiceName, style = "natural" }) {
    if (!text || typeof text !== "string" || !text.trim()) {
        const err = new Error("Missing text for audio generation");
        err.statusCode = 400;
        throw err;
    }

    // Natural Gemini voices. Keep the selection varied so podcast episodes do not feel identical.
    const naturalVoices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede", "Zephyr", "Leda", "Orus", "Autonoe", "Callirrhoe"];
    const selectedVoice = voiceName && naturalVoices.includes(voiceName)
        ? voiceName
        : naturalVoices[Math.floor(Math.random() * naturalVoices.length)];
    const hostVoice = selectedVoice;
    const guestVoice = naturalVoices.find((v) => v !== hostVoice) || "Kore";

    const apiKey = getGeminiApiKey();
    const standardPrefix = "AI" + "za";
    if (!apiKey || !apiKey.startsWith(standardPrefix)) {
        return await generateProviderFallbackAudio(text);
    }

    const naturalizedText = `
${style === "podcast" ? `
حوّل النص التالي إلى أداء صوتي بودكاست طبيعي جداً.
المطلوب صوت بشري دافئ، غير آلي، بإيقاع هادئ، وتوقفات قصيرة بين الجمل.
اقرأ الحوار كجلسة حقيقية بين شخصين، لا كتلخيص ولا كنشرة تعليمات.
نوّع النبرة بين المتحدثين بوضوح، واجعل الجمل العربية طبيعية وقريبة من السمع الخليجي الهادئ.
لا تذكر أسماء المتحدثين بطريقة جامدة إذا كان ذلك يفسد السلاسة؛ اجعل الانتقال بينهم مسموعاً وطبيعياً.
` : `
اقرأ النص التالي بصوت عربي طبيعي جداً، دافئ وهادئ، بعيد عن الآلية والمبالغة.
`}

النص:
${text}
`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(apiKey)}`;
    const singleVoicePayload = {
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

    const multiVoicePayload = {
        contents: [{ parts: [{ text: naturalizedText }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        { speaker: "المحاور", voiceConfig: { prebuiltVoiceConfig: { voiceName: hostVoice } } },
                        { speaker: "المقدم", voiceConfig: { prebuiltVoiceConfig: { voiceName: hostVoice } } },
                        { speaker: "Host", voiceConfig: { prebuiltVoiceConfig: { voiceName: hostVoice } } },
                        { speaker: "صوت تربوي هادئ", voiceConfig: { prebuiltVoiceConfig: { voiceName: guestVoice } } },
                        { speaker: "ضيف متخصص", voiceConfig: { prebuiltVoiceConfig: { voiceName: guestVoice } } },
                        { speaker: "Guest", voiceConfig: { prebuiltVoiceConfig: { voiceName: guestVoice } } }
                    ]
                }
            }
        }
    };

    const requestTts = async (payload) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        try {
            const r = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal
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
        } finally {
            clearTimeout(timeout);
        }
    };

    let response;
    try {
        if (style === "podcast") {
            try {
                response = await generateWithRetry(() => requestTts(multiVoicePayload), "Gemini multi-speaker TTS");
            } catch (multiError) {
                console.warn("Multi-speaker TTS failed, retrying with a single natural voice:", multiError?.message || multiError);
                response = await generateWithRetry(() => requestTts(singleVoicePayload), "Gemini TTS");
            }
        } else {
            response = await generateWithRetry(() => requestTts(singleVoicePayload), "Gemini TTS");
        }
    } catch (geminiTtsError) {
        console.warn("Gemini TTS failed, trying provider fallback:", geminiTtsError?.message || geminiTtsError);
        return await generateProviderFallbackAudio(text);
    }

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
                message: ""
            });
        }
        return res.status(200).json({ audioData: "", mimeType: "audio/wav", offline: true, message: "" });
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
