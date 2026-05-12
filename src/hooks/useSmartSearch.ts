import { useState, useEffect, useRef, useMemo } from 'react';
import { proxyGenerateContent } from '../lib/aiProxy';

export function useSmartSearch(searchValue: string, minLength: number = 6) {
  const [smartSuggestion, setSmartSuggestion] = useState("");
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const latestInputRef = useRef(searchValue);
  const requestIdRef = useRef(0);

  useEffect(() => {
    latestInputRef.current = searchValue;
  }, [searchValue]);

  useEffect(() => {
    const currentText = searchValue.trim();
    if (currentText.length < minLength) {
      setSmartSuggestion("");
      return;
    }

    const requestId = ++requestIdRef.current;
    const textForThisRequest = currentText;
    
    setIsSuggestionLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const latestText = latestInputRef.current.trim();
        
        if (latestText !== textForThisRequest) return;
        
        const prompt = `أنت محرك إكمال وصياغة ذكي لموقع تربوي عربي.

مهمتك:
إعادة صياغة ما يكتبه المستخدم إلى سؤال بحث واضح وطبيعي.

القواعد:
- افهم السياق والمعنى.
- إذا أضاف المستخدم تفاصيل جديدة، أعد بناء الجملة كاملة.
- لا تعطِ جواباً أو نصيحة.
- لا تبحث في الإنترنت.
- لا تشرح.
- أخرج صياغة واحدة فقط.
- اجعلها قصيرة ومناسبة للبحث.
- افهم العامية الخليجية.
- صحح الأخطاء الإملائية تلقائياً.

أمثلة:
ابني يدخن
=> ابني يدخن كيف أتصرف معه بطريقة صحيحة

ابني يدخن وبدا يضرب اخوانه
=> ابني يدخن وأصبح يضرب إخوانه كيف أتعامل معه تربوياً

ولدي ما يصلي
=> ولدي لا يحافظ على الصلاة كيف أشجعه عليها بدون ضغط

أخرج JSON فقط:
{
  "refined_query": ""
}

نص المستخدم:
${latestText}`;

        const response = await proxyGenerateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
          }
        });

        let suggestion = response.text?.trim() || "";
        
        try {
          const parsed = JSON.parse(suggestion);
          if (parsed && parsed.refined_query) {
             suggestion = parsed.refined_query.trim();
          }
        } catch (e) {
          console.error("Failed to parse JSON for smart suggestion:", e, suggestion);
        }

        if (requestId !== requestIdRef.current) return;
        if (latestInputRef.current.trim() !== latestText) return;

        if (suggestion && suggestion !== latestText && suggestion.startsWith(latestText)) {
          setSmartSuggestion(suggestion);
        } else if (suggestion && suggestion !== latestText) {
          // If it doesn't strictly start with current string (e.g. rewrite), we can still use it.
          // The UI will handle how it renders.
          setSmartSuggestion(suggestion);
        } else {
          setSmartSuggestion("");
        }
      } catch (error) {
        console.error("Smart search suggestion error:", error);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSuggestionLoading(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, minLength]);

  return { smartSuggestion, isSuggestionLoading, setSmartSuggestion };
}
