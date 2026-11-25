import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { IS_DEMO_MODE } from '../lib/demoMode';
import {
  disableNativePush,
  enableNativePush,
  hasStoredNativeToken,
  isNativePushAvailable,
  readNativePushPermission,
  type NativePushPermission,
} from '../lib/nativePush';

/** مفتاح «فعّل التنبيهات»: داخل تطبيق iOS فقط، ومخفي في المتصفح. */
export default function NativePushToggle() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NativePushPermission>('unsupported');
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const available = isNativePushAvailable();

  useEffect(() => {
    if (!available) return;
    void readNativePushPermission().then((p) => {
      setPermission(p);
      setOn(p === 'granted' && hasStoredNativeToken());
    });
  }, [available]);

  if (!available || !user || IS_DEMO_MODE) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) {
        await disableNativePush();
        setOn(false);
      } else {
        const p = await enableNativePush();
        setPermission(p);
        setOn(p === 'granted' && hasStoredNativeToken());
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-[color:var(--tb-sky)]/15 pt-6" dir="rtl">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="font-bold text-navy flex items-center gap-2">
          <Bell size={16} className="text-[color:var(--tb-sky)]" /> فعّل التنبيهات
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="فعّل التنبيهات"
          disabled={busy}
          onClick={toggle}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? '-translate-x-6' : '-translate-x-1'}`} />
        </button>
      </label>
      <p className="mt-2 text-xs text-ink-mute leading-relaxed">
        {permission === 'denied'
          ? 'التنبيهات موقوفة من إعدادات الجهاز. لتفعيلها افتح الإعدادات ثم تبيان ثم الإشعارات.'
          : 'يصلك تنبيه حين يتفاعل أحدٌ مع أفكارك، وحين تصلك رسالة من إدارة تبيان.'}
      </p>
    </div>
  );
}
