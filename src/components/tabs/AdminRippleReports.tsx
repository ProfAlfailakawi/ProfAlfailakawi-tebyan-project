import React, { useCallback, useEffect, useState } from 'react';
import { Flag, Trash2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { deleteDoc } from '../../lib/firestoreWrites';
import { fetchRippleReports, type RippleReportRow } from '../../lib/rippleReport';

/** قائمة للقراءة فقط ببلاغات الأفكار (App Store 1.2)؛ حذف الفكرة بصلاحية المشرف الحالية في القواعد. */
export const AdminRippleReports = ({ language }: { language: string }) => {
  const ar = language === 'ar';
  const [reports, setReports] = useState<RippleReportRow[]>([]);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setReports(await fetchRippleReports());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const removeRipple = async (rippleId: string) => {
    if (!window.confirm(ar ? 'حذف هذه الفكرة نهائياً؟' : 'Delete this idea permanently?')) return;
    try {
      await deleteDoc(doc(db, 'ripples', rippleId));
      await load();
    } catch (e) {
      console.error('Error deleting ripple:', e);
    }
  };

  return (
    <section className="max-w-4xl mx-auto mt-10 space-y-4" dir={ar ? 'rtl' : 'ltr'}>
      <h2 className="text-xl font-black flex items-center gap-2"><Flag className="w-5 h-5" />{ar ? 'بلاغات الأفكار' : 'Idea reports'}</h2>
      {error && <p className="text-sm text-rose-600 font-bold">{ar ? 'تعذّر تحميل البلاغات.' : 'Could not load reports.'}</p>}
      {!error && reports.length === 0 && <p className="text-sm text-ink-mute">{ar ? 'لا توجد بلاغات.' : 'No reports.'}</p>}
      {reports.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl p-4 border border-[color:var(--tb-sky)]/25 space-y-2 text-sm">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute font-bold" dir="ltr">
            <span>{r.reason}</span>
            <span>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</span>
            <span>idea: {r.rippleId}</span>
            <span>reporter: {r.reporterUid || 'anonymous'}</span>
            <span>author: {r.rippleAuthorId || '-'}</span>
          </div>
          <p className="font-medium">{r.rippleExcerpt}</p>
          {r.note && <p className="text-ink-mute">{r.note}</p>}
          <button onClick={() => removeRipple(r.rippleId)} className="flex items-center gap-2 text-rose-600 font-bold hover:bg-rose-50 px-3 py-1.5 rounded-xl">
            <Trash2 className="w-4 h-4" />{ar ? 'حذف الفكرة' : 'Delete idea'}
          </button>
        </div>
      ))}
    </section>
  );
};
