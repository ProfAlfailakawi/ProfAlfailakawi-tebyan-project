
import { buildUserAddressingInstruction, getActiveUser, resolveUserAddressing } from "../utils/genderHelper";

/**
 * AI Proxy for Client-side usage.
 * This ensures that AI calls work correctly even when exported to GitHub
 * by routing requests through our own backend proxy.
 */

export async function proxyGenerateContent(params: {
  model?: string;
  contents: any[];
  config?: any;
}) {

  // Inject Panic Mode (Calm Mode) instructions if enabled
  const isPanicMode = localStorage.getItem('tebyan_panic_mode') === 'true';
  const modifiedParams = { ...params };
  modifiedParams.config = modifiedParams.config || {};

  // Inject active user information through the unified site-wide addressing layer.
  const activeUser = getActiveUser();
  const addressing = resolveUserAddressing(activeUser.name, activeUser.name === 'ضيف');

  const arabicGenderInstruction = `
[توجيه أسلوب الرد النهائي الحازم]:
1. نوع اللغة: يجب أن تتحدث وتجيب وتصيغ كل شيء كلياً باللغة العربية العامة السهلة، الناعمة والبسيطة جداً، الودية جداً والمفهومة للجميع (اللهجة البيضاء المقروءة اللطيفة، القريبة من لغة الحديث اليومي البسيط والودي) وتجنب تماماً الكلمات والمصطلحات المعقدة أو الرسمية والجامدة جداً.
${buildUserAddressingInstruction(addressing)}
3. الألوان والرموز: استخدم الإيموجيات اللطيفة باعتدال لتلوين الحديث وبث السعادة والسهولة والراحة دون مبالغة.
`;

  modifiedParams.config.systemInstruction = modifiedParams.config.systemInstruction
    ? `${modifiedParams.config.systemInstruction}\n\n${arabicGenderInstruction}`
    : arabicGenderInstruction;
  
  if (isPanicMode) {
     const panicInstruction = " [توجيه طوارئ: المستخدم يمر بضغط نفسي أو أزمة حالياً. اجعل إجاباتك أكثر تلطفاً، احتواءً، هدوءاً، وداعمة نفسياً جداً ولا تكن قاسياً أو حاداً أبداً.] ";
     modifiedParams.config.systemInstruction = modifiedParams.config.systemInstruction + panicInstruction;
  }


  // استخدام الرابط الأساسي للخادم إذا كان معرفاً في 환경 الإنتاج، وإلا استخدام مسار نسبي
  const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || '';
  
  // we use root-relative path for /api calls, which is safest in a container
  const apiPath = `/api/ai/generate`;

  let response;
  try {
    response = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modifiedParams),
    });
  } catch (fetchError: any) {
    console.error('[AI Proxy] Fetch failed:', fetchError);
    throw new Error('تحقق من اتصالك بالإنترنت، لم أتمكن من الوصول للمحرك.');
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    // If we got HTML, log the start of it for debugging
    const htmlSnippet = await response.text();
    console.warn('[AI Proxy] Received non-JSON response:', htmlSnippet.substring(0, 200));
    
    throw new Error('يبدو أن هناك ضغطاً على الخادم حالياً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.');
  }

  if (!response.ok) {
    const error = await response.json();
    const e = new Error(error.message || error.error || 'AI request failed');
    (e as any).code = error.code || error.error;
    throw e;
  }

  const data = await response.json();
  return { 
    response: { 
      get text() { return data.text; }
    },
    get text() { return data.text; },
    _cached: data._cached
  };
}

export async function proxyGenerateAudio(params: {
  text: string;
  voiceName?: string;
}) {
  // we use root-relative path for /api calls
  const apiPath = `/api/ai/audio`;

  let response;
  try {
    response = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.error('[AI Proxy] Audio fetch failed:', err);
    throw new Error('تحقق من اتصالك بالإنترنت، لم أتمكن من طلب الملف الصوتي.');
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('يبدو أنك تستخدم النسخة المرفوعة (Static) والتي لا تحتوي على خادم (Backend) لدعم الذكاء الاصطناعي. يرجى التأكد من تشغيل التطبيق في بيئة تدعم خادم Node.js.');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Audio generation failed');
  }

  const data = await response.json();
  if (data.error) { throw new Error(data.error); }
  return data.audioData;
}
