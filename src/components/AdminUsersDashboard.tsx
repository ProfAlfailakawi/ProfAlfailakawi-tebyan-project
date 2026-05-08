import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { Users, Trash2, Edit2, Shield, X, KeyRound, Save } from 'lucide-react';

export default function AdminUsersDashboard() {
  const { profile, user, loading: authLoading } = useAuth();
  
  const isAuthorized = profile?.role === 'admin' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ displayName: '', role: 'user' });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const deleteUser = async (userId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذه الخطوة.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      // No need to alert success usually as onSnapshot will update the list
    } catch (error: any) {
      console.error(error);
      alert('تعذر حذف العميل، يرجى المحاولة لاحقاً.');
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditFormData({ displayName: user.displayName || '', role: user.role || 'user' });
    setActionMessage(null);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setActionMessage(null);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        displayName: editFormData.displayName,
        role: editFormData.role
      });
      setActionMessage('تم حفظ التعديلات بنجاح.');
      setTimeout(() => closeEditModal(), 1500);
    } catch (error: any) {
      console.error(error);
      setActionMessage('حدث تعثر بسيط في الحفظ، سنحاول مرة أخرى لاحقاً.');
    }
  };

  const resetPassword = async () => {
    if (!editingUser) return;
    try {
      await sendPasswordResetEmail(auth, editingUser.email);
      setActionMessage('تم إرسال رابط وإيميل إلى العميل لتغيير كلمة المرور الخاصة به.');
    } catch (error: any) {
      console.error(error);
      setActionMessage('لم نتمكن من إرسال البريد الآن، يرجى المحاولة لاحقاً.');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (profile?.role === 'admin') {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
        setLoading(false);
        setErrorMsg(null);
      }, (error) => {
        console.error("Error fetching users:", error);
        setErrorMsg(error.message);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [profile, authLoading]);

  if (!isAuthorized) return <div className="p-10 text-center">غير مصرح لك بالوصول.</div>;
  
  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-black mb-8 flex items-center gap-3">
        <Users className="w-8 h-8" /> إدارة المستخدمين
      </h1>
      
      {errorMsg && (
        <div className="bg-rose-100 text-rose-900 p-4 rounded-xl mb-6 font-bold">
          {errorMsg}
        </div>
      )}

      {loading ? <p>جاري تحميل البيانات...</p> : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-right text-sm min-w-[700px]">
              <thead className="bg-slate-100 uppercase text-slate-500 font-bold">
                <tr>
                  <th className="p-4">الاسم</th>
                  <th className="p-4">البريد الإلكتروني</th>
                  <th className="p-4 whitespace-nowrap">الدور</th>
                  <th className="p-4 whitespace-nowrap">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-bold">لا يوجد مستخدمين مسجلين بعد.</td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user.id} className="border-t border-slate-100 whitespace-nowrap">
                      <td className="p-4">{user.displayName || 'لا يوجد اسم'}</td>
                      <td className="p-4 text-left font-mono" dir="ltr">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 flex gap-4 min-w-[120px]">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                          title="تعديل المستخدم"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteUser(user.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="حذف المستخدم"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-xl">
            <button 
              onClick={closeEditModal}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black mb-6">تعديل بيانات العميل</h2>

            <div className="space-y-4 mb-6 text-right">
              <div>
                <label className="text-sm font-bold text-slate-600 mb-1 block">الاسم</label>
                <input 
                  type="text" 
                  value={editFormData.displayName}
                  onChange={(e) => setEditFormData({...editFormData, displayName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold"
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-600 mb-1 block">الدور</label>
                <select 
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold"
                >
                  <option value="user">مستخدم (User)</option>
                  <option value="admin">مدير (Admin)</option>
                </select>
              </div>
            </div>

            {actionMessage && (
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg mb-6 text-sm font-bold text-center">
                {actionMessage}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={saveEdit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" /> حفظ التعديلات
              </button>
              <button 
                onClick={resetPassword}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <KeyRound className="w-5 h-5" /> إرسال رابط تغيير الرقم السري
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
