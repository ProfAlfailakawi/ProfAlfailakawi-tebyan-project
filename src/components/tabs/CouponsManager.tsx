import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { TicketPercent, Plus, Trash2, Tag, Percent } from 'lucide-react';
import { cn } from '../../lib/utils';

export const CouponsManager = ({ language }: { language: string }) => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCoupons(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'coupons'), {
        code: code.toUpperCase(),
        discount: Number(discount),
        status: 'active',
        createdAt: serverTimestamp(),
      });
      setCode('');
      setDiscount('');
    } catch (error) {
      console.error(error);
      alert('خطأ أثناء إنشاء الكوبون');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف الكوبون؟')) {
      await deleteDoc(doc(db, 'coupons', id));
    }
  };

  if (loading) return <div className="p-20 text-center text-zinc-400">جاري التحميل...</div>;

  return (
    <div className="w-full flex gap-8">
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-4">{language === 'ar' ? 'الكوبونات النشطة' : 'Active Coupons'}</h3>
        <div className="space-y-4">
          <AnimatePresence>
            {coupons.map(coupon => (
              <motion.div 
                key={coupon.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <TicketPercent className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-xl tracking-wider text-slate-800">{coupon.code}</h4>
                    <p className="text-xs text-zinc-400 font-bold uppercase">{language === 'ar' ? 'خصم:' : 'Discount:'} {coupon.discount}%</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(coupon.id)}
                  className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
            {coupons.length === 0 && (
              <div className="p-10 text-center bg-white border border-dashed rounded-2xl">
                <Tag className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                <p className="font-bold text-zinc-400">{language === 'ar' ? 'لا توجد كوبونات' : 'No coupons found'}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-[350px]">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm sticky top-6">
          <h3 className="font-bold text-lg mb-4">{language === 'ar' ? 'إنشاء كوبون جديد' : 'Create New Coupon'}</h3>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1">{language === 'ar' ? 'كود الخصم' : 'Promo Code'}</label>
              <input 
                type="text" 
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="PROMO20"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono font-bold uppercase text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1">{language === 'ar' ? 'نسبة الخصم (%)' : 'Discount (%)'}</label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 rtl:left-auto rtl:right-4" />
                <input 
                  type="number" 
                  required
                  min="1" max="100"
                  value={discount}
                  onChange={e => setCode(e.target.value)}
                  placeholder="20"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 rtl:pr-10 ltr:pl-10 font-bold text-black"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isAdding}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
            >
              {isAdding ? '...' : <><Plus className="w-4 h-4" /> {language === 'ar' ? 'إنشاء الكوبون' : 'Create Coupon'}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
