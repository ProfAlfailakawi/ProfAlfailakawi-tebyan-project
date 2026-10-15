import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تاريخ للعرض بصيغة «20 سبتمبر» (بدون سنة إن كانت الحالية، وبها فيما عداها).
 * يقبل ISO مثل 2026-09-20؛ وما لا يُفهم كتاريخ يُعاد كما هو.
 */
export function formatDisplayDate(raw: unknown, language: string = 'ar'): string {
  if (raw == null || raw === '') return '';
  const text = String(raw).trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])) : new Date(text);
  if (Number.isNaN(d.getTime())) return text;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  try {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-u-nu-latn' : 'en-US', sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return text;
  }
}
