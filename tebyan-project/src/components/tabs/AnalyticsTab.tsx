import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, TrendingUp, Target, Activity, Cpu, Radar, Plus, AlertTriangle, ShieldCheck, Printer, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../AuthProvider';
import { generatePredictiveRadar } from '../../services/gemini';
import { TabHeader } from '../TabHeader';

export const AnalyticsTab = ({ language, handleTabChange }: { language: string, handleTabChange: any }) => {
  const { profile } = useAuth();
  
  const [logs, setLogs] = useState<{date: string, feeling: string, behavior: string}[]>([]);
  const [feeling, setFeeling] = useState('');
  const [behavior, setBehavior] = useState('');
  
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = [
    { label: language === 'ar' ? 'مستوى الاستجابة' : 'Response Level', value: '87%', trend: '+5%', icon: Target },
    { label: language === 'ar' ? 'السجلات' : 'Logs Entered', value: logs.length.toString(), trend: 'جديد', icon: Activity },
    { label: language === 'ar' ? 'التنبؤات' : 'Predictions', value: prediction ? '1' : '0', trend: 'AI', icon: Radar },
  ];

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeling || !behavior) return;
    setLogs([...logs, { date: new Date().toLocaleDateString(), feeling, behavior }]);
    setFeeling('');
    setBehavior('');
  };

  const handlePredict = async () => {
    if (logs.length === 0) return;
    setIsPredicting(true);
    setError(null);
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
    <div className="w-full bg-white max-h-[85vh] overflow-y-auto rounded-[32px] p-8 shadow-sm border border-zinc-200 custom-scrollbar print:max-h-none print:overflow-visible">
      <div className="max-w-5xl mx-auto space-y-12 position-relative px-2">
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
          <button 
              onClick={() => window.print()}
              className="absolute top-0 right-0 md:-top-4 md:-right-4 bg-zinc-100 text-black p-3 rounded-full hover:bg-zinc-200 transition-colors shadow-xl print:hidden z-10"
              title={language === 'ar' ? 'استخراج تقرير PDF' : 'Export PDF Report'}
          >
              <Printer className="w-5 h-5" />
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
           {stats.map((stat, idx) => (
               <motion.div
                 key={idx}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col relative overflow-hidden group"
               >
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-12 relative z-10">
                     <stat.icon className="w-6 h-6 text-black" />
                  </div>
                  <div className="relative z-10 mt-auto">
                      <div className="flex items-end justify-between mb-2">
                         <span className="text-2xl md:text-4xl font-black text-black">{stat.value}</span>
                         <span className="text-emerald-500 font-bold flex items-center gap-1 text-sm bg-emerald-50 px-2 py-1 rounded-full">
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
              <div className="bg-white border rounded-[24px] p-6 shadow-sm shadow-black/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
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
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-600 mb-1">{language === 'ar' ? 'السلوك الملاحظ' : 'Observed Behavior'}</label>
                    <input 
                      type="text" 
                      value={behavior} 
                      onChange={e => setBehavior(e.target.value)} 
                      placeholder={language === 'ar' ? 'مثال: رفض حل الواجب، صراخ' : 'e.g., Refused homework, Yelling'} 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={!feeling || !behavior} className="flex-1 bg-black text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-50">
                      <Plus className="w-5 h-5" />
                      {language === 'ar' ? 'حفظ السجل' : 'Save Log'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setLogs([
                          { date: '2024-05-01', feeling: language === 'ar' ? 'منعزل وصامت' : 'Withdrawn and silent', behavior: language === 'ar' ? 'رفض المشاركة في العشاء' : 'Refused to join dinner' },
                          { date: '2024-05-02', feeling: language === 'ar' ? 'متوتر' : 'Tense', behavior: language === 'ar' ? 'صراخ عند طلب إغلاق الجهاز' : 'Screamed when asked to turn off device' },
                          { date: '2024-05-03', feeling: language === 'ar' ? 'مستفز' : 'Provocative', behavior: language === 'ar' ? 'تجاهل النداء المتكرر' : 'Ignored repeated calls' }
                        ]);
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
                         <div className="font-bold text-black"><span className="text-zinc-500">{language === 'ar' ? 'شعور:' : 'Feeling:'}</span> {log.feeling}</div>
                         <div className="font-bold text-black mt-1"><span className="text-zinc-500">{language === 'ar' ? 'سلوك:' : 'Behavior:'}</span> {log.behavior}</div>
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
                  "w-full rounded-[24px] py-6 font-black text-xl flex items-center justify-center gap-3 transition-all shadow-lg",
                  logs.length > 0 
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white cursor-pointer" 
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                )}
              >
                {isPredicting ? <Cpu className="w-6 h-6 animate-spin" /> : <Radar className="w-6 h-6" />}
                {isPredicting ? (language === 'ar' ? 'جاري التحليل التنبؤي...' : 'Predicting Patterns...') : (language === 'ar' ? 'تشغيل رادار التنبؤ' : 'Run Predictive Radar')}
              </button>

              {error && <div className="text-rose-500 font-bold text-center">{error}</div>}

              <AnimatePresence>
                {prediction && !isPredicting && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black text-white p-8 rounded-[24px] shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent"></div>
                     
                     <div className="relative z-10 space-y-6">
                       <div className="flex items-start justify-between border-b border-white/10 pb-4">
                          <div>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{language === 'ar' ? 'النمط المكتشف' : 'Discovered Pattern'}</div>
                            <h3 className="text-xl font-bold text-white leading-relaxed">{prediction.pattern_found}</h3>
                          </div>
                       </div>

                       <div>
                          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'التنبؤ المستقبلي (الخطر القادم)' : 'Future Prediction'}</div>
                          <div className={cn(
                            "p-4 rounded-xl font-bold flex gap-3 text-lg leading-relaxed",
                            prediction.risk_level === 'High' ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30' : 
                            prediction.risk_level === 'Medium' ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30' : 
                            'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                          )}>
                             {prediction.risk_level === 'High' ? <AlertTriangle className="w-6 h-6 shrink-0 text-rose-400 mt-1" /> : <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-400 mt-1" />}
                             <span>{prediction.prediction}</span>
                          </div>
                       </div>

                       <div>
                          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'نصيحة استباقية وتدخل' : 'Proactive Intervention'}</div>
                          <div className="bg-white/10 p-5 rounded-xl border border-white/20">
                             <p className="font-bold text-indigo-100">{prediction.proactive_warning}</p>
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
