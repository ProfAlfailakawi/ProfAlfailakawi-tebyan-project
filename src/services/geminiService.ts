import { proxyGenerateContent } from "../lib/aiProxy";

export const refineIdea = async (idea: string, language: 'ar' | 'en') => {
  const systemInstruction = language === 'ar' 
    ? "أنت 'أرسطو' الرقمي. مهمتك صقل الفكرة المطروحة بأسلوب فلسفي مقتضب وعميق جداً. اجعل النتيجة مركزة ولا تتجاوز 250 حرفاً تقريباً. ركز على الجوهر فقط. قاعدة أسلوبية نهائية: حوّل النص ولا تخاطب المستخدم بصيغة مذكر أو مؤنث، ويفضل استخدام صياغة إرشادية أو جماعية هادئة."
    : "You are a Digital Aristotle. Your task is to refine the idea in a concise, deep philosophical style. Keep the result focused and around 250 characters. Focus on the core essence. Style Rule: Do not address the user directly as male or female; use descriptive, neutral, and guiding language.";

  try {
    const response = await proxyGenerateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: idea }] }],
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });
    return response.text || null;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const translateWithContext = async (text: string, targetLang: 'ar' | 'en') => {
  const systemInstruction = targetLang === 'ar'
    ? "أنت مترجم ثقافي خبير. لا تترجم الكلمات حرفياً بل انقل 'المعنى الثقافي' والعمق الفلسفي للنص إلى العربية. إذا كان هناك مصطلح لا يُترجم بسهولة، استخدم أقرب مرادف ثقافي عميق. قاعدة أسلوبية نهائية: حوّل النص ولا تخاطب المستخدم بصيغة مذكر أو مؤنث، ويفضل استخدام صياغة إرشادية أو جماعية هادئة."
    : "You are an expert cultural translator. Convey the 'cultural meaning' and philosophical depth of the text. Keep the translation concise, guiding, and neutral. Do not use literal translation.";

  try {
    const response = await proxyGenerateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text || null;
  } catch (error) {
    return null;
  }
};

export const findSoulMatch = async (userPosts: string[], language: 'ar' | 'en') => {
  const systemInstruction = language === 'ar'
    ? "حلل هذه المنشورات وحدد النمط الفكري العميق لهذا الشخص. ثم أعطه رسالة ملهمة حول 'توأم روحه الفكري' الذي يشاركه ذات التردد. قاعدة أسلوبية نهائية: حوّل النص ولا تخاطب المستخدم بصيغة مذكر أو مؤنث، ويفضل استخدام صياغة إرشادية أو جماعية هادئة."
    : "Analyze these posts and identify the user's deep intellectual pattern. Then give them an inspiring message about their 'Intellectual Twin' who shares the same frequency. Style Rule: Do not address the user directly as male or female; use descriptive, neutral, and guiding language.";

  try {
    const response = await proxyGenerateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: userPosts.join("\n---\n") }] }],
      config: {
        systemInstruction,
        temperature: 0.9,
      }
    });
    return response.text || null;
  } catch (error) {
    return null;
  }
};

export const getIdeaSerendipity = async (ideaA: string, ideaB: string, language: 'ar' | 'en') => {
  const systemInstruction = language === 'ar'
    ? "أنت محرك اكتشاف صدفة (Serendipity). ادمج بين فكرتين مختلفتين تماماً في مجالات مختلفة، واطرح فكرة هجينة مبتكرة تربط بينهما بطريقة غير تقليدية وغير متوقعة. اجعل النص مختصراً ملهماً."
    : "You are a serendipity engine. Merge two completely different ideas from different fields, and propose an innovative hybrid idea that connects them in an unconventional and unexpected way. Keep the text concise and inspiring.";
    
  try {
    const response = await proxyGenerateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: `Idea A: ${ideaA}\nIdea B: ${ideaB}` }] }],
      config: { systemInstruction, temperature: 0.9 },
    });
    return response.text || null;
  } catch (error) { return null; }
};

export const analyzeTrends = async (ideas: string[], language: 'ar' | 'en') => {
  const systemInstruction = language === 'ar'
    ? "حلل هذه الأفكار واستخرج 'اتجاهات النسيج' (Fabric Trends) الأكثر نضجاً والتي تتطور بوضوح عبر التفاعلات التطويرية. لخص هذه الاتجاهات بتركيز."
    : "Analyze these ideas and extract the most mature 'Fabric Trends' that are clearly evolving through branch interactions. Summarize these trends concisely.";
  try {
    const response = await proxyGenerateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: ideas.join("\n---\n") }] }],
      config: { systemInstruction, temperature: 0.7 },
    });
    return response.text || null;
  } catch (error) { return null; }
};

export const generateMindMap = async (text: string, language: 'ar' | 'en') => {
    const systemInstruction = language === 'ar'
      ? "لخص هذا النص في خريطة ذهنية نصية متفرعة (هيكل شجري) لسهولة الفهم."
      : "Summarize this text into a branched text mind-map (tree structure) for easy understanding.";
    try {
      const response = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text }] }],
        config: { systemInstruction, temperature: 0.6 },
      });
      return response.text || null;
    } catch (error) { return null; }
  };
