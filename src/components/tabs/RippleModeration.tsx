import React, { useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { MODERATION_EMAIL, REPORT_REASONS, reportRipple, type ReportReason } from '../../lib/rippleReport';

const REASON_LABELS: Record<ReportReason, { ar: string; en: string }> = {
  spam: { ar: 'محتوى مزعج (سبام)', en: 'Spam' },
  abuse: { ar: 'إساءة أو تحرش', en: 'Abuse or harassment' },
  inappropriate: { ar: 'محتوى غير لائق', en: 'Inappropriate content' },
  other: { ar: 'سبب آخر', en: 'Other' },
};

/** سطر التواصل مع المشرفين: يظهر قرب أدوات الإبلاغ. */
export const ModerationContactLine = ({ language }: { language: 'ar' | 'en' }) => (
  <p className="text-xs text-ink-mute font-medium flex items-center gap-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
    <span>
      {language === 'ar' ? 'للإبلاغ عن محتوى مخالف أو الاستفسار عن الإشراف: ' : 'To report objectionable content or ask about moderation: '}
      <a href={`mailto:${MODERATION_EMAIL}`} dir="ltr" className="underline font-bold">{MODERATION_EMAIL}</a>
    </span>
  </p>
);

export const RippleReportDialog = ({ rippleId, language, onClose, onResult }: {
  rippleId: string;
  language: 'ar' | 'en';
  onClose: () => void;
  onResult: (message: string, type: 'success' | 'error') => void;
}) => {
  const ar = language === 'ar';
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await reportRipple(rippleId, reason, note);
      onResult(ar ? 'تم استلام بلاغك وسيراجعه المشرفون. شكراً لك.' : 'Report received. Our moderators will review it. Thank you.', 'success');
      onClose();
    } catch {
      onResult(ar ? 'تعذّر إرسال البلاغ، حاول مرة أخرى.' : 'Could not send the report, please try again.', 'error');
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ar ? 'إبلاغ عن فكرة' : 'Report idea'}
        dir={ar ? 'rtl' : 'ltr'}
        className="w-full max-w-md bg-white rounded-3xl p-5 md:p-6 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-black">{ar ? 'إبلاغ' : 'Report'}</h3>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-3 text-sm font-bold cursor-pointer">
              <input type="radio" name={`report-reason-${rippleId}`} checked={reason === r} onChange={() => setReason(r)} />
              {REASON_LABELS[r][language]}
            </label>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={3}
          maxLength={500}
          placeholder={ar ? 'ملاحظة إضافية (اختياري)' : 'Additional note (optional)'}
          className="w-full rounded-xl border border-[color:var(--tb-sky)]/40 p-3 text-sm outline-none focus:ring-2 focus:ring-lilac"
        />
        <ModerationContactLine language={language} />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={sending} className="px-4 py-2 rounded-xl text-sm font-bold text-ink-mute hover:bg-zinc-100">
            {ar ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={submit} disabled={sending} className="px-5 py-2 rounded-xl text-sm font-bold bg-lilac text-white hover:opacity-90 flex items-center gap-2">
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            {ar ? 'إرسال البلاغ' : 'Send report'}
          </button>
        </div>
      </div>
    </div>
  );
};
