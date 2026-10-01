import React from 'react';
import { useAuth } from './AuthProvider';
import { Navigate } from 'react-router-dom';
import { IS_DEMO_MODE } from '../lib/demoMode';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  // العرض: شاشات الإدارة تُفتح ببيانات نموذجية فقط، بلا حساب ولا Firestore.
  if (IS_DEMO_MODE) return <>{children}</>;

  console.log("AdminRoute Check:", { user: user?.email, profile, loading });

  const isAdmin = profile?.role === 'admin' || user?.uid === 'VfYbpLBoYFQGoVyBVOlMfVCESdm1' || user?.email?.toLowerCase() === 'ah_f@hotmail.com' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad');

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">جاري التحقق من صلاحياتك... (لحظات)</div>;
  
  if (!user) {
    return <div className="min-h-dvh p-10 text-center font-sans" dir="rtl">
      <h2 className="text-xl font-bold text-red-500 mb-4">لم تسجّل دخولك بعد.</h2>
      <p>يُرجى تسجيل الدخول للمتابعة.</p>
    </div>;
  }

  if (!isAdmin) {
    return <div className="min-h-dvh p-10 text-center font-sans" dir="rtl">
      <h2 className="text-xl font-bold text-red-500 mb-4">غير مصرّح لك بالدخول</h2>
      <p>البريد الإلكتروني: <span dir="ltr">{user?.email}</span></p>
      <p>الدور: {profile?.role}</p>
      <p>صلاحية المشرف: {isAdmin ? 'نعم' : 'لا'}</p>
    </div>;
  }

  return <>{children}</>;
}
