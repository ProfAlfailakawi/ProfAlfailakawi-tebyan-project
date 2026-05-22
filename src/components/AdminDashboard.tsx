import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, DollarSign, Lightbulb, Zap, ArrowRight, BookOpen, Home, RefreshCw, BarChart4, Users, LayoutDashboard, TicketPercent, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TheOrb } from './TheOrb';

interface Suggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface CostStats {
  totalCalls: number;
  aiCalls: number;
  cacheHits: number;
  kbHits: number;
  savedPercentage: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [costStats, setCostStats] = useState<CostStats | null>(null);
  const [topQueries, setTopQueries] = useState<{ query: string, count: number }[]>([]);
  
  useEffect(() => {
    const fetchCostStats = async () => {
      try {
        const q = query(collection(db, 'ai_logs'), orderBy('timestamp', 'desc'), limit(1000));
        const snap = await getDocs(q);
        let ai = 0, cache = 0, kb = 0;
        const queryFreq: Record<string, number> = {};
        
        snap.forEach(doc => {
          const s = doc.data().source;
          const qText = doc.data().promptSnippet;
          
          if (s === 'ai') ai++;
          else if (s === 'kb') kb++;
          else cache++;
          
          if (qText && qText.trim()) {
              const cleanQ = qText.toLowerCase().trim();
              if (cleanQ.length > 5 && !cleanQ.startsWith('{') && !cleanQ.startsWith('based on')) {
                  queryFreq[cleanQ] = (queryFreq[cleanQ] || 0) + 1;
              }
          }
        });
        
        const topList = Object.entries(queryFreq)
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
            
        setTopQueries(topList);
        
        const total = ai + cache + kb;
        const saved = total > 0 ? (((cache + kb) / total) * 100).toFixed(1) : '0';
        setCostStats({ totalCalls: total, aiCalls: ai, cacheHits: cache, kbHits: kb, savedPercentage: saved });
      } catch (err) {
        console.error("Error fetching AI Cost stats", err);
      }
    };
    fetchCostStats();
  }, []);
  
  const valuationMetrics = [
    { title: 'نضج البنية التحتية', value: '٩٥٪', trend: '+٤٪', icon: BookOpen, color: 'text-emerald-600' },
    { title: 'القيمة التجارية المقدرة', value: 'مستقرة', trend: 'نمو مستمر', icon: DollarSign, color: 'text-sky-600' },
    { title: 'جاهزية العرض للاستحواذ', value: '٨٠٪', trend: 'قريباً', icon: TrendingUp, trendColor: 'text-amber-500', color: 'text-indigo-600' },
  ];

  const [genStatus, setGenStatus] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const checkAndAutoGenerate = async () => {
        try {
            const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            
            const statsRef = doc(db, 'system_configs', 'qawl_fasl_gen');
            const snap = await getDoc(statsRef);
            const today = new Date().toISOString().split('T')[0];
            
            if (!snap.exists() || snap.data().lastDailyGen !== today) {
                console.log("Automation: Starting daily 10 questions generation...");
                setIsGenerating(true);
                const { qawlFaslService } = await import('../services/qawlFaslService');
                const result = await qawlFaslService.generateDailyQawlFaslQuestions();
                
                await setDoc(statsRef, { 
                    lastDailyGen: today, 
                    lastResult: result, 
                    updatedAt: serverTimestamp() 
                }, { merge: true });
                
                setGenStatus(result);
            }
        } catch (err) {
            console.error("Auto-generation failed:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    checkAndAutoGenerate();
  }, []);

  const runAIAnalysis = async () => {
    setIsLoading(true);
    setSuggestions([]);
    setError(null);
    try {
      const mockTrafficData = {
        dailyActiveUsers: 500,
        peakUsageHours: "18:00 - 22:00",
        commonFeaturesAccessed: ["Login", "Dashboard", "AI Analysis"],
        dropoffRateAfterLogin: "15%"
      };

      const maxRetries = 3;
      let lastError: any;

      for (let i = 0; i < maxRetries; i++) {
        try {
          const { ai } = await import('../services/gemini');
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Based on this traffic data: ${JSON.stringify(mockTrafficData)}, analyze and provide 3 actionable development suggestions, including new feature ideas or UI/UX improvements (icons, tools, dashboards) to improve user retention and platform value.` }] }],
            config: {
                systemInstruction: `Return ONLY a JSON array of 3 objects, each with 'title', 'description' (string), and 'priority' ('low', 'medium', 'high') fields.
                The response MUST be in Arabic language.`,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      title: { type: 'STRING' },
                      description: { type: 'STRING' },
                      priority: { type: 'STRING' }
                    },
                    required: ["title", "description", "priority"]
                  }
                }
            }
          });
          
          const text = response.text || "[]";
          const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            const parsed = JSON.parse(cleanedText);
            setSuggestions(Array.isArray(parsed) ? parsed : []);
          } catch (pe) {
            console.error("JSON Parsing failed:", cleanedText);
            throw new Error("تنسيق البيانات غير صحيح");
          }
          return; // Success
        } catch (err: any) {
          lastError = err;
          const errorMsg = err.message || JSON.stringify(err);
          const isRetryable = errorMsg.includes('429') || errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('unavailable');
          
          if (isRetryable && i < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 3000 * Math.pow(2, i)));
            continue;
          }
          throw err;
        }
      }
    } catch (err) {
      console.error("AI Analysis Error:", err);
      setError("نعتذر، خوادم الذكاء الاصطناعي مضغوطة قليلاً الآن، لنأخذ استراحة قصيرة ونعاود لاحقاً؟");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
      setIsGenerating(true);
      setError(null);
      setGenStatus(null);
      try {
          const { qawlFaslService } = await import('../services/qawlFaslService');
          const result = await qawlFaslService.generateDailyQawlFaslQuestions();
          setGenStatus(result);
      } catch (err: any) {
          setError(`فشل توليد الأسئلة: ${err.message}`);
      } finally {
          setIsGenerating(false);
      }
  };

  const adminActions = [
      { title: 'إدارة المستخدمين', icon: Users, link: '/?tab=adminusers' },
      { title: 'إدارة قول فصل', icon: LayoutDashboard, link: '/?tab=adminqawlfasl' },
      { title: 'الولاء', icon: TicketPercent, link: '/?tab=loyalty' },
      { title: 'صندوق الوارد', icon: Mail, link: '/?tab=adminmessages' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
        <header className="flex flex-col gap-6 mb-10">
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="flex items-center justify-center p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors font-bold cursor-pointer shadow-sm active:scale-95" title="العودة للرئيسية">
              <Home className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
              {adminActions.map((action, i) => (
                  <button 
                      key={i} 
                      onClick={() => window.location.href = action.link} 
                      className="group bg-white p-4 md:p-8 rounded-[22px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center gap-3 md:gap-4 hover:border-indigo-200 hover:shadow-[0_12px_40px_rgb(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-300 focus:ring-2 focus:ring-indigo-500/50 outline-none active:scale-95 min-h-[132px] md:min-h-0" 
                      title={action.title}
                  >
                      <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center transition-all duration-300">
                          <action.icon className="w-5 h-5 md:w-7 md:h-7" />
                      </div>
                      <span className="font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors text-sm md:text-lg text-center leading-tight">{action.title}</span>
                  </button>
              ))}
          </div>

          <div className="flex justify-between items-center gap-4 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">لوحة تحكم الاستراتيجية والقيمة</h1>
            <div className="flex gap-4">
                <button 
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-emerald-700 transition-all disabled:bg-emerald-300 cursor-pointer"
                title="يتم التوليد تلقائياً كل يوم، يمكن الضغط للمعاودة اليدوية"
                >
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />} 
                    {isGenerating ? 'جاري المعالجة...' : 'توليد يدوي (١٠ مسائل)'}
                </button>
                <button 
                onClick={runAIAnalysis}
                disabled={isLoading}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-slate-800 transition-all disabled:bg-slate-500 cursor-pointer"
                >
                    <Brain className="w-5 h-5" /> {isLoading ? 'جاري التحليل...' : 'تشغيل تحليل الذكاء الاصطناعي'}
                </button>
            </div>
          </div>
        </header>
      
      {error && (
        <div className="bg-rose-100 text-rose-900 p-4 rounded-xl mb-6 font-bold">
            {error}
        </div>
      )}

      {genStatus && (
        <div className="bg-emerald-100 text-emerald-900 p-6 rounded-2xl mb-8 font-bold border border-emerald-200">
            <h3 className="text-lg mb-2">تم اكتمال عملية التوليد بنجاح:</h3>
            <ul className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <li>المتولدة: {genStatus.generated}</li>
                <li>المنشورة: {genStatus.published}</li>
                <li>بانتظار المراجعة: {genStatus.needsReview}</li>
                <li>المتكررة: {genStatus.skipped}</li>
                <li>الأخطاء: {genStatus.errors}</li>
            </ul>
        </div>
      )}
      
      {costStats && (
        <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2"><BarChart4 className="w-6 h-6 text-indigo-500" /> توفير تكلفة الذكاء الاصطناعي (AI Cost Engine)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[32px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
                    <p className="text-slate-500 mb-2 font-bold text-sm tracking-widest uppercase">إجمالي الطلبات</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight">{costStats.totalCalls}</h3>
                </div>
                <div className="bg-white p-8 rounded-[32px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-rose-100 flex flex-col justify-between">
                    <p className="text-rose-400 mb-2 font-bold text-sm tracking-widest uppercase">مكالمات الذكاء الاصطناعي (تكلفة)</p>
                    <h3 className="text-4xl font-black text-rose-600 tracking-tight">{costStats.aiCalls}</h3>
                </div>
                <div className="bg-emerald-50 p-8 rounded-[32px] shadow-[0_4px_20px_rgb(16,185,129,0.05)] border border-emerald-100 flex flex-col justify-between">
                    <p className="text-emerald-600 mb-2 font-bold text-sm tracking-widest uppercase truncate">الطلبات الموفرة (ذاكرة)</p>
                    <h3 className="text-4xl font-black text-emerald-700 tracking-tight">{costStats.cacheHits + costStats.kbHits}</h3>
                </div>
                <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-800 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full scale-150 rotate-45 transform" />
                    <p className="text-slate-400 mb-2 font-bold text-sm tracking-widest uppercase relative z-10">نسبة التوفير الكلية</p>
                    <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight relative z-10">{costStats.savedPercentage}٪</h3>
                </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 font-medium">* يتم استخدام خوارزمية التطابق الدلالي وقاعدة المعرفة لمنع استدعاء API بشكل متكرر على نفس الأسئلة.</p>
            
            {topQueries.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold mb-4 text-slate-800">أكثر الأسئلة والاستعلامات تكراراً (Top 20)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500">
                                    <th className="py-3 px-4 font-medium">الاستعلام (Query)</th>
                                    <th className="py-3 px-4 font-medium w-32">التكرار</th>
                                    <th className="py-3 px-4 font-medium w-48">حالة المعرفة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topQueries.map((q, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4 text-slate-800 font-medium truncate max-w-[300px]">{q.query}</td>
                                        <td className="py-3 px-4 text-slate-600">
                                            <span className="bg-slate-100 text-slate-700 py-1 px-3 rounded-full text-xs font-bold">{q.count} مرات</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {q.count > 3 ? (
                                                <span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><Lightbulb className="w-3 h-3"/> مرشح للإضافة</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs font-bold">عادي</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
      )}
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">اقتراحات التطوير الاستراتيجي (AI Driven)</h2>
        {suggestions.length === 0 && !isLoading && (
            <p className="text-slate-500">اضغط على "تشغيل تحليل الذكاء الاصطناعي" للحصول على اقتراحات.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {suggestions?.map((s, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-4">
              <div className={`${s?.priority === 'high' ? 'bg-rose-500' : s?.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'} p-4 rounded-2xl text-white w-fit`}>
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{s?.title}</h3>
              <p className="text-slate-600 flex-grow">{s?.description}</p>
              <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${s?.priority === 'high' ? 'bg-rose-100 text-rose-700' : s?.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                الأولوية: {s?.priority === 'high' ? 'عالية' : s?.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold mb-8">مؤشرات القيمة والنضج (Valuation)</h2>
            <div className="space-y-6">
                {valuationMetrics.map((sm, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-6 last:border-0 last:pb-0">
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                            <sm.icon className={`w-10 h-10 ${sm.color}`} />
                            <span className="font-bold text-lg">{sm.title}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black">{sm.value}</p>
                            <p className="text-sm text-slate-500 font-bold">{sm.trend}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold mb-6 italic">نصيحة المدير التقني</h2>
            <div className="bg-slate-900 text-white p-6 rounded-2xl">
                <p className="text-lg leading-relaxed">
                    لرفع قيمة التطبيق استعداداً لأي عملية بيع مستقبيلة، ركز في الربع القادم على توثيق الكود البرمجي (Technical Documentation) 
                    بشكل كامل والتحول إلى هيكلية Microservices. هذا سيقلل من Technical Debt ويزيد من جاذبية المنصة للمستثمرين.
                </p>
            </div>
        </div>
      </section>

       <TheOrb 
        onTap={() => navigate('/')}
        onDragUp={() => {}}
        language="ar"
      />
    </div>
  );
}



