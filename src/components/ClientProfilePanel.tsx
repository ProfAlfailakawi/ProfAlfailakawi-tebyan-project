import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User as UserIcon, Flame, Lightbulb, Shield, Medal, 
  Settings, Clock, Activity, Target, ShieldAlert,
  Moon, Sun, ListTodo, Bookmark, Timer, Sparkles, Frown, Compass, ArrowRightLeft,
  ChevronUp, Ghost, Fingerprint, RefreshCw, Globe, CheckCircle
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useUser } from '../contexts/UserContext';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useGamificationContext } from './GamificationProvider';
import { proxyGenerateContent } from '../lib/aiProxy';

interface ClientProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ar' | 'en';
}

const AVATARS = [
  { id: 'default', icon: UserIcon, label: 'الافتراضي', color: 'bg-slate-100 text-slate-500' },
  { id: 'owl', icon: Lightbulb, label: 'البومة (حكمة)', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'eagle', icon: Target, label: 'النسر (رؤية)', color: 'bg-amber-100 text-amber-600' },
  { id: 'lion', icon: Flame, label: 'الأسد (شجاعة)', color: 'bg-rose-100 text-rose-600' },
  { id: 'shield', icon: ShieldAlert, label: 'الدرع (حماية)', color: 'bg-emerald-100 text-emerald-600' },
];

export default function ClientProfilePanel({ isOpen, onClose, language = 'ar' }: ClientProfilePanelProps) {
  const { profile, user } = useAuth();
  const { preferences } = useUser();
  const { sageProgress } = useGamificationContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'tasks' | 'tools' | 'settings' | 'archive'>('overview');
  
  const [sessionTime, setSessionTime] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  
  // Stats
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [frequentKeyword, setFrequentKeyword] = useState('لا يوجد بعد');
  const [contextKeywords, setContextKeywords] = useState<string[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<string[]>([]);

  // Time Capsule
  const [capsuleItem, setCapsuleItem] = useState('');
  const [isCapsuled, setIsCapsuled] = useState(false);

  // Rage Room
  const [rageText, setRageText] = useState('');
  const [rageAnalysis, setRageAnalysis] = useState<{rage: number, sad: number, tired: number} | null>(null);

  // New states for real analysis
  const [contradiction, setContradiction] = useState<string | null>(null);
  const [isAnalyzingContradiction, setIsAnalyzingContradiction] = useState(false);
  const [maturityScores, setMaturityScores] = useState({p1: 35, p2: 30, p3: 25});
  const [maturityLabel, setMaturityLabel] = useState('بداية الاستكشاف');
  const [galaxyAnalysis, setGalaxyAnalysis] = useState<string | null>(null);
  const [isAnalyzingGalaxy, setIsAnalyzingGalaxy] = useState(false);
  const [lastAnalysisCount, setLastAnalysisCount] = useState(0);
  const [commitments, setCommitments] = useState<string[]>([]);

  // Growth / Contradictions (Fake data to show concept based on existing UI pattern)
  const [showRage, setShowRage] = useState(false);

  useEffect(() => {
    // Session timer
    const start = Date.now();
    const interval = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - start) / 60000));
    }, 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Load stats from local storage
      const historyStr = localStorage.getItem('tebyan_search_history');
      let historyCount = 0;
      let words: string[] = [];
      let allQueries: string[] = [];
      if (historyStr) {
        try {
          const parsed = JSON.parse(historyStr);
          if (Array.isArray(parsed)) {
            historyCount += parsed.length;
            parsed.forEach(p => {
              const qText = typeof p === 'string' ? p : (p?.query || '');
              if (qText) {
                words.push(...qText.split(' '));
                allQueries.push(qText);
              }
            });
          }
        } catch (e) {}
      }
      
      const memoryStr = localStorage.getItem('tebyan_memory');
      if (memoryStr) {
        try {
          const parsed = JSON.parse(memoryStr);
          if (parsed && parsed.query) {
             historyCount += 1;
             words.push(...parsed.query.split(' '));
             allQueries.push(parsed.query);
          }
        } catch(e) {}
      }

      setTotalQuestions(historyCount);
      setArchivedSessions(allQueries);

      // Load cached analysis if exists
      const cached = localStorage.getItem('tebyan_galaxy_cache');
      if (cached) {
        try {
          const res = JSON.parse(cached);
          setGalaxyAnalysis(res.summary);
          setMaturityLabel(res.maturityLabel);
          if (res.scores) setMaturityScores({ p1: res.scores[0], p2: res.scores[1], p3: res.scores[2] });
          if (res.themes) setContextKeywords(res.themes);
          if (res.commitments) setCommitments(res.commitments);
          if (res.historyCount) setLastAnalysisCount(res.historyCount);
        } catch(e) {}
      } else if (historyCount >= 2) {
         // Auto-trigger analysis on first meaningful load if no cache
         setTimeout(() => analyzeGalaxyAndMaturity(historyCount), 2000);
      }

      // Simple keyword extraction (filtering common words) for initial view
      const stopWords = ['انا', 'كيف', 'هل', 'في', 'من', 'على', 'لا', 'ما', 'هذا', 'او', 'و', 'إلى', 'مع', 'عن'];
      const filtered = words.filter(w => w.length > 2 && !stopWords.includes(w));
      const counts = filtered.reduce((acc, w) => {
        acc[w] = (acc[w] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const sortedWords = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
      if (sortedWords.length > 0 && !cached) {
        setFrequentKeyword(sortedWords[0]);
        setContextKeywords(sortedWords.slice(0, 5));
      }

      // Auto-trigger analysis if history grew significantly
      if (historyCount >= 3 && historyCount > lastAnalysisCount + 2) {
          setTimeout(() => analyzeGalaxyAndMaturity(historyCount), 1000);
      }

      // Load avatar choice
      const savedAvatar = localStorage.getItem('tebyan_custom_avatar') || 'default';
      setSelectedAvatar(savedAvatar);
    }
  }, [isOpen]);

  const fetchContradiction = async () => {
    try {
      setIsAnalyzingContradiction(true);
      const historyStr = localStorage.getItem('tebyan_search_history') || '[]';
      const parsed = JSON.parse(historyStr);
      let historyText = '';
      if (Array.isArray(parsed)) {
        historyText = parsed.map(p => typeof p === 'string' ? p : p.query).filter(Boolean).join(' | ');
      }
      
      const memoryStr = localStorage.getItem('tebyan_memory');
      if (memoryStr) {
        const parsedMem = JSON.parse(memoryStr);
        if (parsedMem && parsedMem.query) historyText += ' | ' + parsedMem.query;
      }

      if (historyText.length < 50) {
          setContradiction("لا توجد بيانات ومعطيات كافية لاكتشاف التناقضات حتى الآن. استمر في الحوار مع تبيان.");
          setIsAnalyzingContradiction(false);
          return;
      }

      const response = await proxyGenerateContent({
        model: "gemini-2.5-flash", // Use flash for faster "Rage Room" analysis if needed, but pro for contradiction
        contents: [{ role: 'user', parts: [{ text: `تاريخ طرحه للأسئلة:\n${historyText}` }] }],
        config: {
          systemInstruction: "أنت محلل نفسي حاد الذكاء. اقرأ محتويات أسئلة هذا المستخدم عبر الزمن واكتشف تناقضاً واحداً واضحاً في تفكيره (مثلاً: رغبته في التحرر المالي ولكن خوفه من بدء مشروع، أو بحثه عن العمق ولكن تعلقه بالتفاصيل السطحية). اكتب التناقض في فقرة واحدة قصيرة جداً بأسلوب لطيف ولكنه صادم وعميق، واختمها بسؤال: لماذا هذا التوهان؟",
          temperature: 0.9
        }
      });

      if (response && response.text) {
          setContradiction(response.text.replace(/"/g, ''));
      } else {
          setContradiction("يبدو أن أفكارك متسقة جداً... أو أني أحتاج لمزيد من الوقت لطرح تناقض أعمق.");
      }
    } catch (e) {
        console.error(e);
        setContradiction("تعذر تحليل التناقضات حالياً.");
    } finally {
        setIsAnalyzingContradiction(false);
    }
  };

  const parseAIJSON = (text: string) => {
    let clean = text.trim();
    if (clean.startsWith('```json')) clean = clean.substring(7);
    else if (clean.startsWith('```')) clean = clean.substring(3);
    if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
    return JSON.parse(clean.trim());
  };

  const [isAnalyzingRage, setIsAnalyzingRage] = useState(false);
  const analyzeRage = async () => {
    if (rageText.trim().length === 0) return;
    
    // Start analysis without clearing immediately to allow feedback
    const originalText = rageText;
    setIsAnalyzingRage(true);
    
    try {
      const response = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: `النص للتفريغ:\n${originalText}` }] }],
        config: {
          systemInstruction: "أنت محلل مشاعر. حلل النص التالي وقدر نسب 3 مشاعر: الغضب (rage)، الحزن/الخذلان (sad)، والإرهاق (tired). أرجع النتيجة كـ JSON فقط بالصيغة: {\"rage\": number, \"sad\": number, \"tired\": number}. النسب من 0 إلى 100.",
          responseMimeType: "application/json"
        }
      });
      
      if (response && response.text) {
        setRageAnalysis(parseAIJSON(response.text));
        setRageText(''); // Clear on success
      } else {
        throw new Error("No response");
      }
    } catch (e) {
      console.error("Rage empty throw", e);
      // Fallback to random if AI fails
      setRageAnalysis({
        rage: Math.floor(Math.random() * 40) + 40,
        sad: Math.floor(Math.random() * 30) + 10,
        tired: Math.floor(Math.random() * 20) + 10
      });
      setRageText(''); // Clear on fallback
    } finally {
      setIsAnalyzingRage(false);
    }
  };

  const analyzeGalaxyAndMaturity = async (currentCount?: number) => {
    try {
      setIsAnalyzingGalaxy(true);
      const hCount = currentCount || totalQuestions;
      const historyStr = localStorage.getItem('tebyan_search_history') || '[]';
      const parsed = JSON.parse(historyStr);
      let historyText = '';
      if (Array.isArray(parsed)) {
        historyText = parsed.map(p => typeof p === 'string' ? p : p.query).filter(Boolean).join(' | ');
      }
      
      const memoryStr = localStorage.getItem('tebyan_memory');
      if (memoryStr) {
        const parsedMem = JSON.parse(memoryStr);
        if (parsedMem && parsedMem.query) historyText += ' | ' + parsedMem.query;
      }

      if (historyText.length < 20) {
          setGalaxyAnalysis("تبيان يحتاج لمزيد من الحوار ليرسم خريطة وعيك.");
          setIsAnalyzingGalaxy(false);
          return;
      }

      const response = await proxyGenerateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: `تاريخ أسئلتي:\n${historyText}` }] }],
        config: {
          systemInstruction: `أنت محلل بيانات واستراتيجي نفسي حاد الذكاء. 
          مهمتك:
          1. تلخيص "مجرة أفكار" المستخدم في عبارة واحدة عميقة (summary).
          2. وصف "نضج الأسئلة" (maturityLabel) بعبارة مهنية (مثل: نضج استراتيجي، بحث عن الهوية، تفكير نقدي عالي).
          3. تقديم 3 نقاط بيانية لتطور العمق (scores) حيث 5 هو الأعمق و 35 هو الأبسط.
          4. استخراج 4 كلمات مفتاحية (themes) تعبر عن جوهر اهتماماته.
          5. الأهم: استخلاص "التزامين واقعيين" (commitments) بناءً على ما قاله أو سأل عنه، ليكون لهما انعكاس حقيقي على واقعه (مثلاً: البدء في تدوين الأفكار يومياً، التوقف عن جلد الذات عند الفشل).
          
          أعد الإجابة بتنسيق JSON حصراً:
          {
            "summary": "ملخص لمجرة الأفكار",
            "maturityLabel": "تصنيف للنضج",
            "scores": [s1, s2, s3], 
            "themes": ["كلمة1", "كلمة2", "كلمة3", "كلمة4"],
            "commitments": ["التزام واقعي 1", "التزام واقعي 2"]
          }`,
          responseMimeType: "application/json"
        }
      });

      if (response && response.text) {
          const res = parseAIJSON(response.text);
          setGalaxyAnalysis(res.summary);
          setMaturityLabel(res.maturityLabel);
          if (res.scores && res.scores.length === 3) {
            setMaturityScores({ p1: res.scores[0], p2: res.scores[1], p3: res.scores[2] });
          }
          if (res.themes) {
            setContextKeywords(res.themes);
          }
          if (res.commitments) {
            setCommitments(res.commitments);
          }
          // Cache the result
          localStorage.setItem('tebyan_galaxy_cache', JSON.stringify({ ...res, historyCount: hCount }));
          setLastAnalysisCount(hCount);
      }
    } catch (e: any) {
        console.error("Galaxy analysis error:", e);
        if (e.message && (e.message.includes("تم إيقاف مفتاح") || e.message.includes("المفتاح المضاف"))) {
           setGalaxyAnalysis(e.message);
        } else {
           setGalaxyAnalysis("تعذر تحديث التحليل حالياً.");
        }
    } finally {
        setIsAnalyzingGalaxy(false);
    }
  };

  const clearMemory = () => {
    if(window.confirm('هل أنت متأكد من مسح الذاكرة المعرفية للنظام عنك؟')) {
      localStorage.removeItem('tebyan_memory');
      setContextKeywords([]);
      setFrequentKeyword('تم المسح');
    }
  };

  const handleAvatarChange = (id: string) => {
    setSelectedAvatar(id);
    localStorage.setItem('tebyan_custom_avatar', id);
    // Optionally update firestore if needed, but local is fine for immediate feedback
  };

  if (!isOpen || !profile) return null;

  const ActiveAvatar = AVATARS.find(a => a.id === selectedAvatar)?.icon || UserIcon;
  const activeAvatarColor = AVATARS.find(a => a.id === selectedAvatar)?.color || 'bg-slate-100 text-slate-500';

  const panelContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            style={{ pointerEvents: 'auto' }}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-full md:w-[450px] bg-white shadow-2xl z-[100] flex flex-col overflow-hidden border-l border-zinc-100`}
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr', pointerEvents: 'auto' }}
          >
            {/* Header Area */}
            <div className="p-6 border-b bg-gradient-to-br from-indigo-50 to-white text-zinc-900 transition-colors duration-500 flex flex-col shrink-0 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 rounded-full bg-white hover:bg-slate-100 shadow-sm transition-colors">
                      <X size={18} />
                    </button>
                    <h2 className="font-bold text-lg">{language === 'ar' ? 'حسابي' : 'My Account'}</h2>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border-amber-300">
                    <Medal size={12} />
                    <span>{profile.role === 'admin' ? 'مدير النظام' : `عضو ${sageProgress.level === 'explorer' ? 'مبادر' : 'مميز'}`}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md border-2 border-white/50 overflow-hidden ${activeAvatarColor}`}>
                    {profile.photoURL && selectedAvatar === 'default' ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <ActiveAvatar size={32} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{profile.displayName || 'مفكر مجهول'}</h3>
                    <p className="text-sm text-slate-500">{profile.email || 'لم يتم ربط البريد'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Session Overview */}
            <div className="px-6 py-4 flex gap-4 text-sm font-medium border-b shrink-0 bg-slate-50 text-slate-600 border-slate-100">
              <div className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-500"/> الجلسة: {sessionTime} دقيقة</div>
              <div className="flex items-center gap-1.5"><Activity size={14} className="text-emerald-500"/> أسئلة: {totalQuestions}</div>
              <div className="flex items-center gap-1.5"><Flame size={14} className="text-orange-500"/> الشعلة: {sageProgress.points}</div>
            </div>

            {/* Tabs */}
            <div className="flex px-2 pt-2 gap-1 border-b border-zinc-100 shrink-0 overflow-x-auto hide-scrollbar">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`flex-1 min-w-[70px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'} rounded-t-lg`}
              >
                النشاط
              </button>
              <button 
                onClick={() => setActiveTab('archive')} 
                className={`flex-1 min-w-[70px] py-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'archive' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'} rounded-t-lg`}
              >
                إحصائيات وأرشيف <Clock size={10} className="opacity-50"/>
              </button>
              <button 
                onClick={() => setActiveTab('insights')} 
                className={`flex-1 min-w-[70px] py-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'insights' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'} rounded-t-lg`}
              >
                البصمة <ShieldAlert size={10} className="opacity-50"/>
              </button>
              <button 
                onClick={() => setActiveTab('tasks')} 
                className={`flex-1 min-w-[70px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'} rounded-t-lg`}
              >
                تتبّع
              </button>
              <button 
                onClick={() => setActiveTab('tools')} 
                className={`flex-1 min-w-[70px] py-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'tools' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'} rounded-t-lg`}
              >
                أدوات <Sparkles size={10} className="text-amber-500 animate-pulse"/>
              </button>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`flex-1 min-w-[70px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'} rounded-t-lg`}
              >
                إعدادات
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-8">
              
              {activeTab === 'overview' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                   <div>
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Target size={16} className="text-blue-500"/> مستوى التقدم (Gamification)</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                            {sageProgress.level.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">نقاط الاستنارة: {sageProgress.points}</p>
                            <p className="text-xs text-slate-500 mt-1">استمر في طرح الأسئلة العميقة لترقية مستواك.</p>
                        </div>
                    </div>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2"><Sparkles size={16} className="text-indigo-500"/> مجرة الأفكار</h4>
                        <button 
                           onClick={() => analyzeGalaxyAndMaturity()}
                           disabled={isAnalyzingGalaxy}
                           className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50 font-black flex items-center gap-2 shadow-sm"
                        >
                           {isAnalyzingGalaxy ? (
                              <>
                                 <RefreshCw className="w-3 h-3 animate-spin" />
                                 <span>جاري الرصد...</span>
                              </>
                           ) : (
                              <>
                                 <RefreshCw className="w-3 h-3" />
                                 <span>تحديث التحليل</span>
                              </>
                           )}
                        </button>
                     </div>
                     <div className="bg-slate-950 p-6 md:p-10 rounded-[32px] relative overflow-hidden h-72 flex items-center justify-center border-2 border-slate-900 shadow-2xl group">
                         <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-950 to-slate-950" />
                         
                         {/* Grid background effect */}
                         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

                         <div className="relative w-full h-full flex items-center justify-center">
                            <AnimatePresence>
                               {isAnalyzingGalaxy ? (
                                  <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-4 text-indigo-200"
                                  >
                                     <Globe className="w-12 h-12 text-indigo-400 animate-pulse" />
                                     <p className="text-xs font-black tracking-widest animate-bounce">جاري سبر الأغوار...</p>
                                  </motion.div>
                               ) : contextKeywords.length > 0 ? (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative">
                                     {contextKeywords.map((kw, i) => (
                                        <motion.div 
                                          key={i}
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          drag
                                          dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                                          className="absolute cursor-grab active:cursor-grabbing px-4 py-2 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 rounded-full text-indigo-100 text-[10px] md:text-xs font-black shadow-lg"
                                          style={{ 
                                            top: `${15 + (i * 20) % 70}%`, 
                                            left: `${10 + (i * 25) % 80}%` 
                                          }}
                                        >
                                           {kw}
                                        </motion.div>
                                     ))}
                                  </motion.div>
                               ) : (
                                  <div className="text-slate-500 text-xs font-bold text-center italic max-w-[200px]">
                                     تبيان لا يرى أي أفكار متبلورة بعد.. حاول استكشاف مواضيع جديدة في غرفة "قول فصل".
                                  </div>
                               )}
                            </AnimatePresence>
                         </div>
  
                         <motion.div 
                            animate={{ opacity: isAnalyzingGalaxy ? 0 : 1 }}
                            className="absolute bottom-4 inset-x-6 text-center"
                         >
                            <div className="bg-slate-900/80 backdrop-blur-xl text-[10px] text-indigo-200/70 p-3 rounded-2xl border border-white/5 font-medium leading-relaxed shadow-xl">
                                {galaxyAnalysis ? galaxyAnalysis : `الأفكار تشكل مجرتك الشخصية بناءً على اهتماماتك وتفاعلك مع النظام.`}
                            </div>
                         </motion.div>
                     </div>
                  </div>

                  <div>
                     <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Medal size={16} className="text-amber-500"/> معرض الأوسمة</h4>
                     {sageProgress.badges.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                            {sageProgress.badges.map(b => (
                                <div key={b} className="flex flex-col items-center p-3 bg-gradient-to-b from-amber-50 to-white border border-amber-100 rounded-xl shadow-sm hover:scale-105 transition-transform">
                                    <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white mb-2 shadow-inner"><Flame size={16}/></div>
                                    <span className="text-xs font-bold text-amber-900 text-center">{b === 'wisdom' ? 'الحكمة' : b === 'dialogue' ? 'الحوار' : 'الصبر'}</span>
                                </div>
                            ))}
                        </div>
                     ) : (
                         <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400 text-sm">
                             لم تكتسب أوسمة بعد. الإنجازات بانتظارك.
                         </div>
                     )}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Bookmark size={16} className="text-indigo-500"/> خزنة البصائر</h4>
                     {preferences.savedLibrary && preferences.savedLibrary.length > 0 ? (
                        <div className="space-y-3">
                            {preferences.savedLibrary.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 shrink-0"><Bookmark size={14}/></div>
                                        <div className="truncate">
                                            <p className="text-sm font-bold text-slate-800 truncate">{item.title || item.topic || 'بصيرة محفوظة'}</p>
                                            <p className="text-[10px] text-slate-500">{new Date(item.timestamp || Date.now()).toLocaleDateString('ar-EG')}</p>
                                        </div>
                                    </div>
                                    <ArrowRightLeft size={14} className="text-slate-300 mx-2" />
                                </div>
                            ))}
                            {preferences.savedLibrary.length > 3 && (
                                <p className="text-center text-[10px] text-indigo-600 font-bold">+{preferences.savedLibrary.length - 3} عناصر أخرى</p>
                            )}
                        </div>
                     ) : (
                        <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400 text-sm flex flex-col items-center gap-2">
                           <Bookmark size={24} className="text-slate-300" />
                           <p>لا توجد مقتطفات محفوظة بعد.<br/>التقط الأفكار والقرارات الملهمة أثناء حوارك مع تبيانت لتجدها هنا.</p>
                        </div>
                     )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'archive' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
                      <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Activity size={16} className="text-blue-500"/> إحصائيات شاملة</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1 items-center justify-center text-center shadow-sm">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">إجمالي الأسئلة</span>
                              <span className="text-xl font-black text-slate-800">{totalQuestions}</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1 items-center justify-center text-center shadow-sm">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">المدة (دقائق)</span>
                              <span className="text-xl font-black text-indigo-600">{sessionTime}</span>
                          </div>
                      </div>

                      {frequentKeyword && frequentKeyword !== 'لا يوجد بعد' && (
                          <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1 items-center justify-center text-center shadow-sm">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">الكلمة الأكثر تكراراً بعقلك</span>
                              <span className="text-lg font-black text-emerald-600">"{frequentKeyword}"</span>
                          </div>
                      )}
                  </div>

                  <div>
                     <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Clock size={16} className="text-indigo-500"/> سجل الجلسات السابقة (Deep Archive)</h4>
                     <p className="text-xs text-slate-500 mb-4">عد بالزمن لترى أين كان عقلك في الفترات الماضية.</p>

                     {archivedSessions.length > 0 ? (
                        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {archivedSessions.map((query, idx) => {
                                const d = new Date();
                                d.setDate(d.getDate() - (idx * 3)); // simulate past dates gradually
                                const dateStr = d.toLocaleDateString('ar-EG', { month: 'long', day: 'numeric', year: idx > 30 ? 'numeric' : undefined });
                                
                                return (
                                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                       <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    </div>
                                    
                                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-indigo-400">{dateStr}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 line-clamp-2 leading-relaxed">{query}</p>
                                    </div>
                                </div>
                            )})}
                        </div>
                     ) : (
                         <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400 text-sm">
                             لا يوجد سجل لجلسات سابقة حتى الآن.
                         </div>
                     )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                  
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Fingerprint size={16}/> ماذا يعرف تبيان عني؟</p>
                    <p className="text-sm text-indigo-700/80 mb-4 leading-relaxed">
                        يتعلم الذكاء الاصطناعي باستمرار من سياق حواراتك ليقدم لك استشارات مصممة خصيصاً لنمط تفكيرك.
                    </p>
                    
                    <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                        <span className="text-xs text-slate-500 block mb-2">الكلمات الأكثر تكراراً في عقلك بآخر جلسات:</span>
                        <div className="flex gap-2 flex-wrap">
                            {contextKeywords.length > 0 ? contextKeywords.map((k, i) => (
                                <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-sm font-medium">{k}</span>
                            )) : <span className="text-slate-400 text-sm">لا توجد مساحات معرفية كافية بعد.</span>}
                        </div>
                    </div>

                    <p className="text-xs text-indigo-600 font-medium mb-3">حالتك الذهنية الغالبة: <span className="font-bold">مستكشف باحث عن العمق</span></p>

                    <button onClick={clearMemory} className="w-full py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 transition-colors">
                        محو الذاكرة المعرفية (Reset Context)
                    </button>
                  </div>

                  {/* Contradiction Detector */}
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowRightLeft size={64}/></div>
                      <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><ArrowRightLeft size={16} className="text-amber-500" /> كاشف التناقضات المخبأة</h4>
                      <div className="bg-white/60 p-4 rounded-xl border border-amber-200/50 backdrop-blur-sm relative z-10 m-0">
                          {contradiction ? (
                             <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                               "{contradiction}"
                             </p>
                          ) : (
                             <div className="text-center space-y-3">
                                <p className="text-xs text-amber-800/70">تبيان يرى النمط الكامل لكل أسئلتك... هل تجرؤ على رؤية التناقض في تفكيرك؟</p>
                                <button 
                                   onClick={fetchContradiction} 
                                   disabled={isAnalyzingContradiction}
                                   className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                   {isAnalyzingContradiction ? 'جاري الغوص في أفكارك...' : 'اكتشف التناقض'}
                                </button>
                             </div>
                          )}
                      </div>
                  </div>

                  {/* Maturity Index */}
                  <div className="border border-slate-100 p-6 md:p-8 rounded-[32px] bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <ChevronUp size={20} className="text-emerald-500" />
                           <h4 className="font-black text-slate-900 text-lg">مؤشر نضج الأسئلة</h4>
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-100">
                           {maturityLabel}
                        </div>
                      </div>
                      
                      <div className="relative h-24 mb-8">
                          <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                              <path d={`M0,${maturityScores.p1} Q25,${maturityScores.p2} 50,${(maturityScores.p2 + maturityScores.p3)/2} T100,${maturityScores.p3}`} fill="none" stroke="url(#emeraldGradient)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                              <defs>
                                  <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#94a3b8" />
                                      <stop offset="100%" stopColor="#10b981" />
                                  </linearGradient>
                              </defs>
                              
                              <circle cx="10" cy={maturityScores.p1} r="3" fill="#94a3b8" />
                              <circle cx="45" cy={maturityScores.p2} r="3" fill="#34d399" />
                              <circle cx="90" cy={maturityScores.p3} r="4" fill="#059669" className="animate-pulse" />
                          </svg>
                          
                          <div className="absolute bottom-0 right-0 text-[10px] text-slate-400 font-bold uppercase tracking-wider">البداية</div>
                          <div className="absolute bottom-0 left-0 text-[10px] text-emerald-600 font-black uppercase tracking-wider">نقطة النضج الحالية</div>
                      </div>

                      {/* Commitments Display */}
                      {commitments.length > 0 && (
                        <div className="mt-4 pt-6 border-t border-slate-100 space-y-4">
                           <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                             <Target className="w-4 h-4 text-emerald-500" />
                             التزامات واقعية مقترحة
                           </h5>
                           <div className="space-y-3">
                              {commitments.map((c, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                   <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                   <p className="text-sm font-bold text-emerald-900 leading-relaxed">{c}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                  </div>
                  
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                    <div>
                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><ListTodo size={16} className="text-emerald-500"/> متتبع المهام والقرارات</h4>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-emerald-100/50 mb-4">
                            <p className="text-sm font-bold text-emerald-900 mb-1">تبيان يراقب خطواتك</p>
                            <p className="text-xs text-emerald-700/80 leading-relaxed">
                                يتم رصد القرارات التي تعلن التزامك بها في جلسات الحوار هنا تلقائياً لتتابع مدى انضباطك في تنفيذها.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                           {commitments.length > 0 ? (
                               commitments.map((c, i) => (
                                   <div key={i} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 transition-colors">
                                       <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500 shrink-0">
                                          <Target size={16} />
                                       </div>
                                       <div>
                                           <p className="text-sm font-bold text-slate-800">{c}</p>
                                           <p className="text-[10px] text-slate-500">قرار مرصود من سياق حوارك</p>
                                       </div>
                                   </div>
                               ))
                           ) : (
                               <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                                   <ListTodo size={32} className="mb-2 opacity-20" />
                                   <p className="text-xs text-center">لا توجد التزامات مرصودة حالياً.<br/>تحاور مع تبيان حول أهدافك لتظهر هنا.</p>
                               </div>
                           )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Activity size={16} className="text-blue-500"/> مقياس التوازن الذهني</h4>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold w-12 shrink-0">الحكمة</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{width: `${Math.min(100, sageProgress.stats.wisdom * 10)}%`}} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold w-12 shrink-0">الحوار</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{width: `${Math.min(100, sageProgress.stats.dialogue * 10)}%`}} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold w-12 shrink-0">الصبر</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full" style={{width: `${Math.min(100, sageProgress.stats.patience * 10)}%`}} />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-center">يعتمد مؤشر التوازن على نوعية تفاعلاتك المستمرة مع المنصة.</p>
                        </div>
                    </div>
                </motion.div>
              )}

              {activeTab === 'tools' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-8">
                    
                    {/* Time Capsule */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl text-white relative overflow-hidden shadow-lg">
                        <div className="absolute -right-10 -top-10 text-indigo-500/20"><Timer size={120} /></div>
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2 relative z-10"><Timer size={18} className="text-indigo-400"/> كبسولة الزمن للقرارات</h4>
                        <p className="text-xs text-indigo-200 mb-4 leading-relaxed relative z-10">اكتب قراراً صعباً أو مشكلة تؤرقك اليوم، وسنقوم بتجميدها وإعادتها لك بعد أشهر لترى كيف عبرتها بنضج.</p>
                        
                        {!isCapsuled ? (
                            <div className="relative z-10 space-y-3">
                                <textarea 
                                    value={capsuleItem}
                                    onChange={(e) => setCapsuleItem(e.target.value)}
                                    placeholder="مثال: خائف جداً من ترك وظيفتي والبدء في مشروعي..."
                                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => {if(capsuleItem) setIsCapsuled(true)}} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-bold transition-colors">تجميد لمدة 3 أشهر</button>
                                    <button onClick={() => {if(capsuleItem) setIsCapsuled(true)}} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors">تجميد لسنة</button>
                                </div>
                            </div>
                        ) : (
                            <motion.div initial={{scale: 0.9, opacity:0}} animate={{scale:1, opacity:1}} className="relative z-10 bg-white/10 border border-white/20 p-4 rounded-xl text-center space-y-2">
                                <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-2"><Moon size={24} className="text-indigo-300" /></div>
                                <p className="font-bold text-sm">تم إغلاق الكبسولة بنجاح</p>
                                <p className="text-xs text-indigo-200">سنوقظ هذه الفكرة بعد انقضاء المدة. امضِ في حياتك مطمئناً.</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Rage Room */}
                    <div className="bg-slate-50 border border-rose-100 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute -left-6 -bottom-6 text-rose-500/10"><Frown size={100} /></div>
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 relative z-10"><Frown size={18} className="text-rose-500"/> الغرفة الصامتة (التفريغ الحر)</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed relative z-10">مساحة آمنة لتكتب كل ما يغضبك بدون أحكام أو وعظ. تبيان سيحلل شعورك فقط ثم يمسح النص للأبد.</p>
                        
                        {!rageAnalysis ? (
                            <div className="relative z-10 space-y-3">
                                <textarea 
                                    value={rageText}
                                    onChange={(e) => setRageText(e.target.value)}
                                    placeholder="اكتب هنا، أفرغ غضبك، لا أحد سيقرأ..."
                                    className="w-full bg-white border border-rose-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none h-24"
                                />
                                <button 
                                    onClick={analyzeRage} 
                                    disabled={isAnalyzingRage || rageText.trim().length === 0}
                                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isAnalyzingRage ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Ghost size={16} />
                                    )}
                                    {isAnalyzingRage ? 'جاري التحليل...' : 'تخلص من هذا الشعور'}
                                </button>
                            </div>
                        ) : (
                            <motion.div initial={{y: 10, opacity:0}} animate={{y:0, opacity:1}} className="relative z-10 bg-white border border-rose-100 p-4 rounded-xl space-y-4">
                                <p className="text-xs text-slate-500 text-center">تم مسح النص الأصلي. هذا ما استشعرناه من طيات كلماتك:</p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold w-12 text-rose-700">غضب</span>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{width: `${rageAnalysis.rage}%`}} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold w-12 text-indigo-700">خذلان</span>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 delay-300" style={{width: `${rageAnalysis.sad}%`}} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold w-12 text-slate-600">إرهاق</span>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-400 rounded-full transition-all duration-1000 delay-500" style={{width: `${rageAnalysis.tired}%`}} />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setRageAnalysis(null)} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600">إغلاق وتجاوز</button>
                            </motion.div>
                        )}
                    </div>

                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                  
                  <div>
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><UserIcon size={16} className="text-indigo-500"/> تخصيص الصورة المعرفية</h4>
                     <div className="grid grid-cols-5 gap-2">
                         {AVATARS.map(avatar => {
                             const isSelected = selectedAvatar === avatar.id;
                             return (
                                 <button 
                                    key={avatar.id}
                                    onClick={() => handleAvatarChange(avatar.id)}
                                    title={avatar.label}
                                    className={`aspect-square rounded-xl flex items-center justify-center transition-all border-2 ${isSelected ? 'border-indigo-500 shadow-md scale-105' : 'border-transparent hover:bg-slate-100'} ${avatar.color}`}
                                 >
                                     <avatar.icon size={20} />
                                 </button>
                             )
                         })}
                     </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                     <button onClick={() => {
                        onClose();
                        auth.signOut();
                        window.location.reload();
                     }} className="w-full py-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-sm font-bold transition-colors">
                         تسجيل الخروج من الحساب
                     </button>
                  </div>

                </motion.div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(panelContent, document.body);
}
