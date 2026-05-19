import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TebyanTooltip } from './TebyanTooltip';

export function MessagesFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message || !email) return;
    
    setIsSending(true);
    try {
      await addDoc(collection(db, 'contact_requests'), {
        name,
        email,
        message,
        source: 'floating_button',
        createdAt: serverTimestamp(),
        status: 'new'
      });
      setIsSent(true);
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setIsSent(false), 500); // reset after closing
      }, 3000);
    } catch(err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 z-[100] h-14 px-6 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="font-bold text-sm tracking-wide">تواصل معنا</span>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-[90] w-[340px] bg-white rounded-[32px] shadow-2xl border border-zinc-200 overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-bold text-lg text-slate-900">أرسل لي رسالة</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-zinc-200 text-zinc-500 hover:text-rose-500 hover:border-rose-200 transition-colors"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>
            {isSent ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="p-10 text-center flex flex-col items-center justify-center gap-4 bg-emerald-50/30"
               >
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                   <motion.div
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                   >
                     <CheckCircle className="w-8 h-8" />
                   </motion.div>
                 </div>
                 <p className="font-black text-xl text-slate-800 tracking-tight">تم إرسال رسالتك!</p>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">شكراً لتواصلك. نقدر وقتك وسنقوم بمراجعة رسالتك قريباً.</p>
               </motion.div>
            ) : (
                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    <div>
                      <input 
                          type="text" 
                          placeholder="اسمك الكريم" 
                          className="w-full p-4 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-zinc-900 placeholder:text-zinc-400 font-medium cursor-text pointer-events-auto"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                      />
                    </div>
                    <div className="relative pointer-events-auto">
                      <input 
                          type="email" 
                          placeholder="البريد الإلكتروني للتواصل" 
                          className="w-full p-4 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-zinc-900 placeholder:text-zinc-400 font-medium cursor-text pointer-events-auto text-right"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          dir="rtl"
                      />
                    </div>
                    <div className="relative pointer-events-auto">
                      <textarea
                          placeholder="اكتب رسالتك أو استفسارك هنا..."
                          className="w-full p-4 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-zinc-900 placeholder:text-zinc-400 font-medium h-32 resize-none leading-relaxed cursor-text pointer-events-auto"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                      />
                    </div>
                    <button 
                        type="submit"
                        disabled={isSending}
                        className="bg-slate-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-70 disabled:bg-slate-800 active:scale-[0.98] transition-all mt-2"
                    >
                        {isSending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                        {!isSending && <Send className="w-4 h-4 rtl:-scale-x-100" />}
                    </button>
                </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
