import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, TrendingUp, Target, Activity, Cpu, Radar, Plus, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../AuthProvider';
import { generatePredictiveRadar } from '../../services/gemini';
import { TabHeader } from '../TabHeader';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import { getDemoFixtures } from '../../data/demoFixtures';
import { DnaRing } from '../dna/DnaKit';

/* Display-only: long AI text is clamped to 3 lines with a toggle, never truncated in data. */
const ClampText = ({ text, className, language }: { text: string; className?: string; language: string }) => {
  const [open, setOpen] = useState(false);
  const long = (text || '').length > 160;
  return (
    <div>
      <p className={cn(className, long && !open && 'line-clamp-3')}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="mt-1 text-xs font-bold text-[#6E5B91] hover:underline">
          {open ? (language === 'ar' ? 'إخفاء' : 'Show less') : (language === 'ar' ? 'عرض المزيد' : 'Show more')}
        </button>
      )}
    </div>
  );
};

export const AnalyticsTab = ({ language, handleTabChange }: { language: string, handleTabChange: any }) => {
  const { profile } = useAuth();
  
  const [logs, setLogs] = useState<{date: string, feeling: string, behavior: string}[]>(() => {
    if (IS_DEMO_MODE) return getDemoFixtures(language).analyticsLogs;
    const saved = localStorage.getItem('tebyan_analytics_logs');
    return saved ? JSON.parse(saved) : [];
  });
  
  // العرض: سجلّات النموذج تتبع لغة الواجهة، وما أضافه الزائر يبقى بعدها كما هو.
  React.useEffect(() => {
    if (!IS_DEMO_MODE) return;
    const demo = getDemoFixtures(language).analyticsLogs;
    setLogs(prev => [...demo, ...prev.slice(demo.length)]);
    setPrediction((prev: any) => (prev ? getDemoFixtures(language).prediction : prev));
  }, [language]);

  const [feeling, setFeeling] = useState('');
  const [behavior, setBehavior] = useState('');
  
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<any>(() => (IS_DEMO_MODE ? getDemoFixtures(language).prediction : null));
  const [error, setError] = useState<string | null>(null);

  const stats = [
    { label: language === 'ar' ? 'السجلات' : 'Logs Entered', value: logs.length.toString(), trend: 'جديد', icon: Activity },
    { label: language === 'ar' ? 'التنبؤات' : 'Predictions', value: prediction ? '1' : '0', trend: language === 'ar' ? 'ذكاء اصطناعي' : 'AI', icon: Radar },
  ];

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeling || !behavior) return;
    const newLogs = [...logs, { date: new Date().toLocaleDateString(), feeling, behavior }];
    setLogs(newLogs);
    if (!IS_DEMO_MODE) localStorage.setItem('tebyan_analytics_logs', JSON.stringify(newLogs));
    setFeeling('');
    setBehavior('');
  };

  const handlePredict = async () => {
    if (logs.length === 0) return;
    setIsPredicting(true);
    setError(null);
    if (IS_DEMO_MODE) {
      // العرض: نتيجة جاهزة مبنيّة على سجلّات الأسبوع، بلا استدعاء للذكاء الاصطناعي.
      await new Promise(r => setTimeout(r, 700));
      setPrediction(getDemoFixtures(language).prediction);
      setIsPredicting(false);
      return;
    }
    try {
      const result = await generatePredictiveRadar(logs, language);
      setPrediction(result);
      window.dispatchEvent(new CustomEvent('add_xp', { detail: { amount: 150 } }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="w-full bg-white md:max-h-[85vh] md:overflow-y-auto rounded-[24px] md:rounded-[32px] p-4 md:p-8 shadow-sm border border-zinc-200 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 position-relative md:px-2">
        <TabHeader 
          icon={Radar}
          title={{ ar: 'الرادار الاستباقي', en: 'Predictive Radar' }}
          description={{ 
              ar: 'دون ملاحظاتك السريعة يومياً، ودع الذكاء الاصطناعي يقرأ الأنماط الخفية ويتنبأ بالانفجارات السلوكية قبل حدوثها.', 
              en: 'Log quick daily notes, and let AI read hidden patterns to predict behavioral outbursts before they happen.' 
          }}
          language={language}
          onBack={() => handleTabChange('discover', '')}
          onClose={() => handleTabChange('discover', '', true)}
        />
        
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200/60 pb-8 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Header Content can go here if needed in the future */}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
           {stats.map((stat, idx) => (
               <motion.div
                 key={idx}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className="p-6 rounded-3xl bg-[#faf9f7] border border-[#6e5f8e]/10 flex flex-col relative overflow-hidden group"
               >
                  <div className="w-11 h-11 bg-white rounded-xl border border-[#6e5f8e]/10 flex items-center justify-center mb-6 relative z-10">
                     <stat.icon className="w-5 h-5 text-[#6e5f8e]" strokeWidth={1.75} />
                  </div>
                  <div className="relative z-10 mt-auto">
                      <div className="flex items-end justify-between mb-2">
                         <span className="text-2xl md:text-4xl font-bold text-[#182231]">{stat.value}</span>
                         <span className="text-[#6e5f8e] font-semibold flex items-center gap-1 text-xs bg-[#6e5f8e]/[0.07] px-2.5 py-1 rounded-full">
                           <TrendingUp className="w-3 h-3" />
                           {stat.trend}
                         </span>
                      </div>
                      <span className="text-zinc-500 font-bold text-sm tracking-wide">{stat.label}</span>
                  </div>
               </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
           {/* Logger */}
           <div className="space-y-6">
              <div className="bg-white border rounded-[24px] p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#6E5B91]" />
                  {language === 'ar' ? 'تسجيل حالة اليوم' : 'Log Daily State'}
                </h3>
                <form onSubmit={handleAddLog} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-600 mb-1">{language === 'ar' ? 'المزاج / الشعور' : 'Feeling / Mood'}</label>
                    <input 
                      type="text" 
                      value={feeling} 
                      onChange={e => setFeeling(e.target.value)} 
                      placeholder={language === 'ar' ? 'مثال: منعزل، قلق، غاضب' : 'e.g., Withdrawn, Anxious, Angry'} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#6E5B91] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-600 mb-1">{language === 'ar' ? 'السلوك الملاحظ' : 'Observed Behavior'}</label>
                    <input 
                      type="text" 
                      value={behavior} 
                      onChange={e => setBehavior(e.target.value)} 
                      placeholder={language === 'ar' ? 'مثال: رفض حل الواجب، صراخ' : 'e.g., Refused homework, Yelling'} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-[#6E5B91] transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={!feeling || !behavior} className="flex-1 bg-[#182231] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-[#2a3a52] transition-colors disabled:opacity-50">
                      <Plus className="w-5 h-5" />
                      {language === 'ar' ? 'حفظ السجل' : 'Save Log'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const demoLogs = IS_DEMO_MODE ? getDemoFixtures(language).analyticsLogs : [
                          { date: '2024-05-01', feeling: language === 'ar' ? 'منعزل وصامت' : 'Withdrawn and silent', behavior: language === 'ar' ? 'رفض المشاركة في العشاء' : 'Refused to join dinner' },
                          { date: '2024-05-02', feeling: language === 'ar' ? 'متوتر' : 'Tense', behavior: language === 'ar' ? 'صراخ عند طلب إغلاق الجهاز' : 'Screamed when asked to turn off device' },
                          { date: '2024-05-03', feeling: language === 'ar' ? 'مستفز' : 'Provocative', behavior: language === 'ar' ? 'تجاهل النداء المتكرر' : 'Ignored repeated calls' }
                        ];
                        setLogs(demoLogs);
                        if (!IS_DEMO_MODE) localStorage.setItem('tebyan_analytics_logs', JSON.stringify(demoLogs));
                      }}
                      className="px-4 bg-zinc-100 text-zinc-600 rounded-xl py-3 font-bold hover:bg-zinc-200 transition-colors"
                      title={language === 'ar' ? 'تحميل بيانات تجريبية' : 'Load Demo Data'}
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-zinc-50 border rounded-[24px] p-6 shadow-inner max-h-[300px] overflow-y-auto">
                 <h4 className="font-bold text-zinc-500 mb-4">{language === 'ar' ? 'السجلات النشطة' : 'Active Logs'}</h4>
                 {logs.length === 0 ? (
                   <div className="text-center text-zinc-400 font-medium py-8">{language === 'ar' ? 'لا توجد سجلات بعد.' : 'No logs yet.'}</div>
                 ) : (
                   <ul className="space-y-3">
                     {logs.map((log, i) => (
                       <li key={i} className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm text-sm">
                         <div className="text-xs text-zinc-400 mb-1">{log.date}</div>
                         <div className="font-bold text-[#182231]"><span className="text-zinc-500">{language === 'ar' ? 'شعور:' : 'Feeling:'}</span> {log.feeling}</div>
                         <div className="font-bold text-[#182231] mt-1"><span className="text-zinc-500">{language === 'ar' ? 'سلوك:' : 'Behavior:'}</span> {log.behavior}</div>
                       </li>
                     ))}
                   </ul>
                 )}
              </div>
           </div>

           {/* Predictor */}
           <div className="space-y-6">
              <button 
                onClick={handlePredict} 
                disabled={logs.length === 0 || isPredicting}
                className={cn(
                  "w-full rounded-[24px] py-6 font-black text-xl flex items-center justify-center gap-3 transition-all shadow-sm",
                  logs.length > 0 
                  ? "bg-[#6E5B91] hover:bg-[#5d4f7b] text-white cursor-pointer" 
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                )}
              >
                {isPredicting ? <Cpu className="w-6 h-6 animate-spin" /> : <Radar className="w-6 h-6" />}
                {isPredicting ? (language === 'ar' ? 'جاري التحليل التنبؤي...' : 'Predicting Patterns...') : (language === 'ar' ? 'تشغيل رادار التنبؤ' : 'Run Predictive Radar')}
              </button>

              {error && <div className="text-rose-500 font-bold text-center">{error}</div>}

              <AnimatePresence>
                {prediction && !isPredicting && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#F8F5EF] text-[#182231] p-6 md:p-8 rounded-[24px] border border-[#6E5B91]/15 shadow-sm relative overflow-hidden">
                     <div className="relative z-10 space-y-6">
                       <div className="flex items-start justify-between gap-4 border-b border-[#182231]/10 pb-4">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#5B6E82] mb-1">{language === 'ar' ? 'النمط المكتشف' : 'Discovered Pattern'}</div>
                            <ClampText text={prediction.pattern_found} language={language} className="text-base font-bold text-[#182231] leading-relaxed" />
                          </div>
                          {(() => {
                            const lvl = prediction.risk_level === 'High' ? 3 : prediction.risk_level === 'Medium' ? 2 : prediction.risk_level === 'Low' ? 1 : null;
                            if (lvl == null) return null;
                            const name = language === 'ar' ? (lvl === 3 ? 'مرتفع' : lvl === 2 ? 'متوسط' : 'منخفض') : prediction.risk_level;
                            return (
                              <div className="shrink-0 flex flex-col items-center gap-1">
                                <DnaRing
                                  value={lvl}
                                  max={3}
                                  size={60}
                                  tone={lvl === 3 ? 'danger' : lvl === 2 ? 'amber' : 'mint'}
                                  label={<span dir="ltr">{lvl}/3</span>}
                                  ariaLabel={`${language === 'ar' ? 'مستوى الخطر' : 'Risk level'}: ${name}`}
                                />
                                <span className="text-xs font-bold text-[#5B6E82]">{language === 'ar' ? `الخطر ${name}` : `${name} risk`}</span>
                              </div>
                            );
                          })()}
                       </div>

                       <div>
                          <div className="text-xs font-bold text-[#5B6E82] mb-2">{language === 'ar' ? 'التنبؤ المستقبلي (الخطر القادم)' : 'Future Prediction'}</div>
                          <div className={cn(
                            "p-4 rounded-xl font-bold flex gap-3 text-sm leading-relaxed",
                            prediction.risk_level === 'High' ? 'bg-rose-50 text-rose-900 border border-rose-200' : 
                            prediction.risk_level === 'Medium' ? 'bg-amber-50 text-amber-900 border border-amber-200' : 
                            'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          )}>
                             {prediction.risk_level === 'High' ? <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" /> : <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />}
                             <ClampText text={prediction.prediction} language={language} />
                          </div>
                       </div>

                       <div>
                          <div className="text-xs font-bold text-[#5B6E82] mb-2">{language === 'ar' ? 'نصيحة استباقية وتدخل' : 'Proactive Intervention'}</div>
                          <div className="bg-white p-4 rounded-xl border border-[#6E5B91]/15">
                             <ClampText text={prediction.proactive_warning} language={language} className="text-sm font-bold text-[#273548] leading-relaxed" />
                          </div>
                       </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>

           </div>
        </div>

      </div>
    </div>
  );
};
