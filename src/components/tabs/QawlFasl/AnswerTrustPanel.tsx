import React, { useEffect, useRef, useState } from 'react';
import { BookMarked, CalendarCheck2, Flag, Loader2, CheckCircle2, UserCheck, X } from 'lucide-react';
import { getAnswerTrust, formatArabicDate } from '../../../lib/qawlTrust';
import { qawlFaslService } from '../../../services/qawlFaslService';
import type { QawlFaslQuestion } from './types';

/**
 * طبقة التحقق لكل جواب في «القول الفصل»: المصادر، من راجعه، آخر مراجعة،
 * وزر «بلّغ عن خطأ». هادئة بصرياً — سطر معلومات لا لوحة صاخبة.
 */
export default function AnswerTrustPanel({ question }: { question: QawlFaslQuestion }) {
  const trust = getAnswerTrust(question);
  const [open, setOpen] = useState(false);

  // Static /qawl/q-* pages link here with ?report=1 to open the form directly.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('report') === '1' && params.get('q') === question.id) setOpen(true);
    } catch { /* ignore */ }
  }, [question.id]);

  return (
    <section
      aria-label="التحقق من الجواب"
      className="dna-surface px-5 py-5 md:px-8 md:py-6"
    >
      <dl className="grid gap-4 sm:grid-cols-2 text-sm">
        {trust.sources.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="flex items-center gap-1.5 text-xs font-black text-[#6E5B91] mb-1.5">
              <BookMarked className="w-3.5 h-3.5" aria-hidden="true" />
              {trust.sources.length > 1 ? 'المصادر' : 'المصدر'}
            </dt>
            <dd>
              <ul className="space-y-1">
                {trust.sources.map((s, i) => (
                  <li key={i} className="font-bold leading-relaxed text-[#465568]">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-[#A68F58]/40 underline-offset-4 hover:text-[#A68F58]">
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-black text-[#6E5B91] mb-1">
            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
            راجعه
          </dt>
          <dd className="font-bold text-[#182231]">{trust.reviewers.join('، ')}</dd>
        </div>
        {trust.reviewedAt && (
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-black text-[#6E5B91] mb-1">
              <CalendarCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
              آخر مراجعة
            </dt>
            <dd className="font-bold text-[#182231]">
              <time dateTime={trust.reviewedAt.toISOString()}>{formatArabicDate(trust.reviewedAt)}</time>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 pt-4 border-t border-dashed border-[#182231]/12 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-bold text-[#64788D]">لاحظت معلومة غير دقيقة؟ نراجع كل بلاغ.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="dna-btn text-xs font-black"
        >
          <Flag className="w-3.5 h-3.5" aria-hidden="true" />
          بلّغ عن خطأ
        </button>
      </div>

      {open && <ReportDialog question={question} onClose={() => setOpen(false)} />}
    </section>
  );
}

function ReportDialog({ question, onClose }: { question: QawlFaslQuestion; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const noteRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    noteRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    try {
      await qawlFaslService.submitAnswerReport({
        questionId: question.id,
        questionTitle: question.question || question.title || '',
        note,
        contact,
      });
      setState('done');
    } catch (err) {
      console.error('[AnswerReport] submit failed:', err);
      setState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-[#182231]/25 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="answer-report-title"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[28px] bg-[#F7F3EE] border border-[#D8C28A]/30 shadow-[0_24px_60px_rgba(24,34,49,0.18)] p-6"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 id="answer-report-title" className="text-lg font-black text-[#182231]">بلّغ عن خطأ</h2>
            <p className="mt-1 text-xs font-bold text-[#64788D] line-clamp-2">{question.question || question.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="shrink-0 w-9 h-9 rounded-full bg-white/80 text-[#64788D] hover:text-[#182231] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {state === 'done' ? (
          <div className="rounded-2xl bg-[#F0F5ED] text-[#4B6B42] px-5 py-4 font-bold text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            شكراً لك، وصل بلاغك وسيراجعه الفريق.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="block text-xs font-black text-[#6E5B91] mb-1.5">ما الذي تراه غير دقيق؟ (اختياري)</span>
              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                rows={4}
                maxLength={1000}
                className="w-full rounded-2xl border border-[#8FA9C7]/25 bg-white px-4 py-3 text-sm text-[#182231] leading-relaxed outline-none focus:border-[#8E7AAE]/60 resize-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-black text-[#6E5B91] mb-1.5">وسيلة تواصل إن أحببت الرد (اختياري)</span>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value.slice(0, 200))}
                maxLength={200}
                inputMode="email"
                autoComplete="email"
                placeholder="بريد أو رقم"
                className="w-full rounded-2xl border border-[#8FA9C7]/25 bg-white px-4 py-2.5 text-sm text-[#182231] outline-none focus:border-[#8E7AAE]/60"
              />
            </label>
            {state === 'error' && (
              <p role="alert" className="text-xs font-bold text-[#A6603F]">تعذّر الإرسال الآن، يرجى المحاولة بعد قليل.</p>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-bold text-[#64788D] hover:bg-white/70">إلغاء</button>
              <button
                type="submit"
                disabled={state === 'sending'}
                className="inline-flex items-center gap-2 rounded-full bg-[#6E5F8E] hover:bg-[#5d4f7a] text-white px-5 py-2 text-sm font-black disabled:opacity-60 transition-colors"
              >
                {state === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
                إرسال البلاغ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
