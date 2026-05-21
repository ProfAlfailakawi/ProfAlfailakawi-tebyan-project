import process from "node:process";
import { GoogleGenAI } from "@google/genai";

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: "hi",
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Aoede" },
          },
        },
      },
    });

    console.log(
      "Success! Audio length:",
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data?.length
    );
  } catch (e) {
    console.error("Error:", e);
  }
}

run();