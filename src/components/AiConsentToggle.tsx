import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AI_CONSENT_CHANGED_EVENT, hasAiConsent, openAiConsentDialog, revokeAiConsent } from '../lib/aiConsent';
import { PRIVACY_POLICY_URL } from './AiConsentDialog';

/** سحب الموافقة على مشاركة الأسئلة مع Google Gemini أو منحها من الإعدادات. */
export default function AiConsentToggle({ language = 'ar' }: { language?: 'ar' | 'en' }) {
  const [on, setOn] = useState(() => hasAiConsent());
  useEffect(() => {
    const sync = () => setOn(hasAiConsent());
    window.addEventListener(AI_CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AI_CONSENT_CHANGED_EVENT, sync);
  }, []);
  const ar = language !== 'en';
  const label = ar ? 'مشاركة الأسئلة مع خدمة الذكاء الاصطناعي (Google Gemini)' : 'Share questions with the AI service (Google Gemini)';
  return (
    <div className="border-t border-[color:var(--tb-sky)]/15 pt-6" dir={ar ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-navy flex items-center gap-2 text-sm">
          <Sparkles size={16} className="text-[color:var(--tb-sky)]" /> {label}
        </span>
        <span className="text-xs font-bold">{on ? (ar ? 'مفعّلة' : 'On') : (ar ? 'متوقفة' : 'Off')}</span>
      </div>
      <p className="text-xs text-ink-mute mt-2 leading-relaxed">
        {ar
          ? 'عند التفعيل يُرسَل نص سؤالك (والنص المطلوب قراءته صوتيًا) إلى Google — واجهة Gemini API لتوليد الإجابة. '
          : 'When on, the text of your question (and text to be read aloud) is sent to Google — the Gemini API — to generate the answer. '}
        <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener" className="underline">{ar ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
      </p>
      <button
        type="button"
        onClick={() => { if (on) revokeAiConsent(); else void openAiConsentDialog(); }}
        className="mt-3 w-full py-3 min-h-[44px] bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
      >
        {on
          ? (ar ? 'إيقاف مشاركة الأسئلة مع خدمة الذكاء الاصطناعي' : 'Stop sharing questions with the AI service')
          : (ar ? 'السماح بمشاركة الأسئلة مع خدمة الذكاء الاصطناعي' : 'Allow sharing questions with the AI service')}
      </button>
    </div>
  );
}
