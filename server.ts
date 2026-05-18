import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    
    if (!apiKey) {
        console.warn("[Server] WARNING: Missing API key in environment variables.");
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

async function startServer() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.set('trust proxy', 1);
    
    // إعدادات CORS للسماح للواجهة الأمامية بالاتصال بالخادم
    app.use(cors({
        origin: '*', // يمكنك تحديد الدومين الخاص بك هنا بدل * لزيادة الأمان مثل ['https://yourfrontend.com']
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
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
        let rawGemini = process.env.GEMINI_API_KEY;
        
        res.json({
            status: "ok",
            env: process.env.NODE_ENV || 'development',
            geminiKeyExists: !!rawGemini,
            rawGeminiValue: rawGemini,
            googleApiKeyExists: !!process.env.GOOGLE_API_KEY,
            googleApiKeyValue: process.env.GOOGLE_API_KEY ? 'exists' : 'missing'
        });
    });

    // AI Rate Limiter (Increased substantially to prevent blocking)
    const aiRateLimit = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 2000, // Increased from 50 to 2000
        message: { error: "Too many requests, please try again later." }
    });

    // AI Proxy Route
    app.post("/api/ai/audio", async (req, res) => {
        const { text, voiceName } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: "Missing text for audio generation" });
        }

        const genAI = getGenAI();
        if (!genAI) {
            return res.status(500).json({ error: "لم أستطع الوصول للمحرك الآن.. تأكد من تفعيل المفتاح الذكي في الإعدادات.", code: "GEMINI_API_KEY_NOT_CONFIGURED" });
        }

        try {
            console.log(`[Server] Generating TTS for text: "${text.substring(0, 50)}..."`);
            
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const result = await model.generateContent({
              contents: [{ role: 'user', parts: [{ text }] }],
              generationConfig: {
                // @ts-ignore
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { 
                        voiceName: (voiceName && ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'].includes(voiceName)) ? voiceName : 'Aoede' 
                      },
                    },
                },
              } as any,
            });

            const audioData = (result.response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith('audio/')) as any)?.inlineData?.data;
            
            if (!audioData) {
              throw new Error("No audio data returned from Gemini TTS");
            }

            res.json({ audioData });
        } catch (error: any) {
            console.error("[Server] TTS Error:", error);
            const errStr = (error.message || "").toLowerCase();
            if (errStr.includes("api key") || errStr.includes("invalid") || errStr.includes("401")) {
              return res.status(500).json({ error: "لم أستطع الوصول للمحرك الآن.. تأكد من تفعيل المفتاح الذكي في الإعدادات.", code: "GEMINI_API_KEY_NOT_CONFIGURED" });
            }
            res.status(500).json({ error: "أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل." });
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
            if (process.env.NODE_ENV !== "production") {
                const wantsJson = config?.responseMimeType === "application/json";
                const isArray = config?.responseSchema?.type === 'ARRAY';
                const mockResponse = wantsJson ? (isArray ? "[]" : "{}") : "وضع التجربة المحلي يعمل، لكن مفتاح Gemini غير مفعّل على الخادم.";
                return res.json({ text: mockResponse });
            } else {
                return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
            }
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

            const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            const isGeminiBusyError = (err: any) => {
                const msg = String(err?.message || err || "").toLowerCase();
                return (
                    msg.includes("503") ||
                    msg.includes("service unavailable") ||
                    msg.includes("high demand") ||
                    msg.includes("overloaded") ||
                    msg.includes("temporarily unavailable") ||
                    msg.includes("try again")
                );
            };

            const generateWithRetry = async (selectedModel: string) => {
                const delays = [0, 2000, 5000];

                let lastError: any;
                for (let attempt = 0; attempt < delays.length; attempt++) {
                    if (delays[attempt] > 0) {
                        console.warn(`[Server] Gemini busy. Retrying attempt ${attempt + 1}/${delays.length} after ${delays[attempt]}ms...`);
                        await sleep(delays[attempt]);
                    }

                    try {
                        return await attemptGeneration(selectedModel);
                    } catch (err: any) {
                        lastError = err;
                        if (!isGeminiBusyError(err)) {
                            throw err;
                        }
                        console.warn(`[Server] Gemini busy/high demand on attempt ${attempt + 1}:`, err?.message || err);
                    }
                }

                throw lastError;
            };

            let result;
            try {
                result = await generateWithRetry(finalModel);
            } catch (firstError: any) {
                const firstErrStr = (firstError.message || "").toLowerCase();
                const isSuspended = firstErrStr.includes("403") || firstErrStr.includes("suspended") || firstErrStr.includes("permission");
                const isExpired = firstErrStr.includes("expired") || firstErrStr.includes("api_key_invalid");
                const isBusy = isGeminiBusyError(firstError);
                
                console.warn(`[Server] First AI attempt failed with ${finalModel}:`, firstError.message);
                
                if (isExpired) {
                     return res.status(503).json({ 
                        error: "API_KEY_EXPIRED",
                        message: "المفتاح المضاف (API Key) منتهي الصلاحية أو غير صالح. يرجى إنشاء مفتاح جديد وحفظه في الإعدادات.",
                        details: firstError.message 
                    });
                } else if (isBusy) {
                    return res.status(503).json({
                        error: "AI_HIGH_DEMAND",
                        message: "خدمة الذكاء الاصطناعي عليها ضغط حالياً. حاول مرة أخرى بعد قليل.",
                        details: firstError.message
                    });
                } else if (isSuspended) {
                    const fallbackModel = finalModel === "gemini-2.5-flash" ? "gemini-2.5-flash" : "gemini-2.5-flash";
                    console.log(`[Server] Retrying with fallback model: ${fallbackModel}`);
                    try {
                        result = await generateWithRetry(fallbackModel);
                    } catch (secondError: any) {
                        const secondErrStr = (secondError.message || "").toLowerCase();
                        if (secondErrStr.includes("expired") || secondErrStr.includes("api_key_invalid")) {
                            return res.status(503).json({ 
                                error: "API_KEY_EXPIRED",
                                message: "المفتاح المضاف (API Key) منتهي الصلاحية أو غير صالح. يرجى إنشاء مفتاح جديد وحفظه في الإعدادات.",
                                details: secondError.message 
                            });
                        }

                        if (isGeminiBusyError(secondError)) {
                            return res.status(503).json({
                                error: "AI_HIGH_DEMAND",
                                message: "خدمة الذكاء الاصطناعي عليها ضغط حالياً. حاول مرة أخرى بعد قليل.",
                                details: secondError.message
                            });
                        }
                        
                        console.error(`[Server] Fallback AI also failed:`, secondError.message);
                        return res.status(503).json({ 
                            error: "AI_SERVICE_SUSPENDED",
                            message: "تم إيقاف مفتاح النظام للذكاء الاصطناعي (API Key) من قبل المصدر. يرجى تجديده أو توفير مفتاح آخر في الإعدادات.",
                            details: secondError.message 
                        });
                    }
                } else {
                    return res.status(500).json({ error: "AI_ERROR", message: firstError.message });
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
          index: false // We handle index.html manually below
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
