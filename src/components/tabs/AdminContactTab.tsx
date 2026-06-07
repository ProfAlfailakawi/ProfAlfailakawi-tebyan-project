import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Trash2, Clock, Inbox, CircleDot } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { TabHeader } from '../TabHeader';
import { cn } from '../../lib/utils';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  language: string;
  createdAt: any;
  status: 'new' | 'read';
}

export const AdminContactTab = ({ language }: { language: string }) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'contact_requests'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgsData: ContactMessage[] = [];
      snapshot.forEach((doc) => {
        msgsData.push({ id: doc.id, ...doc.data() } as ContactMessage);
      });
      setMessages(msgsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string, currentStatus: string) => {
    if (currentStatus === 'read') return;
    try {
      await updateDoc(doc(db, 'contact_requests', id), {
        status: 'read'
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contact_requests', id));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const newMessagesCount = messages.filter(m => m.status === 'new').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <TabHeader
          title={{ ar: 'صندوق الوارد', en: 'Inbox' }}
          description={{ ar: 'إدارة رسائل التواصل من المستخدمين', en: 'Manage contact messages from users' }}
          icon={Mail}
          language={language}
        />
        {newMessagesCount > 0 && (
          <div className="bg-rose-100 text-rose-700 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 w-fit">
            <CircleDot className="w-4 h-4 animate-pulse" />
            <span>{newMessagesCount} {language === 'ar' ? 'رسائل جديدة' : 'New messages'}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
            <div className="w-8 h-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin mb-4" />
            <p>{language === 'ar' ? 'جاري تحميل الرسائل...' : 'Loading messages...'}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 md:p-20 text-zinc-400 text-center">
            <Inbox className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium text-lg text-zinc-500">{language === 'ar' ? 'لا توجد رسائل حالياً' : 'No messages yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-4 md:p-6 transition-colors group relative",
                    msg.status === 'new' ? "bg-blue-50/30" : "hover:bg-zinc-50"
                  )}
                  onClick={() => markAsRead(msg.id, msg.status)}
                >
                  {msg.status === 'new' && (
                    <div className="absolute top-6 rtl:right-4 ltr:left-4 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 pl-4 rtl:pr-4 rtl:pl-0">
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-black flex flex-wrap items-center gap-2 leading-snug">
                        {msg.name}
                        {msg.status === 'new' && (
                          <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {language === 'ar' ? 'جديد' : 'New'}
                          </span>
                        )}
                      </h3>
                      <a href={`mailto:${msg.email}`} className="text-sm text-zinc-600 hover:text-black hover:underline font-medium" onClick={e => e.stopPropagation()} dir="ltr">
                        {msg.email}
                      </a>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2">
                      <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : 'Just now'}
                      </span>
                      <div className="flex gap-2">
                        {msg.status === 'new' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(msg.id, msg.status); }}
                            className="p-2 rounded-full text-zinc-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title={language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                          className="p-2 rounded-full text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="pl-4 rtl:pr-4 rtl:pl-0">
                    <p className="text-zinc-800 whitespace-pre-wrap leading-relaxed text-sm bg-white border border-zinc-100 p-4 rounded-xl shadow-sm">
                      {msg.message}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
