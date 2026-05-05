import React from 'react';
import { useAuth } from './AuthProvider';
import { Navigate, useNavigate } from 'react-router-dom';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  console.log("AdminRoute Check:", { user: user?.email, profile, loading });

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad');

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">جاري التحقق من صلاحياتك... (لحظات)</div>;
  
  if (!user) {
    return <div className="flex flex-col items-center justify-center p-10 h-screen w-full bg-slate-50">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">غير مسجل الدخول (Not logged in)</h2>
      <p className="text-slate-500 mb-6">الرجاء تسجيل الدخول للوصول إلى لوحة التحكم.</p>
      <button 
        onClick={() => navigate('/')} 
        className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
      >
        العودة للصفحة الرئيسية لتسجيل الدخول
      </button>
    </div>;
  }

  if (!isAdmin) {
    return <div className="flex flex-col items-center justify-center p-10 h-screen w-full bg-slate-50" dir="ltr">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center mb-6">
          <p className="mb-2"><strong>Email:</strong> {user?.email}</p>
          <p className="mb-2"><strong>Role:</strong> {profile?.role || 'user'}</p>
          <p><strong>IsAdmin Boolean:</strong> {String(isAdmin)}</p>
      </div>
      <button 
        onClick={() => navigate('/')} 
        className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
      >
        Return to Home
      </button>
    </div>;
  }

  return <>{children}</>;
}
