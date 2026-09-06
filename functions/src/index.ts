// @ts-nocheck
import * as functions from "firebase-functions";
import fetch from "node-fetch";
import cors from "cors";

// إعداد CORS: نقتصر على نطاقات المشروع بدل السماح لأي مصدر، حتى لا يستطيع
// أي موقع طرف ثالث استدعاء الدالة وإنفاق مفتاح Gemini. يمكن تجاوز القائمة
// عبر متغيّر البيئة TEBYAN_ALLOWED_ORIGINS (مفصولة بفواصل).
const DEFAULT_ALLOWED_ORIGINS = [
  "https://tebyan.dr-alfailakawi.com",
  "https://tebyan-clean-2026.web.app",
  "https://tebyan-clean-2026.firebaseapp.com",
];
const allowedOrigins = () => {
  const configured = String(process.env.TEBYAN_ALLOWED_ORIGINS || "")
    .split(",")
    .map((v) => v.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
};
const corsHandler = cors({
  origin: (origin, callback) => {
    // بدون ترويسة Origin: تنقّل من نفس الأصل أو أدوات مثل curl — لا نمنعها.
    if (!origin) return callback(null, true);
    const normalized = origin.trim().replace(/\/+$/, "");
    callback(null, allowedOrigins().includes(normalized));
  },
});

export const generateAI = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
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
      const apiKey = functions.config().gemini?.key || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "API key missing" });
      }

      // طلب Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
        {
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
        }
      );

      const data = await response.json();

      console.log("Gemini response:", data);

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return res.json({ result: text });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});
