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

// AI Generation
app.post(["/audio", "/api/ai/audio", "/api/audio"], async (req, res) => {
    res.status(501).json({ error: "TTS functionality is currently experiencing upstream provider issues or is not configured on this server." });
});

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

// AI Audio (Stub)
app.post(["/audio", "/api/ai/audio"], async (req, res) => {
    res.status(501).json({ error: "Audio endpoint not yet implemented in Cloud Functions" });
});

// Export the app as 'api' function
exports.api = functions.https.onRequest(app);
