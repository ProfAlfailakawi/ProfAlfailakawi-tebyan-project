import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../AuthProvider';
import {
  ArrowLeft,
  BookmarkX,
  Compass,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TebyanEmptyState } from '../common/TebyanEmptyState';
import {
  LIBRARY_BUCKETS,
  groupByBucket,
  getLastSession,
  removeSession,
  type MemorySession,
} from '../../orchestrator';

type HandleTabChange = (id: string, context?: string) => void;

function timeAgo(at: number, language: string): string {
  const diff = Date.now() - at;
  const day = 1000 * 60 * 60 * 24;
  const ar = language === 'ar';
  if (diff < 1000 * 60 * 60) return ar ? 'قبل قليل' : 'just now';
  if (diff < day) return ar ? 'اليوم' : 'today';
  if (diff < day * 2) return ar ? 'أمس' : 'yesterday';
  const days = Math.floor(diff / day);
  return ar ? `قبل ${days} يوم` : `${days} days ago`;
}

const MyLibraryTab = ({
  language = 'ar',
  handleTabChange,
}: {
  language?: string;
  handleTabChange?: HandleTabChange;
}) => {
  const ar = language === 'ar';
  const { preferences, removeFromLibrary } = useUser();
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const grouped = useMemo(() => groupByBucket(uid), [uid, tick]);
  const last = useMemo(() => getLastSession(uid), [uid, tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {}, [tick]);

  const savedItems = Array.isArray(preferences.savedLibrary)
    ? preferences.savedLibrary
    : [];

  const totalSessions = LIBRARY_BUCKETS.reduce(
    (n, b) => n + (grouped[b.intent]?.length || 0),
    0,
  );
  const isEmpty = totalSessions === 0 && savedItems.length === 0;

  const reopen = (s: MemorySession) => {
    if (!handleTabChange) return;
    if (s.lastTabId) handleTabChange(s.lastTabId, s.query);
    else handleTabChange('home', s.query);
  };

  const removeAndRefresh = (id: string) => {
    removeSession(id);
    refresh();
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6 pb-28" dir={ar ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-1 text-right">
          <h2 className="text-2xl font-black tracking-tight text-[#182231] md:text-3xl">
            {ar ? 'مكتبتي' : 'My library'}
          </h2>
          <p className="text-[13px] font-bold text-[#64788D]">
            {ar
              ? 'كل ما فكّرت فيه مع تبيان، مرتّب حسب حاجتك.'
              : 'Everything you thought through with Tebyan, organised by your need.'}
          </p>
        </div>
      </div>

      {isEmpty ? (
        <TebyanEmptyState
          language={language}
          icon={Sparkles}
          title={ar ? 'مكتبتك تبدأ بأول سؤال' : 'Your library starts with your first question'}
          description={
            ar
              ? 'اكتب ما يشغلك في الصفحة الرئيسية، وسيحفظ تبيان رحلتك هنا لتعود إليها.'
              : 'Write what’s on your mind on the home page, and Tebyan will keep your journey here.'
          }
          actionLabel={ar ? 'اسأل تبيان' : 'Ask Tebyan'}
          onAction={() => handleTabChange?.('home')}
          className="min-h-[380px]"
        />
      ) : (
        <div className="space-y-8">
          {/* Smart resume — one card, remembers where we got to */}
          {last && (
            <section className="rounded-[22px] border border-[#8E7AAE]/16 bg-white/95 p-4 shadow-[0_10px_30px_rgba(24,34,49,0.05)] md:p-5">
              <p className="text-[11px] font-black text-[#8E7AAE]">
                {ar ? 'آخر شيء كنا نعمل عليه' : 'The last thing we worked on'}
              </p>
              <p className="mt-1.5 line-clamp-2 text-[15px] font-black leading-7 text-[#182231]">
                {last.query}
              </p>
              {last.note && (
                <p className="mt-1 line-clamp-2 text-[13px] font-bold leading-6 text-[#64788D]">
                  {ar ? `آخر مرة وصلنا إلى: ${last.note}` : `Last time we reached: ${last.note}`}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => reopen(last)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-[13px] bg-[#182231] px-4 text-[13px] font-black text-white active:scale-[0.98]"
                >
                  {ar ? 'أكمل من هنا' : 'Continue from here'}
                  <ArrowLeft className={cn('h-4 w-4', ar ? '' : 'rotate-180')} />
                </button>
                <span className="text-[11px] font-bold text-[#94A3B5]">
                  {timeAgo(last.at, language)}
                </span>
              </div>
            </section>
          )}

          {/* Intent buckets: أسئلتي / قراراتي / خططي / تجاربي / أفكاري */}
          {LIBRARY_BUCKETS.map((bucket) => {
            const items = grouped[bucket.intent] || [];
            if (items.length === 0) return null;
            return (
              <section key={bucket.intent}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15px] font-black text-[#182231]">
                    {ar ? bucket.ar : bucket.en}
                  </h3>
                  <span className="rounded-full bg-[#F4F0F8] px-2.5 py-1 text-[11px] font-black text-[#6E5F8E]">
                    {items.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.slice(0, 12).map((s) => (
                    <li
                      key={s.id}
                      className="group flex items-center gap-3 rounded-[16px] border border-[#8FA9C7]/14 bg-white px-4 py-3 text-right transition-colors hover:bg-[#FAF9FC]"
                    >
                      <button
                        type="button"
                        onClick={() => reopen(s)}
                        className="flex-1 text-right"
                      >
                        <p className="line-clamp-1 text-[14px] font-black text-[#182231]">
                          {s.query}
                        </p>
                        {s.note && (
                          <p className="mt-0.5 line-clamp-1 text-[12px] font-bold text-[#94A3B5]">
                            {s.note}
                          </p>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => reopen(s)}
                        title={ar ? 'أكمل' : 'Continue'}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#F4F0F8] text-[#6E5F8E] hover:bg-[#8E7AAE] hover:text-white"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAndRefresh(s.id)}
                        title={ar ? 'حذف' : 'Remove'}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-[#B2BCC9] opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {/* Saved results kept from deeper engines */}
          {savedItems.length > 0 && (
            <section>
              <h3 className="mb-3 text-[15px] font-black text-[#182231]">
                {ar ? 'نتائج محفوظة' : 'Saved results'}
              </h3>
              <ul className="space-y-2">
                {savedItems.map((item: any, index: number) => {
                  const title =
                    typeof item === 'string'
                      ? item
                      : item?.question || item?.title || item?.text || '';
                  const tabId = item && typeof item === 'object' ? item.tabId : undefined;
                  return (
                    <li
                      key={index}
                      className="group flex items-center gap-3 rounded-[16px] border border-[#8FA9C7]/14 bg-white px-4 py-3 text-right transition-colors hover:bg-[#FAF9FC]"
                    >
                      <button
                        type="button"
                        onClick={() => tabId && handleTabChange?.(tabId, title)}
                        className="flex-1 text-right"
                      >
                        <p className="line-clamp-2 text-[14px] font-bold text-[#273548]">
                          {title || (ar ? 'عنصر محفوظ' : 'Saved item')}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromLibrary(item)}
                        title={ar ? 'حذف' : 'Remove'}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-[#B2BCC9] opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Quiet path to the advanced toolbox for power users */}
          {handleTabChange && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleTabChange('discover')}
                className="inline-flex items-center gap-2 text-[13px] font-black text-[#94A3B5] transition-colors hover:text-[#182231]"
              >
                <Compass className="h-4 w-4" />
                {ar ? 'استكشف كل أدوات تبيان' : 'Explore all Tebyan tools'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyLibraryTab;
