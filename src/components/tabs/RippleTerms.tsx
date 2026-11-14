import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { MODERATION_EMAIL } from '../../lib/rippleReport';

/**
 * Community terms shown once before a user's first post or reply (App Store 1.2,
 * iOS app only: the caller gates on isAppleNativeShell). Acceptance is kept per
 * account on this device.
 */
const KEY_PREFIX = 'tebyan_ugc_terms_v1_';
const keyFor = (uid?: string | null) => KEY_PREFIX + (uid || 'guest');

export function hasAcceptedUgcTerms(uid?: string | null): boolean {
  try {
    return localStorage.getItem(keyFor(uid)) === '1';
  } catch {
    return false;
  }
}

export function acceptUgcTerms(uid?: string | null): void {
  try {
    localStorage.setItem(keyFor(uid), '1');
  } catch {
    /* storage blocked: the terms are shown again next time */
  }
}

export const RippleTermsDialog = ({ language, onAccept, onCancel }: {
  language: 'ar' | 'en';
  onAccept: () => void;
  onCancel: () => void;
}) => {
  const ar = language === 'ar';
  const points = ar
    ? [
        'لا نسمح بالمحتوى المسيء أو العنيف أو الجنسي أو المزعج أو الذي يتضمن إساءة لأشخاص أو فئات.',
        'يمكنك الإبلاغ عن أي فكرة أو حظر أي مستخدم من الأزرار الموجودة على كل فكرة.',
        'يراجع المشرفون البلاغات ويزيلون المحتوى المخالف، وقد يُوقَف حساب المخالف.',
      ]
    : [
        'Abusive, violent, sexual, spammy or hateful content is not allowed.',
        'You can report any idea or block any user from the buttons on each idea.',
        'Moderators review reports and remove content that breaks these terms; offending accounts may be suspended.',
      ];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ar ? 'شروط المشاركة' : 'Community terms'}
        dir={ar ? 'rtl' : 'ltr'}
        className="w-full max-w-md bg-white rounded-3xl p-5 md:p-6 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-black flex items-center gap-2"><ShieldAlert className="w-5 h-5" aria-hidden="true" />{ar ? 'شروط المشاركة' : 'Community terms'}</h3>
        <ul className="space-y-2 text-sm font-medium list-disc ps-5">
          {points.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <p className="text-xs text-ink-mute font-medium">
          {ar ? 'للتواصل مع المشرفين: ' : 'Contact the moderators: '}
          <a href={`mailto:${MODERATION_EMAIL}`} dir="ltr" className="underline font-bold">{MODERATION_EMAIL}</a>
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-bold text-ink-mute hover:bg-zinc-100">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={onAccept} className="px-5 py-2 rounded-xl text-sm font-bold bg-lilac text-white hover:opacity-90">{ar ? 'أوافق وأتابع' : 'I agree and continue'}</button>
        </div>
      </div>
    </div>
  );
};
