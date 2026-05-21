import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { Users, Trash2, Edit2, Shield, X, KeyRound, Save, Activity, FileText, Ban, CheckCircle, Award } from 'lucide-react';

export default function AdminUsersDashboard() {
  const { profile, user, loading: authLoading } = useAuth();
  
  const isAuthorized = profile?.role === 'admin' || user?.uid === 'VfYbpLBoYFQGoVyBVOlMfVCESdm1' || user?.email?.toLowerCase() === 'ah_f@hotmail.com' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ 
    displayName: '', 
    role: 'user',
    status: 'active',
    adminNotes: ''
  });
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
    setEditFormData({ 
      displayName: user.displayName || '', 
      role: user.role || 'user',
      status: user.status || 'active',
      adminNotes: user.adminNotes || ''
    });
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
        role: editFormData.role,
        status: editFormData.status,
        adminNotes: editFormData.adminNotes
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
    
    // Allow if either profile role is admin OR email matches hardcoded admins
    const isAdminByEmail = user?.uid === 'VfYbpLBoYFQGoVyBVOlMfVCESdm1' || user?.email?.toLowerCase() === 'ah_f@hotmail.com' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad');
    
    if (profile?.role === 'admin' || isAdminByEmail) {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
        setLoading(false);
        setErrorMsg(null);
      }, (error) => {
        console.error("Error fetching users:", error);
        setErrorMsg(`خطأ في صلاحيات الوصول: ${error.message} (UID: ${user?.uid})`);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [profile, user, authLoading]);

  if (!isAuthorized) return <div className="p-10 text-center">غير مصرح لك بالوصول.</div>;
  
  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-black mb-8 flex items-center gap-3">
        <Users className="w-8 h-8" /> إدارة المستخدمين
      </h1>
      
      {errorMsg && (
        <div className="bg-rose-100 text-rose-900 p-4 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bold">
            {errorMsg}
          </div>
          <button 
            onClick={async () => {
              try {
                setLoading(true);
                const adminRef = doc(db, 'admins', user!.uid);
                await setDoc(adminRef, { 
                  email: user!.email, 
                  registeredAt: new Date().toISOString(),
                  source: 'manual-repair'
                });
                
                const userRef = doc(db, 'users', user!.uid);
                await updateDoc(userRef, { role: 'admin' });
                
                alert('تم تحديث الصلاحيات بنجاح. يرجى تحديث الصفحة.');
                window.location.reload();
              } catch (e: any) {
                console.error(e);
                alert(`فشل الإصلاح التلقائي: ${e.message}`);
              } finally {
                setLoading(false);
              }
            }}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-rose-700 transition-colors shrink-0"
          >
            إصلاح الصلاحيات يدوياً
          </button>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <button 
              onClick={closeEditModal}
              className="absolute top-6 left-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-all font-bold"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black mb-8 border-b pb-4">ملف العميل (Client Profile)</h2>

            <div className="flex flex-col md:flex-row gap-8 mb-8 text-right">
              {/* Profile Sidebar */}
              <div className="flex flex-col items-center min-w-[200px]">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-4xl mb-4 shadow-sm border border-slate-200 relative">
                  {editingUser.photoURL ? (
                    <img src={editingUser.photoURL} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <Users className="w-12 h-12" />
                  )}
                  {editingUser.role === 'admin' && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                      <Shield className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1 text-center">{editingUser.displayName || 'بدون اسم'}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold mb-4 ${editingUser.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                  {editingUser.role === 'admin' ? 'مدير النظام (Admin)' : 'مستخدم (User)'}
                </span>

                <a href={`mailto:${editingUser.email}`} className="text-blue-600 hover:underline text-sm font-bold flex gap-2 items-center">
                  <span dir="ltr">{editingUser.email}</span>
                </a>
                
                {editingUser.createdAt && (
                  <p className="text-xs text-slate-400 mt-4 font-medium text-center">
                    تاريخ الانضمام: <br/> {editingUser.createdAt?.toDate ? editingUser.createdAt.toDate().toLocaleDateString('ar-KW') : 'غير متوفر'}
                  </p>
                )}
              </div>

              {/* Edit Details */}
              <div className="flex-1 space-y-5 pt-2">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-4 shadow-sm">
                  <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" /> نشاط الحساب
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-bold mb-1">تاريخ الانضمام</div>
                      <div className="font-bold text-slate-800 truncate" dir="ltr">
                        {editingUser.createdAt?.toDate ? editingUser.createdAt.toDate().toLocaleDateString('en-GB') : 'غير متوفر'}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-bold mb-1">آخر تسجيل دخول</div>
                      <div className="font-bold text-slate-800 truncate" dir="ltr">
                        {editingUser.lastLogin?.toDate ? editingUser.lastLogin.toDate().toLocaleDateString('en-GB') : 'جديد'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-black text-slate-800 mb-2 border-b pb-2 flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-slate-500" /> بيانات ومسار العميل
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-600 mb-1 block">الاسم</label>
                      <input 
                        type="text" 
                        value={editFormData.displayName}
                        onChange={(e) => setEditFormData({...editFormData, displayName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="اسم العميل"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-bold text-slate-600 mb-1 block">الصلاحية / الدور</label>
                      <div className="relative">
                        <select 
                          value={editFormData.role}
                          onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none pr-10"
                        >
                          <option value="user">مستخدم عادي (User)</option>
                          <option value="admin">مدير نظام (Admin)</option>
                        </select>
                        <Shield className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-600 mb-1 block">حالة الحساب</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setEditFormData({...editFormData, status: 'active'})}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${
                          editFormData.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" /> نشط
                      </button>
                      <button 
                        onClick={() => setEditFormData({...editFormData, status: 'suspended'})}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${
                          editFormData.status === 'suspended' 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Ban className="w-4 h-4" /> موقوف
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-600 mb-1 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> ملاحظات إدارية (خاصة بك)
                    </label>
                    <textarea 
                      value={editFormData.adminNotes}
                      onChange={(e) => setEditFormData({...editFormData, adminNotes: e.target.value})}
                      placeholder="أضف ملاحظات عن العميل مثل: عميل مميز، يحتاج متابعة، الخ..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none h-24"
                    />
                  </div>

                  <div className="pt-4 flex flex-col gap-3 border-t border-slate-100 mt-4">
                    <button 
                      onClick={saveEdit}
                      className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
                    >
                      <Save className="w-5 h-5" /> حفظ التعديلات الشاملة
                    </button>
                    <button 
                      onClick={resetPassword}
                      className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <KeyRound className="w-5 h-5" /> إرسال رابط إعادة تعيين كلمة المرور
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {actionMessage && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl mb-6 text-sm font-bold text-center">
                {actionMessage}
              </div>
            )}

            {/* Answer to the client question */}
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-5 text-right">
               <h4 className="font-black text-amber-900 mb-2 flex items-center gap-2">
                 💡 إجابة على سؤالك
               </h4>
               <p className="text-amber-800 text-sm font-medium leading-relaxed">
                 بخصوص سؤالك: "هل تنصح الرد بالإيميل عليه في نفس المكان كذلك أو عن طريق الإيميل الشخصي؟"
                 <br/><br/>
                 أنصح بأن يكون الرد دائماً <strong>عبر إيميلك الرسمي أو الشخصي مباشرة (مثل Gmail أو Outlook)</strong>، ولا تصمم نظاماً للرد من داخل لوحة التحكم لرسائل الدعم الفني؛ لأن الرد من إيميلك يرسل للعميل شعوراً بأن شخصاً حقيقياً اهتم وقرأ رسالته، بينما الردود الآلية أو المنصات المغلقة أحياناً تفقد هذه اللمسة الإنسانية. لذلك وضعنا لك الإيميل <strong>كرابط قابل للضغط (mailto)</strong> حتى يُفتح لك في تطبيق الإيميل مباشرة للرد.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
