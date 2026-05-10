import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const refineIdea = async (idea: string, language: 'ar' | 'en') => {
  const systemInstruction = language === 'ar' 
    ? "أنت 'أرسطو' الرقمي. مهمتك صقل الفكرة المطروحة بأسلوب فلسفي مقتضب وعميق جداً. اجعل النتيجة مركزة ولا تتجاوز 250 حرفاً تقريباً. ركز على الجوهر فقط. قاعدة أسلوبية نهائية: حوّل النص ولا تخاطب المستخدم بصيغة مذكر أو مؤنث، ويفضل استخدام صياغة إرشادية أو جماعية هادئة."
    : "You are a Digital Aristotle. Your task is to refine the idea in a concise, deep philosophical style. Keep the result focused and around 250 characters. Focus on the core essence. Style Rule: Do not address the user directly as male or female; use descriptive, neutral, and guiding language.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: idea,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const translateWithContext = async (text: string, targetLang: 'ar' | 'en') => {
  const systemInstruction = targetLang === 'ar'
    ? "أنت مترجم ثقافي خبير. لا تترجم الكلمات حرفياً بل انقل 'المعنى الثقافي' والعمق الفلسفي للنص إلى العربية. إذا كان هناك مصطلح لا يُترجم بسهولة، استخدم أقرب مرادف ثقافي عميق. قاعدة أسلوبية نهائية: حوّل النص ولا تخاطب المستخدم بصيغة مذكر أو مؤنث، ويفضل استخدام صياغة إرشادية أو جماعية هادئة."
    : "You are an expert cultural translator. Do not translate literally; convey the 'cultural meaning' and philosophical depth of the text into English. If a concept like 'Muru'ah' is used, translate it to its closest deep cultural equivalent. Style Rule: Do not address the user directly as male or female; use descriptive, neutral, and guiding language.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: text,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    return null;
  }
};

export const findSoulMatch = async (userPosts: string[], language: 'ar' | 'en') => {
  const systemInstruction = language === 'ar'
    ? "حلل هذه المنشورات وحدد النمط الفكري العميق لهذا الشخص. ثم أعطه رسالة ملهمة حول 'توأم روحه الفكري' الذي يشاركه ذات التردد. قاعدة أسلوبية نهائية: حوّل النص ولا تخاطب المستخدم بصيغة مذكر أو مؤنث، ويفضل استخدام صياغة إرشادية أو جماعية هادئة."
    : "Analyze these posts and identify the user's deep intellectual pattern. Then give them an inspiring message about their 'Intellectual Twin' who shares the same frequency. Style Rule: Do not address the user directly as male or female; use descriptive, neutral, and guiding language.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPosts.join("\n---\n"),
      config: {
        systemInstruction,
        temperature: 0.9,
      },
    });
    return response.text;
  } catch (error) {
    return null;
  }
};
