import express from "express";
import path from "path";
import fs from "fs";
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
    let apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (apiKey === "MY_GEMINI_API_KEY" || apiKey === "YOUR_ACTUAL_AI_KEY_HERE" || apiKey === "INVALID_KEY_PLACEHOLDER") {
        apiKey = "";
    }
    
    if (!apiKey) {
        apiKey = (process.env.GEMINI_API_KEY2 || "").trim();
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
    const PORT = 3000; // Hardcoded to 3000 as per infrastructure requirements

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
        res.json({ 
            status: "ok", 
            env: process.env.NODE_ENV || 'development',
            path: __dirname,
            cwd: process.cwd(),
            geminiKeyExists: !!process.env.GEMINI_API_KEY,
            googleApiKeyExists: !!process.env.GOOGLE_API_KEY
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
            
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-tts-preview" });
            
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
            return res.status(500).json({ error: "لم أستطع الوصول للمحرك الآن.. تأكد من تفعيل المفتاح الذكي في الإعدادات.", code: "GEMINI_API_KEY_NOT_CONFIGURED" });
        }

        try {
            // Model Aliasing - Use stable models but allow newer versions
            let finalModel = modelName || "gemini-3-flash-preview";
            // If it's a generic "gemini" or a 1.0/1.5 model, upgrade it. 
            // But if it specifies 2.0, 3.1 etc., respect it.
            if (finalModel === "gemini" || finalModel === "gemini-1.5-flash" || finalModel === "gemini-2.5-flash") {
                finalModel = "gemini-3-flash-preview";
            }

            const generationConfig: any = {};
            if (config) {
                if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
                if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
                if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
            }

            const model = genAI.getGenerativeModel({ 
                model: finalModel,
                generationConfig,
                systemInstruction: config?.systemInstruction
            });

            console.log(`[Server] Generating with model: ${finalModel}, content length: ${JSON.stringify(contents).length}`);
            const result = await model.generateContent({ contents });

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
              return res.status(500).json({ error: "لم أستطع الوصول للمحرك الآن.. تأكد من تفعيل المفتاح الذكي في الإعدادات.", code: "GEMINI_API_KEY_NOT_CONFIGURED" });
            }
            if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("resource_exhausted")) {
              return res.status(500).json({ error: "أعتذر، المحرك مزدحم حالياً بالأفكار.. جرّب مرة أخرى بعد قليل." });
            }
            res.status(500).json({ error: "يبدو أن معالجة هذه الفكرة تتطلب وقتاً أطول.. جرب صياغة أبسط أو العودة لاحقاً." });
        }
    });

    // Vite Integration
    const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
    
    if (!isProduction) {
        console.log("[Server] Starting in Development Mode...");
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        // In production, esbuild output is dist/server.js
        // The frontend builds into dist/
        const distPath = __dirname.endsWith('dist') ? __dirname : path.join(process.cwd(), 'dist');
        console.log(`[Server] Production mode: Serving static files from ${distPath}`);
        
        const indexPath = path.join(distPath, 'index.html');
        
        if (!fs.existsSync(indexPath)) {
            console.error(`[Server] CRITICAL: index.html not found at ${indexPath}`);
            console.log(`[Server] Current directory contents: ${fs.readdirSync(process.cwd()).join(', ')}`);
            if (fs.existsSync(distPath)) {
                console.log(`[Server] Dist directory contents: ${fs.readdirSync(distPath).join(', ')}`);
            }
        }

        app.use(express.static(distPath, {
          index: false // We handle index.html manually below
        }));
        
        app.get('*', (req, res) => {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            
            if (!fs.existsSync(indexPath)) {
                return res.status(500).send(`
                    <html>
                        <body style="font-family:sans-serif; padding: 40px; text-align: center;">
                            <h1>System Notice</h1>
                            <p>Application is initializing or index file is missing.</p>
                            <p style="color: #666; font-size: 12px;">Path: ${indexPath}</p>
                            <button onclick="window.location.reload()">Reload Page</button>
                        </body>
                    </html>
                `);
            }

            res.sendFile(indexPath, (err) => {
                if (err) {
                    console.error(`[Server] Error sending index.html:`, err);
                    res.status(500).send("Server Error: Failed to serve application.");
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
