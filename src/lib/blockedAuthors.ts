import { useEffect, useState } from 'react';
import { auth } from './firebase';

/**
 * «حظر هذا المستخدم» (App Store 1.2): قائمة المؤلفين المحجوبين لكل مستخدم على هذا
 * الجهاز، مفتاحها uid الحاسب (أو guest للزائر). تُصفّى منها كل قوائم الأفكار.
 * لا تمسحها دالة الخروج: الحظر يبقى لصاحبه عند عودته.
 */
const KEY_PREFIX = 'tebyan_blocked_authors_';
const CHANGE_EVENT = 'tebyan-blocked-authors-changed';

const keyFor = (uid?: string | null) => KEY_PREFIX + (uid || 'guest');

export function readBlockedAuthors(uid?: string | null): string[] {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function write(uid: string | null | undefined, list: string[]) {
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify(list));
  } catch {
    /* تخزين محجوب: يبقى الحظر في هذه الجلسة فقط */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function blockAuthor(uid: string | null | undefined, authorId: string): void {
  if (!authorId || authorId === uid) return;
  const list = readBlockedAuthors(uid);
  if (!list.includes(authorId)) write(uid, [...list, authorId]);
}

export function clearBlockedAuthors(uid: string | null | undefined): void {
  write(uid, []);
}

/** المؤلفون المحجوبون للمستخدم الحالي، ويتحدّث عند الحظر أو تبديل الحساب. */
export function useBlockedAuthors(): Set<string> {
  const [uid, setUid] = useState<string | null>(() => auth.currentUser?.uid ?? null);
  const [list, setList] = useState<string[]>(() => readBlockedAuthors(auth.currentUser?.uid));

  useEffect(() => auth.onAuthStateChanged((u) => setUid(u?.uid ?? null)), []);
  useEffect(() => {
    const refresh = () => setList(readBlockedAuthors(uid));
    refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, [uid]);

  return new Set(list);
}
