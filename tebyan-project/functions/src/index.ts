import * as functions from "firebase-functions";
import fetch from "node-fetch";
import cors from "cors";

// إعداد CORS للسماح بالطلبات من أي مصدر (Frontend)
const corsHandler = cors({ origin: true });

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
