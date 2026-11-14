import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { auth } from '../lib/firebase';
import { IS_DEMO_MODE } from '../lib/demoMode';
import { deleteMyAccount } from '../lib/deleteAccount';

// App Store 5.1.1(v): in-app account deletion with confirmation + re-authentication.
export default function DeleteAccountSection({ language = 'ar' }: { language?: 'ar' | 'en' }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const en = language === 'en';

  if (!user || IS_DEMO_MODE) return null;
  const usesPassword = user.providerData.some((p) => p.providerId === 'password');

  const confirmDelete = async () => {
    setError(null);
    setBusy(true);
    try {
      await deleteMyAccount(password);
      window.location.reload();
    } catch (err: any) {
      const code = String(err?.code || err?.message || '');
      if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        setError(en ? 'The password is incorrect.' : 'كلمة المرور غير صحيحة.');
      } else if (code.includes('popup-closed')) {
        setError(null);
      } else {
        setError(en ? 'Could not delete the account. Please try again.' : 'تعذّر حذف الحساب. يرجى المحاولة مرة أخرى.');
      }
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-[color:var(--tb-sky)]/15 pt-6">
      <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><Trash2 size={16} className="text-rose-600" /> {en ? 'Delete my account' : 'حذف حسابي'}</h4>
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 transition-colors">
          {en ? 'Delete my account' : 'حذف حسابي'}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-ink-mute leading-relaxed">
            {en
              ? 'This permanently deletes your account, your profile, and the ideas you posted along with their likes. It cannot be undone. Anonymous usage logs that are not linked to your account may be kept, and replies others wrote to your ideas stay with their authors.'
              : 'سيُحذف حسابك نهائياً مع ملفك الشخصي والأفكار التي نشرتها وإعجاباتها، ولا يمكن التراجع عن ذلك. قد تبقى سجلات الاستخدام المجهولة غير المرتبطة بحسابك، وتبقى ردود الآخرين على أفكارك لدى أصحابها.'}
          </p>
          {usesPassword && (
            <input
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={en ? 'Enter your password to confirm' : 'أدخل كلمة المرور للتأكيد'}
              className="w-full px-3 py-2.5 bg-white border border-rose-200 rounded-xl text-sm outline-none focus:border-rose-400"
            />
          )}
          {error && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-3 rounded-xl text-xs font-bold border border-rose-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={confirmDelete}
              disabled={busy || (usesPassword && !password)}
              className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors disabled:bg-zinc-300"
            >
              {en ? 'Delete permanently' : 'حذف نهائي'}
            </button>
            <button
              onClick={() => { setOpen(false); setPassword(''); setError(null); }}
              disabled={busy}
              className="flex-1 py-2.5 bg-slate-100 text-[color:var(--tb-c-3d4a5a)] rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              {en ? 'Cancel' : 'إلغاء'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
