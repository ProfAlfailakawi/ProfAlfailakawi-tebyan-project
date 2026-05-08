import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';

export const ContactTab = ({ language }: { language: string }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setStatus('submitting');
    
    try {
      // 1. Store in Firestore as the primary reliable database
      await addDoc(collection(db, 'contact_requests'), {
        ...formData,
        language,
        createdAt: serverTimestamp(),
        status: 'new' // To be processed by the admin
      });

      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <TabHeader
        title={{ ar: 'تواصل معنا', en: 'Contact Us' }}
        description={{ ar: 'نحن هنا للإجابة على استفساراتك واقتراحاتك.', en: 'We are here to answer your questions and suggestions.' }}
        icon={Mail}
        language={language}
      />
      
      <div className="bg-white p-8 rounded-[32px] border border-zinc-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 border-b border-l border-zinc-100 rounded-bl-full -mr-20 -mt-20 -z-0"></div>
        
        <div className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-zinc-700 mb-1.5">{language === 'ar' ? 'الاسم' : 'Name'}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder={language === 'ar' ? 'اسمك الكريم' : 'Your name'}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:border-zinc-400 focus:bg-white transition-all text-black"
                />
              </div>
              
              <div>
                <label className="block text-zinc-700 mb-1.5">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder={language === 'ar' ? 'بريدك الإلكتروني للتواصل' : 'Your email for replies'}
                  className="w-full text-left bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:border-zinc-400 focus:bg-white transition-all text-black"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-zinc-700 mb-1.5">{language === 'ar' ? 'الرسالة' : 'Message'}</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder={language === 'ar' ? 'اكتب رسالتك أو استفسارك هنا...' : 'Write your message or inquiry here...'}
                  rows={5}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 outline-none focus:border-zinc-400 focus:bg-white transition-all text-black resize-none"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 rounded-2xl py-4 font-bold transition-colors flex items-center justify-center gap-2"
            >
              {status === 'submitting' ? (
                language === 'ar' ? 'جاري الإرسال...' : 'Sending...'
              ) : (
                <>
                  <Send className="w-5 h-5 rtl:rotate-180" />
                  <span>{language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}</span>
                </>
              )}
            </button>
            
            {status === 'success' && (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="font-semibold text-sm">
                  {language === 'ar' ? 'تم إرسال رسالتك بنجاح! شكراً لتواصلك معنا.' : 'Message sent successfully! Thank you for contacting us.'}
                </p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="bg-rose-50 text-rose-700 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-semibold text-sm">
                {language === 'ar' ? 'حدث تعثر بسيط، أعد المحاولة وسأكمل معك.' : 'A slight glitch occurred, retry and I will continue with you.'}
                </p>
              </div>
            )}
          </form>
          <div className="mt-8 text-center">
            <p className="text-zinc-400 text-xs font-medium">
              {language === 'ar' ? 'سيتم الرد على استفسارك في أقرب وقت ممكن.' : 'Your request will be answered as soon as possible.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
