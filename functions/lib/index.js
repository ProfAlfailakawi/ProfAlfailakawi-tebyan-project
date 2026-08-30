"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAI = void 0;
// @ts-nocheck
const functions = require("firebase-functions");
const node_fetch_1 = require("node-fetch");
const cors_1 = require("cors");
// إعداد CORS للسماح بالطلبات من أي مصدر (Frontend)
const corsHandler = (0, cors_1.default)({ origin: true });
exports.generateAI = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        var _a, _b, _c, _d, _e, _f;
        try {
            if (req.method !== "POST") {
                return res.status(405).send("Method Not Allowed");
            }
            const { prompt } = req.body;
            if (!prompt) {
                return res.status(400).json({ error: "No prompt provided" });
            }
            // قراءة مفتاح الخاص بالـ API
            // يرجى إضافة المفتاح عبر: firebase functions:config:set gemini.key="YOUR_API_KEY"
            const apiKey = ((_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.key) || process.env.GEMINI_API_KEY;
            if (!apiKey) {
                return res.status(500).json({ error: "API key missing" });
            }
            // طلب Gemini API
            const response = await (0, node_fetch_1.default)(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                }),
            });
            const data = await response.json();
            console.log("Gemini response:", data);
            const text = ((_f = (_e = (_d = (_c = (_b = data === null || data === void 0 ? void 0 : data.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text) || "";
            return res.json({ result: text });
        }
        catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    });
});
//# sourceMappingURL=index.js.map