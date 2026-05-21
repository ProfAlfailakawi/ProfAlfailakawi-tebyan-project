import process from "node:process";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-tts",
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "hi" }] }],
      generationConfig: {
        // @ts-ignore
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Aoede" },
          },
        },
      } as any,
    });

    const audioData = (
      result.response.candidates?.[0]?.content?.parts?.find((p: any) =>
        p?.inlineData?.mimeType?.startsWith("audio/")
      ) as any
    )?.inlineData?.data;

    console.log("Success! Audio length via generative-ai:", audioData?.length);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();