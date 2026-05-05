import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Filter, ArrowUpDown, MessageSquare, 
  Gift, History, TrendingUp, AlertTriangle, Crown, 
  Clock, DollarSign, Send, ChevronLeft, ChevronRight, 
  ExternalLink, CheckCircle2, MoreHorizontal, Sparkles, X, TicketPercent
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TabHeader } from '../TabHeader';
import { CouponsManager } from './CouponsManager';

interface Customer {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  points: number;
  totalSpent: number;
  lastOrderDate: any;
  status: 'VIP' | 'Active' | 'Inactive' | 'At Risk' | 'New';
  role: string;
}

export const LoyaltyTab = ({ language, handleTabChange }: { language: string, handleTabChange: any }) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'coupons'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' }>({ key: 'points', direction: 'desc' });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Real-time listener for users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data();
        // Calculate status locally if not set (Simulated logic based on data)
        const lastOrder = data.lastOrderDate?.toDate() || new Date(0);
        const diffDays = Math.floor((new Date().getTime() - lastOrder.getTime()) / (1000 * 3600 * 24));
        
        let status: Customer['status'] = 'Active';
        if (data.role === 'admin') status = 'VIP'; // Just an example
        else if (data.points > 1000) status = 'VIP';
        else if (diffDays > 30) status = 'Inactive';
        else if (diffDays > 14) status = 'At Risk';
        else if (data.points === 0) status = 'New';

        return {
          id: d.id,
          displayName: data.displayName || 'Unknown User',
          email: data.email || '',
          phone: data.phone || '05xxxxxxxx',
          points: data.points || 0,
          totalSpent: data.totalSpent || 0,
          lastOrderDate: data.lastOrderDate,
          status: data.status || status,
          role: data.role || 'user'
        } as Customer;
      });
      setCustomers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const matchesSearch = c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (c.phone && c.phone.includes(searchTerm)) || 
                             c.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'All' || c.status === activeFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [customers, searchTerm, activeFilter, sortConfig]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIP': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Inactive': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'At Risk': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getDynamicMessage = (customer: Customer) => {
    const points = customer.points;
    const name = customer.displayName;

    if (customer.status === 'VIP') {
      return `هلا ${name} 👑، أنت من عملائنا المميزين، عندك ${points} نقطة ونبي نكافئك بعرض خاص 🔥`;
    }
    if (customer.status === 'Inactive') {
      return `اشتقنا لك ${name} 😢، لك فترة ما طلبت، جهزنا لك عرض يرجعك لنا 💛`;
    }
    if (points > 800) {
      return `ما شاء الله ${name} 🔥 رصيدك ${points} نقطة! تقدر تستخدمها الآن 🎉`;
    }
    if (points > 400) {
      return `${name} 👀 باقي لك شوي وتوصل للمكافأة! عندك ${points} نقطة 🎁`;
    }
    return `أهلاً ${name} 👋، استمتع بجمع النقاط للحصول على مكافآت حصرية!`;
  };

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen rounded-[32px] p-6 lg:p-10 shadow-sm border border-zinc-200 overflow-hidden flex flex-col font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <TabHeader 
        icon={Users}
        title={{ ar: 'الولاء والكوبونات', en: 'Loyalty & Coupons' }}
        description={{ 
            ar: 'نظام إدارة ولاء العملاء الذكي لرفع نسبةRetention والنمو.', 
            en: 'Smart loyalty management system to increase retention and growth.' 
        }}
        language={language}
        onBack={() => handleTabChange('home')}
      />

      <div className="flex bg-zinc-100 p-1 rounded-2xl w-fit mt-6 mb-2">
        <button 
          onClick={() => setActiveTab('customers')}
          className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'customers' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black")}
        >
          {language === 'ar' ? 'العملاء والولاء' : 'Customers & Loyalty'}
        </button>
        <button 
          onClick={() => setActiveTab('coupons')}
          className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === 'coupons' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black")}
        >
          {language === 'ar' ? 'إدارة الكوبونات' : 'Coupons Management'}
        </button>
      </div>

      {activeTab === 'coupons' ? (
        <CouponsManager language={language} />
      ) : (
        <>
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 mb-8">
        {[
          { label: 'إجمالي العملاء', val: customers.length, color: 'emerald', icon: Users },
          { label: 'متوسط النقاط', val: Math.round(customers.reduce((acc, c) => acc + c.points, 0) / (customers.length || 1)), color: 'indigo', icon: TrendingUp },
          { label: 'العملاء في خطر', val: customers.filter(c => c.status === 'At Risk').length, color: 'rose', icon: AlertTriangle },
          { label: 'عملاء VIP', val: customers.filter(c => c.status === 'VIP').length, color: 'amber', icon: Crown }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-black">{stat.val}</p>
            </div>
            <div className={cn("p-3 rounded-xl", `bg-${stat.color}-50 text-${stat.color}-600`)}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Left Column - List & Controls */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-[24px] border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 rtl:left-auto rtl:right-4" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder={language === 'ar' ? 'بحث باسم العميل أو الهاتف...' : 'Search by name or phone...'}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-12 font-medium focus:border-black transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                {['All', 'VIP', 'Active', 'Inactive', 'At Risk', 'New'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setActiveFilter(f); setCurrentPage(1); }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                      activeFilter === f ? "bg-black text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    {language === 'ar' ? (f === 'All' ? 'الكل' : f) : f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Table/Cards */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-3 custom-scrollbar pr-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 opacity-50">
                  <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-bold">جاري تحميل قاعدة العملاء...</p>
              </div>
            ) : paginatedCustomers.length === 0 ? (
               <div className="text-center p-20 bg-white border border-dashed rounded-[32px]">
                  <Users className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                  <p className="text-zinc-500 font-bold">لا يوجد نتائج تطابق البحث</p>
               </div>
            ) : (
              paginatedCustomers.map((customer) => (
                <motion.div 
                  key={customer.id}
                  layout 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedCustomer(customer)}
                  className={cn(
                    "bg-white p-4 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between text-right",
                    selectedCustomer?.id === customer.id ? "border-black shadow-lg ring-1 ring-black" : "border-zinc-200 hover:border-zinc-300 shadow-sm"
                  )}
                >
                   <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 font-black relative shrink-0">
                         {customer.displayName.charAt(0)}
                         <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white", 
                            customer.status === 'Active' || customer.status === 'VIP' ? 'bg-emerald-500' : 'bg-rose-500'
                         )} />
                      </div>
                      <div className="text-right min-w-0">
                         <h4 className="font-black text-black text-sm truncate">{customer.displayName}</h4>
                         <p className="text-xs text-zinc-400 font-mono" dir="ltr">{customer.phone}</p>
                      </div>
                   </div>

                   <div className="hidden md:flex items-center gap-12 px-6">
                      <div className="text-right">
                         <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{language === 'ar' ? 'النقاط' : 'Points'}</p>
                         <p className="text-sm font-black text-indigo-600">{customer.points.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{language === 'ar' ? 'الإنفاق' : 'Spent'}</p>
                         <p className="text-sm font-black text-black">KWD {customer.totalSpent.toLocaleString()}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black border", getStatusColor(customer.status))}>
                         {language === 'ar' ? customer.status : customer.status}
                      </span>
                      <ChevronLeft className="w-4 h-4 text-zinc-300 group-hover:text-black transition-colors rtl:rotate-0 rotate-180" />
                   </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 rounded-xl bg-zinc-50 text-zinc-500 disabled:opacity-30 hover:bg-zinc-100"
                >
                  <ChevronRight className="w-5 h-5 rtl:rotate-0 rotate-180" />
                </button>
                <span className="text-xs font-black text-zinc-400">{language === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}</span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 rounded-xl bg-zinc-50 text-zinc-500 disabled:opacity-30 hover:bg-zinc-100"
                >
                  <ChevronLeft className="w-5 h-5 rtl:rotate-0 rotate-180" />
                </button>
            </div>
          )}
        </div>

        {/* Right Column - Profile / Details */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
           <AnimatePresence mode="wait">
             {selectedCustomer ? (
               <motion.div
                 key={selectedCustomer.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="bg-white rounded-[32px] border border-zinc-200 shadow-xl overflow-hidden flex flex-col h-full"
               >
                  <div className="p-8 bg-zinc-50 border-b border-zinc-200 relative">
                     <button onClick={() => setSelectedCustomer(null)} className="absolute top-6 left-6 p-2 rounded-full hover:bg-zinc-200 text-zinc-500 transition-colors">
                        <X className="w-4 h-4" />
                     </button>
                     <div className="w-20 h-20 bg-white rounded-[24px] border border-zinc-200 shadow-sm flex items-center justify-center text-4xl mb-4">
                        {selectedCustomer.displayName.charAt(0)}
                     </div>
                     <h3 className="text-2xl font-black text-black">{selectedCustomer.displayName}</h3>
                     <p className="text-zinc-500 font-medium text-sm">{selectedCustomer.email}</p>
                     
                     <div className="flex gap-2 mt-4">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5", getStatusColor(selectedCustomer.status))}>
                           {selectedCustomer.status === 'VIP' && <Crown className="w-3 h-3" />}
                           {selectedCustomer.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-zinc-200 text-zinc-500">iD: {selectedCustomer.id.slice(0, 6)}</span>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                     {/* KPIs */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                           <div className="flex items-center gap-2 text-indigo-600 mb-1">
                              <Gift className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase">{language === 'ar' ? 'النقاط' : 'Points'}</span>
                           </div>
                           <p className="text-xl font-black text-indigo-900">{selectedCustomer.points}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                           <div className="flex items-center gap-2 text-emerald-600 mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase">{language === 'ar' ? 'إجمالي الصرف' : 'Total Spent'}</span>
                           </div>
                           <p className="text-xl font-black text-emerald-900">KWD {selectedCustomer.totalSpent}</p>
                        </div>
                     </div>

                     {/* Smart Messaging */}
                     <div className="space-y-3">
                        <h4 className="text-sm font-black text-zinc-800 flex items-center gap-2">
                           <MessageSquare className="w-4 h-4 text-zinc-400" />
                           {language === 'ar' ? 'الرسائل الذكية المقترحة' : 'Smart Message Suggestions'}
                        </h4>
                        <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 relative group">
                           <p className="text-sm font-medium text-zinc-700 leading-relaxed italic">
                              "{getDynamicMessage(selectedCustomer)}"
                           </p>
                           <button 
                             onClick={() => alert('تم النسخ!')}
                             className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <Send className="w-3 h-3 text-black" />
                           </button>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-bold italic">
                           {language === 'ar' ? 'سيتم إرسال هذه الرسالة عبر WhatsApp أو الإشعارات' : 'This message will be sent via WhatsApp or Push'}
                        </p>
                     </div>

                     {/* History & Tracking */}
                     <div className="space-y-4">
                        <h4 className="text-sm font-black text-zinc-800 flex items-center gap-2">
                           <History className="w-4 h-4 text-zinc-400" />
                           {language === 'ar' ? 'سجل الولاء والكوبونات' : 'Loyalty & Coupon Log'}
                        </h4>
                        <div className="space-y-3">
                           {[
                              { label: 'آخر مكافأة مستخدمة', val: 'خصم 20% - رمضان', date: 'قبل 12 يوم' },
                              { label: 'كوبونات منتهية', val: 'ترحيب جديد', date: 'مارس 2024' },
                              { label: 'نقاط مكتسبة هذا الشهر', val: '+450 نقطة', date: 'نشاط مرتفع' }
                           ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-zinc-50/50 rounded-xl border border-zinc-100">
                                 <div>
                                    <p className="text-xs font-bold text-zinc-800">{item.label}</p>
                                    <p className="text-[10px] text-zinc-400 font-medium">{item.date}</p>
                                 </div>
                                 <span className="text-[10px] font-black text-zinc-500">{item.val}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-zinc-50 border-t border-zinc-200 space-y-3">
                     <button 
                       className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                       onClick={async () => {
                         const pointsToAdd = window.prompt('كم نقطة تريد إضافتها لهذا العميل؟');
                         if (pointsToAdd && !isNaN(Number(pointsToAdd))) {
                           try {
                             await updateDoc(doc(db, 'users', selectedCustomer.id), {
                               points: (selectedCustomer.points || 0) + Number(pointsToAdd)
                             });
                             alert('تم إضافة النقاط بنجاح!');
                           } catch(e) {
                             console.error(e);
                             alert('حدث خطأ أثناء الإضافة');
                           }
                         }
                       }}
                     >
                        <Sparkles className="w-4 h-4" />
                        {language === 'ar' ? 'إضافة نقاط يدوياً' : 'Add Points Manually'}
                     </button>
                     <button 
                       className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
                       onClick={() => window.alert('سيتم فتح نظام المكافآت المتقدم قريباً!')}
                     >
                        <Gift className="w-4 h-4" />
                        {language === 'ar' ? 'إرسال مكافأة فورية' : 'Send Instant Reward'}
                     </button>
                  </div>
               </motion.div>
             ) : (
               <div className="bg-white rounded-[32px] border border-zinc-200 border-dashed h-full flex flex-col items-center justify-center p-10 text-center opacity-40">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                     <Users className="w-10 h-10 text-zinc-200" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-400">{language === 'ar' ? 'اختر عميلاً للمتابعة' : 'Select a customer to view'}</h3>
                  <p className="text-zinc-300 text-sm font-medium mt-2 max-w-[200px]">قم بالضغط على أي عميل من القائمة لعرض تفاصيله ومعالجة حالته</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Dynamic Rewards Configuration (Admin Only Control) */}
      <div className="mt-10 p-8 bg-zinc-900 rounded-[32px] shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px]" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-right">
               <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-black text-amber-400 uppercase tracking-widest">{language === 'ar' ? 'التحكم الذكي بالمكافآت' : 'Intelligent Reward Control'}</span>
               </div>
               <h3 className="text-2xl font-black text-white mb-2">{language === 'ar' ? 'تفعيل المكافآت الديناميكية' : 'Enable Dynamic Rewards'}</h3>
               <p className="text-zinc-400 text-sm max-w-lg font-medium">
                  {language === 'ar' 
                    ? 'عند تفعيل هذا الخيار، سيقوم النظام بتعديل قيمة المكافآت تلقائياً بناءً على وقت نشاط العمل (أوقات الذروة) وحالة العميل.'
                    : 'System will auto-adjust reward values based on business peak hours and customer status.'}
               </p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500">{language === 'ar' ? 'الحالة الحالية' : 'Current Status'}</span>
                  <div className="relative w-16 h-8 bg-white/10 rounded-full p-1 cursor-pointer" onClick={() => window.alert('تم تغيير الوضع!')}>
                     <div className="w-6 h-6 bg-amber-400 rounded-full shadow-lg translate-x-8 rtl:-translate-x-8 transition-transform" />
                  </div>
               </div>
               <button className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                  <MoreHorizontal className="w-4 h-4" />
                  {language === 'ar' ? 'إعدادات متقدمة' : 'Advanced Config'}
               </button>
            </div>
         </div>
      </div>
      </>}
    </div>
  );
};
