import React from 'react';
import { useAuth } from './AuthProvider';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  console.log("AdminRoute Check:", { user: user?.email, profile, loading });

  const isAdmin = profile?.role === 'admin' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad');

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">جاري التحقق من صلاحياتك... (لحظات)</div>;
  
  if (!user) {
    return <div className="p-10 text-center">
      <h2 className="text-xl font-bold text-red-500 mb-4">You are not logged in.</h2>
      <p>Please log in.</p>
    </div>;
  }

  if (!isAdmin) {
    return <div className="p-10 text-center" dir="ltr">
      <h2 className="text-xl font-bold text-red-500 mb-4">Access Denied</h2>
      <p>Email: {user?.email}</p>
      <p>Role: {profile?.role}</p>
      <p>IsAdmin Boolean: {String(isAdmin)}</p>
    </div>;
  }

  return <>{children}</>;
}
