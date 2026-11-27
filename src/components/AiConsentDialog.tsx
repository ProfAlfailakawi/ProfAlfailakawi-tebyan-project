import React, { useEffect, useRef, useState } from 'react';
import {
  AI_CONSENT_DECLINED_EVENT,
  AI_CONSENT_REQUEST_EVENT,
  openAiConsentDialog,
  resolveAiConsentRequest,
  setAiConsentHostMounted,
} from '../lib/aiConsent';

export const PRIVACY_POLICY_URL = '/privacy-policy.html';

/** النص المعروض حرفيًا في الحوار (يُختبر في tests/ai-consent.test.ts). */
export const AI_CONSENT_TEXT = {
  ar: {
    title: 'مشاركة سؤالك مع خدمة ذكاء اصطناعي',
    intro: 'لتوليد الإجابة الذكية يرسل تبيان نصًا إلى جهة خارجية. نحتاج موافقتك قبل إرسال أي شيء.',
    whatTitle: 'ما الذي يُرسَل؟',
    what: [
      'نص سؤالك كما تكتبه، أو النص الذي تطلب تحليله أو قراءته بصوت مسموع.',
      'في بعض الأدوات: أسئلتك السابقة في تبيان التي تطلب تحليلها.',
      'اسمك الأول فقط إن كان اسمًا شخصيًا واضحًا، لكي تخاطبك الإجابة بالصيغة المناسبة.',
    ],
    notSent: 'لا يُرسَل بريدك الإلكتروني ولا رقم حسابك ولا أي بيانات دخول.',
    whoTitle: 'إلى من؟',
    who: 'إلى Google — واجهة Gemini API، وهي خدمة ذكاء اصطناعي تشغّلها شركة Google LLC. يمرّ الطلب عبر خادم تبيان ثم يصل إلى Google.',
    whyTitle: 'لماذا؟',
    why: 'لتوليد الإجابة أو الشرح أو التحليل أو الصوت الذي طلبته فقط، لا للإعلانات ولا للبيع.',
    policyLead: 'التفاصيل في',
    policy: 'سياسة الخصوصية',
    accept: 'أوافق وأتابع',
    decline: 'لا، شكراً',
    declinedNote: 'لم يُرسَل شيء. تحتاج إجابات الذكاء الاصطناعي إلى موافقتك، وما زالت المكتبة وبقية الأقسام متاحة لك.',
    reconsider: 'مراجعة الموافقة',
    dismiss: 'إغلاق',
  },
  en: {
    title: 'Share your question with an AI service',
    intro: 'To generate an AI answer, Tebyan sends text to a third party. We need your permission before anything is sent.',
    whatTitle: 'What is sent?',
    what: [
      'The text of your question as you type it, or the text you ask to be analysed or read aloud.',
      'In some tools: your earlier Tebyan questions that you ask to have analysed.',
      'Only your first name, when it is a clear personal name, so the answer can address you correctly.',
    ],
    notSent: 'Your email address, account ID and sign-in data are not sent.',
    whoTitle: 'Who receives it?',
    who: 'Google — the Gemini API, an AI service operated by Google LLC. The request passes through the Tebyan server and is then sent to Google.',
    whyTitle: 'Why?',
    why: 'Only to generate the answer, explanation, analysis or audio you asked for — never for advertising or sale.',
    policyLead: 'Details are in the',
    policy: 'Privacy Policy',
    accept: 'I agree and continue',
    decline: 'No, thanks',
    declinedNote: 'Nothing was sent. AI answers need your consent; the library and other sections remain available.',
    reconsider: 'Review consent',
    dismiss: 'Close',
  },
} as const;

export default function AiConsentDialog({ language }: { language: 'ar' | 'en' }) {
  const [open, setOpen] = useState(false);
  const [declinedNote, setDeclinedNote] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const t = AI_CONSENT_TEXT[language === 'en' ? 'en' : 'ar'];
  const dir = language === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    setAiConsentHostMounted(true);
    const onRequest = () => { setDeclinedNote(false); setOpen(true); };
    const onDeclined = () => setDeclinedNote(true);
    window.addEventListener(AI_CONSENT_REQUEST_EVENT, onRequest);
    window.addEventListener(AI_CONSENT_DECLINED_EVENT, onDeclined);
    return () => {
      window.removeEventListener(AI_CONSENT_REQUEST_EVENT, onRequest);
      window.removeEventListener(AI_CONSENT_DECLINED_EVENT, onDeclined);
      setAiConsentHostMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    acceptRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') answer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const answer = (granted: boolean) => {
    setOpen(false);
    resolveAiConsentRequest(granted);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-black/50 p-4"
          data-testid="ai-consent-overlay"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-consent-title"
            dir={dir}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-5 text-start"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            <h2 id="ai-consent-title" className="text-lg font-bold mb-2">{t.title}</h2>
            <p className="text-sm mb-3 leading-relaxed">{t.intro}</p>
            <h3 className="text-sm font-bold mt-2">{t.whatTitle}</h3>
            <ul className="list-disc ps-5 text-sm leading-relaxed">
              {t.what.map((line) => <li key={line}>{line}</li>)}
            </ul>
            <p className="text-sm mt-1 leading-relaxed font-semibold">{t.notSent}</p>
            <h3 className="text-sm font-bold mt-3">{t.whoTitle}</h3>
            <p className="text-sm leading-relaxed">{t.who}</p>
            <h3 className="text-sm font-bold mt-3">{t.whyTitle}</h3>
            <p className="text-sm leading-relaxed">{t.why}</p>
            <p className="text-sm mt-3">
              {t.policyLead}{' '}
              <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener" className="underline font-semibold text-sky-700 dark:text-sky-300">{t.policy}</a>
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                ref={acceptRef}
                type="button"
                onClick={() => answer(true)}
                className="w-full min-h-[44px] rounded-xl font-bold"
                style={{ backgroundColor: '#0f4c81', color: '#ffffff' }}
              >{t.accept}</button>
              <button
                type="button"
                onClick={() => answer(false)}
                className="w-full min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
              >{t.decline}</button>
            </div>
          </div>
        </div>
      )}
      {declinedNote && !open && (
        <div
          role="status"
          dir={dir}
          className="fixed inset-x-4 z-[2147482999] mx-auto max-w-md rounded-xl bg-slate-900 text-white p-4 shadow-xl text-sm text-start"
          style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
          data-testid="ai-consent-declined-note"
        >
          <p className="leading-relaxed">{t.declinedNote}</p>
          <div className="mt-2 flex gap-3">
            <button type="button" className="underline font-bold min-h-[44px]" onClick={() => { setDeclinedNote(false); void openAiConsentDialog(); }}>{t.reconsider}</button>
            <button type="button" className="underline min-h-[44px]" onClick={() => setDeclinedNote(false)}>{t.dismiss}</button>
          </div>
        </div>
      )}
    </>
  );
}
