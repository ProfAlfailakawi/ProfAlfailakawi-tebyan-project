
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
  // استخدام الرابط الأساسي للخادم إذا كان معرفاً في 환경 الإنتاج، وإلا استخدام مسار نسبي
  const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || '';
  
  const response = await fetch(`${baseUrl}/api/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('يبدو أنك تستخدم النسخة المرفوعة (Static) والتي لا تحتوي على خادم (Backend) لدعم الذكاء الاصطناعي. يرجى التأكد من تشغيل التطبيق في بيئة تدعم خادم Node.js.');
  }

  if (!response.ok) {
    const error = await response.json();
    const e = new Error(error.error || 'AI request failed');
    (e as any).code = error.code;
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
  const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || '';
  
  const response = await fetch(`${baseUrl}/api/ai/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

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
