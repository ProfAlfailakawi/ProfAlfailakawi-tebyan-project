import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, Shield, LayoutDashboard } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!profile) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <motion.button 
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        className="flex items-center p-1.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all hover:bg-white"
      >
        <div className="relative">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-sm" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
              <UserIcon size={18} />
            </div>
          )}
          {profile.role === 'admin' && (
            <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white p-0.5 rounded-lg shadow-sm border border-white">
              <Shield size={10} strokeWidth={3} />
            </div>
          )}
        </div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full end-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-50 bg-zinc-50/50">
              <p className="text-sm font-bold text-zinc-900 truncate">{profile.displayName || 'مستخدم'}</p>
              <p dir="ltr" className="text-xs text-zinc-500 font-medium capitalize truncate text-end">{profile.email || profile.role}</p>
              
              {!profile.email && (
                <div className="mt-3 flex flex-col gap-2">
                    <input 
                        type="email"
                        placeholder="أدخل بريدك الإلكتروني"
                        className="text-xs p-2 rounded-lg border border-zinc-200 outline-none focus:ring-1 focus:ring-indigo-500"
                        onBlur={async (e) => {
                            if(e.target.value.includes('@')) {
                                try {
                                    const { doc, updateDoc } = await import('firebase/firestore');
                                    await updateDoc(doc(db, 'users', user!.uid), { email: e.target.value });
                                    window.location.reload(); // Refresh to update profile
                                } catch (e) {
                                  console.error("Error saving email", e);
                                }
                            }
                        }}
                    />
                    <p className="text-[10px] text-amber-600 font-bold">أضف بريدك الإلكتروني لتصلك تنبيهات تفاعل الآخرين مع أفكارك.</p>
                </div>
              )}
            </div>

            <div className="p-1.5 flex flex-col gap-1">
              {(profile.role === 'admin' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad')) && (
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin');
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors w-full text-start"
                >
                  <LayoutDashboard size={16} className="text-indigo-500 shrink-0" />
                  <span className="text-sm font-bold flex-1">لوحة التحكم</span>
                </button>
              )}
              
              <button 
                onClick={() => {
                  setIsOpen(false);
                  localStorage.removeItem('tebyan_memory');
                  localStorage.removeItem('tebyan_sage_progress');
                  localStorage.removeItem('tibyan_search_history');
                  localStorage.removeItem('tebyan_search_history');
                  localStorage.removeItem('tebyan_usage_stats');
                  auth.signOut();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 hover:bg-rose-50 hover:text-rose-600 transition-colors w-full text-start group"
              >
                <LogOut size={16} className="group-hover:text-rose-600 text-zinc-400 transition-colors shrink-0" />
                <span className="text-sm font-bold flex-1">تسجيل الخروج</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

