import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User as UserIcon, Flame, Lightbulb, Shield, Medal, 
  Settings, Clock, Activity, Target, ShieldAlert,
  Moon, Sun, ListTodo, Bookmark, Timer, Sparkles, Frown, Compass, ArrowRightLeft,
  ChevronUp, Ghost, Fingerprint, RefreshCw, Globe, CheckCircle,
  LibraryBig, Network, CircleHelp
} from 'lucide-react';
import { DnaIconTile, DnaRing } from './dna/DnaKit';
import { useAuth } from './AuthProvider';
import { IS_DEMO_MODE, exitDemoMode } from '../lib/demoMode';
import { useUser } from '../contexts/UserContext';
import { auth, db } from '../lib/firebase';
import { doc } from 'firebase/firestore';
import { updateDoc } from '../lib/firestoreWrites';
import { useGamificationContext } from './GamificationProvider';
import { proxyGenerateContent } from '../lib/aiProxy';
import { KnowledgeMemoryService, ThoughtNode } from '../services/knowledgeMemoryService';

interface ClientProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ar' | 'en';
}

const AVATARS = [
  { id: 'default', icon: UserIcon, label: 'الافتراضي', color: 'bg-slate-100 text-ink-mute' },
  { id: 'owl', icon: Lightbulb, label: 'البومة (حكمة)', color: 'bg-lilac-mist text-[#6E5F8E]' },
  { id: 'eagle', icon: Target, label: 'النسر (رؤية)', color: 'bg-amber-100 text-amber-600' },
  { id: 'lion', icon: Flame, label: 'الأسد (شجاعة)', color: 'bg-rose-100 text-rose-600' },
  { id: 'shield', icon: ShieldAlert, label: 'الدرع (حماية)', color: 'bg-emerald-100 text-emerald-600' },
];

export default function ClientProfilePanel({ isOpen, onClose, language = 'ar' }: ClientProfilePanelProps) {
  const { profile, user } = useAuth();
  const { preferences } = useUser();
  const { sageProgress } = useGamificationContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'tasks' | 'tools' | 'settings'>('overview');
  
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
  const [capsuleDue, setCapsuleDue] = useState<string | null>(null);

  const [showAllLibrary, setShowAllLibrary] = useState(false);
  const [showAllArchive, setShowAllArchive] = useState(false);
  const [knowledgeTree, setKnowledgeTree] = useState<ThoughtNode[]>([]);

  // Rage Room
  const [rageText, setRageText] = useState('');
  const [rageAnalysis, setRageAnalysis] = useState<{rage: number | null, sad: number | null, tired: number | null, unavailable?: boolean} | null>(null);

  // New states for real analysis
  const [contradiction, setContradiction] = useState<string | null>(null);
  const [isAnalyzingContradiction, setIsAnalyzingContradiction] = useState(false);
  const [maturityScores, setMaturityScores] = useState({p1: 35, p2: 30, p3: 25});
  const [maturityLabel, setMaturityLabel] = useState('بداية الاستكشاف');
  const [galaxyAnalysis, setGalaxyAnalysis] = useState<string | null>(null);
  const [isAnalyzingGalaxy, setIsAnalyzingGalaxy] = useState(false);
  const [lastAnalysisCount, setLastAnalysisCount] = useState(0);
  const [commitments, setCommitments] = useState<string[]>([]);


  // Handlers to open Library and Knowledge Network tabs from within the profile panel.
  // Dispatch a custom event that App listens to for navigation. Close the panel afterwards.
  const openLibrary = () => {
    try {
      window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'mylibrary' } }));
    } catch (e) {
      // ignore
    }
    onClose();
  };
  const openKnowledge = () => {
    try {
      window.dispatchEvent(new CustomEvent('navigate_tab', { detail: { tab: 'knowledgegraph' } }));
    } catch (e) {
      // ignore
    }
    onClose();
  };

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
      setKnowledgeTree(KnowledgeMemoryService.getMemoryTree());
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
          // العرض: الكلمة المتكررة تؤخذ من تحليل المجرّة المبذور فتكتمل «بصمة التفكير».
          if (IS_DEMO_MODE && res.themes?.length) setFrequentKeyword(res.themes[0]);
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

      if (historyText.length < 5) {
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
      const response = await KnowledgeMemoryService.processUnderstanding(
          originalText,
          "أنت محلل مشاعر. حلل النص التالي وقدر نسب 3 مشاعر: الغضب (rage)، الحزن/الخذلان (sad)، والإرهاق (tired). أرجع النتيجة كـ JSON فقط بالصيغة: {\"rage\": number, \"sad\": number, \"tired\": number}. النسب من 0 إلى 100.",
          { responseMimeType: "application/json" },
          async (prompt, instruction, cfg) => {
              const res = await proxyGenerateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: `النص للتفريغ:\n${prompt}` }] }],
                config: {
                  systemInstruction: instruction,
                  ...cfg
                }
              });
              return res.text || '';
          }
      );
      
      if (response && response.text) {
        const parsedRage = parseAIJSON(response.text);
        const isPct = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
        if (parsedRage && isPct(parsedRage.rage) && isPct(parsedRage.sad) && isPct(parsedRage.tired)) {
          setRageAnalysis(parsedRage);
        } else {
          // Unusable AI output: show a neutral "not enough data" state, never invented numbers.
          setRageAnalysis({ rage: null, sad: null, tired: null, unavailable: true });
        }
        setRageText(''); // Clear on success
        setKnowledgeTree(KnowledgeMemoryService.getMemoryTree()); // Refresh Tree
      } else {
        throw new Error("No response");
      }
    } catch (e) {
      console.error("Rage empty throw", e);
      // AI failed: show a neutral "not enough data" state instead of invented percentages.
      setRageAnalysis({ rage: null, sad: null, tired: null, unavailable: true });
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

      if (historyText.length < 5) {
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

  // يمحو فعلياً كل ما يعتمد عليه هذا اللوح: الذاكرة، السجل، والتحليل المخزّن.
  const clearMemory = () => {
    if(window.confirm('سيتم محو سجل أسئلتك وتحليلها المحفوظ على هذا الجهاز. لا يمكن التراجع. هل تريد المتابعة؟')) {
      ['tebyan_memory', 'tebyan_search_history', 'tebyan_galaxy_cache'].forEach(k => localStorage.removeItem(k));
      setContextKeywords([]);
      setFrequentKeyword('لا يوجد بعد');
      setArchivedSessions([]);
      setTotalQuestions(0);
      setGalaxyAnalysis(null);
      setCommitments([]);
      setLastAnalysisCount(0);
    }
  };

  // كبسولة الزمن: تُحفظ فعلياً بتاريخ فتح، بدل حالة مؤقتة تختفي بإغلاق اللوح.
  const sealCapsule = (months: number) => {
    const text = capsuleItem.trim();
    if (!text) return;
    const due = new Date();
    due.setMonth(due.getMonth() + months);
    try {
      const raw = localStorage.getItem('tebyan_time_capsules');
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? list : [];
      next.push({ text, sealedAt: new Date().toISOString(), dueAt: due.toISOString() });
      localStorage.setItem('tebyan_time_capsules', JSON.stringify(next));
    } catch (e) {
      // تخزين محلي غير متاح — نُبقي التجربة تعمل دون ادعاء الحفظ
    }
    setCapsuleDue(due.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }));
    setIsCapsuled(true);
  };

  const handleAvatarChange = (id: string) => {
    setSelectedAvatar(id);
    localStorage.setItem('tebyan_custom_avatar', id);
    // Optionally update firestore if needed, but local is fine for immediate feedback
  };

  if (!isOpen || !profile) return null;

  const ActiveAvatar = AVATARS.find(a => a.id === selectedAvatar)?.icon || UserIcon;
  const activeAvatarColor = AVATARS.find(a => a.id === selectedAvatar)?.color || 'bg-slate-100 text-ink-mute';

  // بصمة التفكير: تُشتق من بيانات حقيقية فقط، ولا تُعرض كوصف جاهز قبل توفر إشارة كافية.
  const hasEnoughSignal = totalQuestions >= 3 && frequentKeyword !== 'لا يوجد بعد';
  const thinkingSignature = hasEnoughSignal
    ? {
        title: contextKeywords[0] || frequentKeyword,
        note: `تتكرر في ${totalQuestions} سؤال حتى الآن`,
      }
    : {
        title: 'قيد التكوّن',
        note: 'اطرح 3 أسئلة على الأقل لتظهر بصمتك',
      };

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
            className={`fixed top-0 bottom-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-full md:w-[450px] bg-[#FAF9F6] shadow-2xl z-[100] flex flex-col overflow-hidden border-l border-zinc-100`}
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr', pointerEvents: 'auto' }}
          >
            {/* Header Area */}
            <div className="p-6 border-b bg-[radial-gradient(circle_at_top_right,rgba(142,122,174,0.14),transparent_35%),linear-gradient(135deg,#FAF9F6,#F0F4F8)] text-zinc-900 transition-colors duration-500 flex flex-col shrink-0 relative overflow-hidden">
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
                    <h3 className="font-bold text-xl">
                      {profile.displayName && profile.displayName !== 'New User'
                        ? profile.displayName
                        : language === 'ar'
                          ? 'حسابك في تبيان'
                          : 'Your Tebyan account'}
                    </h3>
                    <p className="text-sm text-ink-mute">{profile.email || 'لم يتم ربط البريد'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 px-2 pt-2 gap-1 border-b border-zinc-100 shrink-0">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-[#8E7AAE] text-[#6E5F8E]' : 'border-transparent text-ink-mute hover:text-[#6E5F8E] hover:bg-[#F1EEF4]'} rounded-t-lg`}
              >
                ملخص
              </button>
              <button 
                onClick={() => setActiveTab('tools')} 
                className={`py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'tools' || activeTab === 'tasks' ? 'border-[#8E7AAE] text-[#6E5F8E]' : 'border-transparent text-ink-mute hover:text-[#6E5F8E] hover:bg-[#F1EEF4]'} rounded-t-lg`}
              >
                حفظ وتتبّع
              </button>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-[#8E7AAE] text-[#6E5F8E]' : 'border-transparent text-ink-mute hover:text-[#6E5F8E] hover:bg-[#F1EEF4]'} rounded-t-lg`}
              >
                إعدادات
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#FAF9F6] space-y-8">
              
              {activeTab === 'overview' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                  <div className="tebyan-intellectual-gradient border border-[#8E7AAE]/15 rounded-[28px] p-5 shadow-[0_18px_55px_rgba(24,34,49,0.06)] relative overflow-hidden">
                    <div className="absolute -top-12 -left-12 w-40 h-40 bg-[#8FA9C7]/14 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/80 border border-[#8E7AAE]/15 text-[#6E5F8E] flex items-center justify-center shadow-sm">
                          <Fingerprint size={22} />
                        </div>
                        <div>
                          <h4 className="font-black text-navy">بطاقة الهوية المعرفية</h4>
                          <p className="text-xs text-ink-mute font-bold mt-1">بصمتك الفكرية كما تظهر من استخدامك لتبيان.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white/70 border border-white/70 rounded-2xl p-3">
                          <div className="text-xs text-ink-mute font-black uppercase mb-1">نشاطي الفكري</div>
                          <div className="text-sm font-black text-navy">{totalQuestions} سؤال · {preferences.savedLibrary?.length || 0} محفوظ · {sessionTime} د</div>
                          <div className="text-xs text-ink-mute mt-1">
                            {hasEnoughSignal
                              ? `أبرز كلمة متكررة: "${frequentKeyword}"`
                              : 'لم تتراكم أسئلة كافية لقراءة نمطك بعد'}
                          </div>
                        </div>
                        <div className="bg-white/70 border border-white/70 rounded-2xl p-3">
                          <div className="text-xs text-ink-mute font-black uppercase mb-1">بصمة التفكير</div>
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-[#8E7AAE]/10 border border-[#8E7AAE]/15 flex items-center justify-center text-[#6E5F8E] tebyan-breathe">
                              <Compass size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-black text-navy break-words md:truncate">{thinkingSignature.title}</div>
                              <div className="text-xs text-ink-mute">{thinkingSignature.note}</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/70 border border-white/70 rounded-2xl p-3 sm:col-span-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs text-ink-mute font-black uppercase mb-1">التقدم</div>
                              <div className="text-sm font-black text-navy">نقاط الاستنارة: {sageProgress.points}</div>
                              <div className="text-xs text-ink-mute mt-1">كلما زادت الأسئلة النوعية، اتضحت بصمتك أكثر.</div>
                            </div>
                            <div className="w-12 h-12 rounded-full border-4 border-[#8E7AAE]/18 flex items-center justify-center text-[#6E5F8E] font-black bg-white">
                              {sageProgress.level.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
	                  <div>
                     <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><Medal size={16} className="text-[#8E7AAE]"/> معرض الأوسمة</h4>
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
                         <div className="text-center p-6 bg-[#F7F5F2] rounded-2xl border border-[#8FA9C7]/15 border-dashed text-ink-mute text-sm">
                             لم تكتسب أوسمة بعد. الإنجازات بانتظارك.
                         </div>
                     )}
                  </div>

                  <div>
                    <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><Bookmark size={16} className="text-[#8E7AAE]"/> الذاكرة المعرفية (Insights Vault)</h4>
                     {knowledgeTree && knowledgeTree.length > 0 ? (
                        <div className="space-y-4">
                            {knowledgeTree.slice(0, showAllLibrary ? undefined : 3).map((item, idx) => (
                                <div key={item.id || idx} className="p-4 bg-white border border-[#8FA9C7]/15 rounded-xl shadow-sm hover:border-lilac-soft transition-colors">
                                    <div className="flex items-start gap-3 w-full">
                                        <div className="p-2 bg-[#F1EEF4] rounded-lg text-[#8E7AAE] shrink-0 mt-1"><Bookmark size={14}/></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#273548] break-words leading-tight mb-1">{item.mainTopic}</p>
                                            <p className="text-xs text-ink-soft line-clamp-2 mb-2 bg-[#F7F5F2] p-2 rounded-lg break-words">الفكرة: {item.originalText}</p>
                                            
                                            {item.variants && item.variants.length > 0 && (
                                                <div className="mt-3 pl-2 border-r-2 border-[#8E7AAE]/18 mr-2 pr-3">
                                                    <p className="text-xs font-bold text-[#8E7AAE] mb-1">امتدادات وتفاصيل جديدة:</p>
                                                    <div className="space-y-2">
                                                        {item.variants.map(v => (
                                                            <div key={v.id} className="text-xs bg-[#F1EEF4]/50 p-2 rounded text-[#3D4A5A] flex flex-col gap-1">
                                                                <span className="font-medium">"{v.originalText}"</span>
                                                                {(v.ageMentioned || v.riskLevel !== 'medium') && (
                                                                  <div className="flex gap-2 text-xs text-[#8E7AAE]">
                                                                    {v.ageMentioned && <span>العمر: {v.ageMentioned}</span>}
                                                                    {v.riskLevel !== 'medium' && <span>المستوى: {v.riskLevel}</span>}
                                                                  </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-end mt-2 pt-2 border-t border-slate-50">
                                        <p className="text-xs text-ink-mute font-medium">الاستخدامات: {item.usageCount || 1}</p>
                                    </div>
                                </div>
                            ))}
                            {!showAllLibrary && knowledgeTree.length > 3 && (
                                <button onClick={() => setShowAllLibrary(true)} className="w-full text-center text-xs text-[#6E5F8E] hover:text-lilac-deep font-bold py-3 bg-[#F1EEF4] rounded-xl transition-colors">
                                    +{knowledgeTree.length - 3} أفكار وحالات أخرى - فتح الذاكرة كاملة
                                </button>
                            )}
                            {showAllLibrary && knowledgeTree.length > 3 && (
                                <button onClick={() => setShowAllLibrary(false)} className="w-full text-center text-xs text-ink-soft hover:text-[#273548] font-bold py-3 bg-slate-100 rounded-xl transition-colors">
                                    إخفاء العناصر الإضافية
                                </button>
                            )}
                        </div>
                     ) : (
                        <div className="text-center p-6 bg-[#F7F5F2] rounded-2xl border border-[#8FA9C7]/15 border-dashed text-ink-mute text-sm flex flex-col items-center gap-2">
                           <Bookmark size={24} className="text-slate-300" />
                           <p>لا توجد مقتطفات محفوظة بعد.<br/>التقط الأفكار والقرارات الملهمة أثناء حوارك مع تبيان لتجدها هنا ومقسمة كشجرة معرفية ذكية.</p>
                        </div>
                     )}
                  </div>

                  <div>
                     <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><Clock size={16} className="text-[#8E7AAE]"/> سجل أسئلتك السابقة</h4>
                     <p className="text-xs text-ink-mute mb-4">مرتّبة من الأحدث إلى الأقدم كما هي محفوظة على جهازك.</p>

                     {archivedSessions.length > 0 ? (
                        <div className="space-y-2">
                            {[...archivedSessions].reverse().slice(0, showAllArchive ? undefined : 5).map((query, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-[#8FA9C7]/15 rounded-xl shadow-sm hover:border-[#8E7AAE]/25 transition-colors">
                                    <span className="text-xs font-black text-[#8E7AAE] bg-[#F1EEF4] rounded-lg px-2 py-1 shrink-0">{idx + 1}</span>
                                    <p className="text-sm font-bold text-[#3D4A5A] line-clamp-2 leading-relaxed">{query}</p>
                                </div>
                            ))}
                            {archivedSessions.length > 5 && (
                                <button onClick={() => setShowAllArchive(v => !v)} className="w-full text-center text-xs text-[#6E5F8E] font-bold py-3 bg-[#F1EEF4] rounded-xl transition-colors hover:bg-[#EAE3EF]">
                                    {showAllArchive ? 'إخفاء البقية' : `عرض كل الأسئلة (${archivedSessions.length})`}
                                </button>
                            )}
                        </div>
                     ) : (
                         <div className="text-center p-6 bg-[#F7F5F2] rounded-2xl border border-[#8FA9C7]/15 border-dashed text-ink-mute text-sm">
                             لا يوجد سجل لأسئلة سابقة حتى الآن.
                         </div>
                     )}
                  </div>

                </motion.div>
              )}
              {activeTab === 'insights' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                  
                  <div className="bg-[#F1EEF4] p-4 rounded-2xl border border-[#8E7AAE]/18">
                    <p className="font-bold text-lilac-deep mb-2 flex items-center gap-2"><Fingerprint size={16}/> ماذا يعرف تبيان عني؟</p>
                    <p className="text-sm text-lilac/80 leading-relaxed">
                        ما تراه هنا مبني على أسئلتك المحفوظة على جهازك فقط. للتحكم بهذه البيانات أو محوها، افتح تبويب «إعدادات».
                    </p>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-navy flex items-center gap-2"><Sparkles size={16} className="text-[#8E7AAE]"/> مجرة الأفكار</h4>
                        <button 
                           onClick={() => analyzeGalaxyAndMaturity()}
                           disabled={isAnalyzingGalaxy}
                           className="text-xs bg-[#F1EEF4] text-[#6E5F8E] px-3 py-1.5 rounded-xl border border-[#8E7AAE]/18 hover:bg-[#EAE3EF] transition-colors disabled:opacity-50 font-black flex items-center gap-2 shadow-sm"
                        >
                           {isAnalyzingGalaxy ? (
                              <>
                                 <RefreshCw className="w-3 h-3 animate-spin" />
                                 <span>أقرأ مساراتك...</span>
                              </>
                           ) : (
                              <>
                                 <RefreshCw className="w-3 h-3" />
                                 <span>تحديث التحليل</span>
                              </>
                           )}
                        </button>
                     </div>
                     <div className="bg-[#EEF2F6] p-6 md:p-10 rounded-[32px] relative overflow-hidden h-72 flex items-center justify-center border border-[#8FA9C7]/20 shadow-[0_18px_60px_rgba(24,34,49,0.08)] group">
                         <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#8E7AAE]/18 via-[#EEF2F6] to-[#F7F5F2]" />
                         
                         {/* Grid background effect */}
                         <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(24,34,49,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,34,49,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

                         <div className="relative w-full h-full flex items-center justify-center">
                            <AnimatePresence>
                               {isAnalyzingGalaxy ? (
                                  <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-4 text-ink-mute"
                                  >
                                     <Globe className="w-12 h-12 text-[#8E7AAE] animate-pulse" />
                                     <p className="text-xs font-black tracking-widest tebyan-breathe">أستجمع شتات أفكارك...</p>
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
                                          className="absolute cursor-grab active:cursor-grabbing px-4 py-2 bg-white/85 backdrop-blur-md border border-[#8E7AAE]/30 rounded-full text-[#3D4A5A] text-xs md:text-xs font-black shadow-lg"
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
                                  <div className="text-ink-mute text-xs font-bold text-center italic max-w-[200px]">
                                     تبيان لا يرى أي أفكار متبلورة بعد.. حاول استكشاف مواضيع جديدة في غرفة "قول فصل".
                                  </div>
                               )}
                            </AnimatePresence>
                         </div>
  
                         <motion.div 
                            animate={{ opacity: isAnalyzingGalaxy ? 0 : 1 }}
                            className="absolute bottom-4 inset-x-6 text-center"
                         >
                            <div className="bg-slate-900/85 backdrop-blur-xl text-xs text-slate-100 p-3 rounded-2xl border border-white/10 font-medium leading-relaxed shadow-xl">
                                {galaxyAnalysis ? galaxyAnalysis : `الأفكار تشكل مجرتك الشخصية بناءً على اهتماماتك وتفاعلك مع النظام.`}
                            </div>
                         </motion.div>
                     </div>
                  </div>

                  {/* Contradiction Detector */}
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowRightLeft size={64}/></div>
                      <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><ArrowRightLeft size={16} className="text-[#8E7AAE]" /> كاشف التناقضات المخبأة</h4>
                      <div className="bg-white/60 p-4 rounded-xl border border-amber-200/50 backdrop-blur-sm relative z-10 m-0">
                          {contradiction ? (
                             <p className="text-sm font-medium text-[#3D4A5A] leading-relaxed whitespace-pre-wrap">
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
                                   {isAnalyzingContradiction ? 'أقرأ ما بين سطورك...' : 'اكتشف التناقض'}
                                </button>
                             </div>
                          )}
                      </div>
                  </div>

                  {/* Maturity Index */}
                  <div className="border border-[#8FA9C7]/15 p-6 md:p-8 rounded-[32px] bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <ChevronUp size={20} className="text-[#8E7AAE]" />
                           <h4 className="font-black text-navy text-lg">مؤشر نضج الأسئلة</h4>
                        </div>
                        <div className="px-3 py-1 bg-lilac-mist text-lilac text-xs font-black rounded-lg border border-lilac/15">
                           {maturityLabel}
                        </div>
                      </div>
                      
                      <div className="relative h-24 mb-8">
                          {/* axis captions (depth scale: 5 = deepest, 35 = simplest, as in the analysis prompt) */}
                          <span className="absolute top-0 end-0 text-xs font-bold text-ink-mute">أعمق</span>
                          <svg className={`w-full h-full ${language === 'ar' ? '-scale-x-100' : ''}`} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                              {[5, 20, 35].map(y => (
                                <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#8FA9C7" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                              ))}
                              <path d={`M0,${maturityScores.p1} Q25,${maturityScores.p2} 50,${(maturityScores.p2 + maturityScores.p3)/2} T100,${maturityScores.p3}`} fill="none" stroke="url(#lilacGradient)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                              <defs>
                                  <linearGradient id="lilacGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#B8AACD" />
                                      <stop offset="100%" stopColor="#6E5B91" />
                                  </linearGradient>
                              </defs>
                          </svg>
                          {/* marker y = point on the Bezier curve at that x (x is linear in t: t=x/50 on the first segment, (x-50)/50 on the second) */}
                          {/* markers are HTML so they stay round regardless of the stretched viewBox */}
                          {[{ x: 10, y: 0.64 * maturityScores.p1 + 0.32 * maturityScores.p2 + 0.04 * ((maturityScores.p2 + maturityScores.p3) / 2), c: '#B8AACD', s: 10 }, { x: 45, y: 0.01 * maturityScores.p1 + 0.18 * maturityScores.p2 + 0.81 * ((maturityScores.p2 + maturityScores.p3) / 2), c: '#8E7AAE', s: 10 }, { x: 90, y: 0.04 * ((maturityScores.p2 + maturityScores.p3) / 2) + 0.96 * maturityScores.p3, c: '#6E5B91', s: 12 }].map((m, i) => (
                            <span key={i} aria-hidden="true" className={`absolute rounded-full border-2 border-white ${i === 2 ? 'animate-pulse' : ''}`} style={{ left: `${language === 'ar' ? 100 - m.x : m.x}%`, top: `${(m.y / 40) * 100}%`, width: m.s, height: m.s, background: m.c, transform: 'translate(-50%, -50%)' }} />
                          ))}
                          
                          <div className="absolute bottom-0 right-0 text-xs text-ink-mute font-bold">البداية</div>
                          <div className="absolute bottom-0 left-0 text-xs text-lilac font-black">نقطة النضج الحالية</div>
                      </div>

                      {/* Commitments Display */}
                      {commitments.length > 0 && (
                        <button
                          onClick={() => setActiveTab('tools')}
                          className="mt-2 w-full text-xs font-black text-[#6E5F8E] bg-[#F1EEF4] hover:bg-[#EAE3EF] rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4 text-[#8E7AAE]" />
                          {commitments.length} التزام مرصود — افتح «تتبّع»
                        </button>
                      )}
                  </div>
                  
                </motion.div>
              )}

              {activeTab === 'tools' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                    <div className="grid grid-cols-1 gap-3">
                        <button
                          type="button"
                          onClick={openLibrary}
                          className="flex items-center gap-4 p-4 rounded-2xl border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors shadow-sm"
                        >
                          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-white text-amber-500 shadow">
                            <LibraryBig className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-navy">{language === 'ar' ? 'مكتبتي' : 'My Library'}</div>
                            <div className="text-xs text-ink-mute leading-relaxed">{language === 'ar' ? 'افتح الأسئلة والجلسات المحفوظة.' : 'Open saved questions and sessions.'}</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={openKnowledge}
                          className="flex items-center gap-4 p-4 rounded-2xl border border-[#8E7AAE]/18 bg-[#F1EEF4] hover:bg-[#EAE3EF] transition-colors shadow-sm"
                        >
                          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-white text-[#8E7AAE] shadow">
                            <Network className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-navy">{language === 'ar' ? 'شبكتي المعرفية' : 'Knowledge Network'}</div>
                            <div className="text-xs text-ink-mute leading-relaxed">{language === 'ar' ? 'شاهد روابط أفكارك عندما تحتاج العمق.' : 'See idea connections when you need depth.'}</div>
                          </div>
                        </button>
                    </div>

                    <div>
                        <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><ListTodo size={16} className="text-[#8E7AAE]"/> متتبع المهام والقرارات</h4>
                        <div className="bg-[#F7F5F2] p-4 rounded-2xl border border-emerald-100/50 mb-4">
                            <p className="text-sm font-bold text-emerald-900 mb-1">تبيان يراقب خطواتك</p>
                            <p className="text-xs text-emerald-700/80 leading-relaxed">
                                يتم رصد القرارات التي تعلن التزامك بها في جلسات الحوار هنا تلقائياً لتتابع مدى انضباطك في تنفيذها.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                           {commitments.length > 0 ? (
                               commitments.map((c, i) => (
                                   <div key={i} className="flex items-center gap-3 p-4 bg-white border border-[#8FA9C7]/15 rounded-2xl shadow-sm hover:border-emerald-200 transition-colors">
                                       <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500 shrink-0">
                                          <Target size={16} />
                                       </div>
                                       <div>
                                           <p className="text-sm font-bold text-[#273548]">{c}</p>
                                           <p className="text-xs text-ink-mute">قرار مرصود من سياق حوارك</p>
                                       </div>
                                   </div>
                               ))
                           ) : (
                               <div className="flex flex-col items-center justify-center p-8 bg-[#F7F5F2] rounded-2xl border border-dashed border-slate-200 text-ink-mute">
                                   <ListTodo size={32} className="mb-2 opacity-20" />
                                   <p className="text-xs text-center">لا توجد التزامات مرصودة حالياً.<br/>تحاور مع تبيان حول أهدافك لتظهر هنا.</p>
                               </div>
                           )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><Activity size={16} className="text-[#8E7AAE]"/> مقياس التوازن الذهني</h4>
                        <div className="bg-[#F7F5F2] p-5 rounded-2xl border border-[#8FA9C7]/15 flex flex-col gap-4">
                            <div className="flex items-start justify-around gap-2">
                                {([
                                  { l: 'الحكمة', v: sageProgress.stats.wisdom },
                                  { l: 'الحوار', v: sageProgress.stats.dialogue },
                                  { l: 'الصبر', v: sageProgress.stats.patience },
                                ] as const).map(m => {
                                  const pct = Math.min(100, (Number(m.v) || 0) * 10);
                                  return <DnaRing key={m.l} value={pct} tone="lilac" size={64} sublabel={m.l} ariaLabel={`${m.l}: ${pct}%`} />;
                                })}
                            </div>
                            <p className="text-xs text-ink-mute mt-2 text-center">يعتمد مؤشر التوازن على نوعية تفاعلاتك المستمرة مع المنصة.</p>
                        </div>
                    </div>
                </motion.div>
              )}

              {false && activeTab === 'tools' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-8">

                    {/* Personal Library & Knowledge Network quick links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={openLibrary}
                          className="flex items-center gap-4 p-5 rounded-2xl border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors shadow-sm"
                        >
                          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white text-amber-500 shadow">
                            <LibraryBig className="w-6 h-6" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-navy">{language === 'ar' ? 'مكتبتي' : 'My Library'}</div>
                            <div className="text-xs text-ink-mute leading-relaxed">{language === 'ar' ? 'كل أسئلتك وجلساتك السابقة محفوظة هنا' : 'All your previous questions and sessions'}</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={openKnowledge}
                          className="flex items-center gap-4 p-5 rounded-2xl border border-[#8E7AAE]/18 bg-[#F1EEF4] hover:bg-[#EAE3EF] transition-colors shadow-sm"
                        >
                          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white text-[#8E7AAE] shadow">
                            <Network className="w-6 h-6" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-navy">{language === 'ar' ? 'شبكتي المعرفية' : 'Knowledge Network'}</div>
                            <div className="text-xs text-ink-mute leading-relaxed">{language === 'ar' ? 'شاهد كيف ترتبط أفكارك ببعضها' : 'See how your ideas connect'}</div>
                          </div>
                        </button>
                    </div>

                    {/* Time Capsule */}
                    <div className="bg-gradient-to-br from-lilac-deep to-slate-900 p-6 rounded-2xl text-white relative overflow-hidden shadow-lg">
                        <div className="absolute -right-10 -top-10 text-[#8E7AAE]/20"><Timer size={120} /></div>
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2 relative z-10"><Timer size={18} className="text-[#8E7AAE]"/> كبسولة الزمن للقرارات</h4>
                        <p className="text-xs text-ink-mute mb-4 leading-relaxed relative z-10">اكتب قراراً صعباً أو مشكلة تؤرقك اليوم، وسنقوم بتجميدها وإعادتها لك بعد أشهر لترى كيف عبرتها بنضج.</p>
                        
                        {!isCapsuled ? (
                            <div className="relative z-10 space-y-3">
                                <textarea 
                                    value={capsuleItem}
                                    onChange={(e) => setCapsuleItem(e.target.value)}
                                    placeholder="مثال: خائف جداً من ترك وظيفتي والبدء في مشروعي..."
                                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-lilac-soft/50 focus:outline-none focus:ring-2 focus:ring-lilac resize-none h-24"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => sealCapsule(3)} className="flex-1 py-2.5 bg-lilac hover:bg-lilac rounded-xl text-sm font-bold transition-colors">تجميد لمدة 3 أشهر</button>
                                    <button onClick={() => sealCapsule(12)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors">تجميد لسنة</button>
                                </div>
                            </div>
                        ) : (
                            <motion.div initial={{scale: 0.9, opacity:0}} animate={{scale:1, opacity:1}} className="relative z-10 bg-white/10 border border-white/20 p-4 rounded-xl text-center space-y-2">
                                <div className="w-12 h-12 bg-lilac/30 rounded-full flex items-center justify-center mx-auto mb-2"><Moon size={24} className="text-lilac-soft" /></div>
                                <p className="font-bold text-sm">تم إغلاق الكبسولة بنجاح</p>
                                <p className="text-xs text-lilac-soft/80">
                                  {capsuleDue ? `ستفتح في ${capsuleDue}. محفوظة على هذا الجهاز فقط.` : 'محفوظة على هذا الجهاز فقط.'}
                                </p>
                                <button onClick={() => { setIsCapsuled(false); setCapsuleItem(''); }} className="text-xs font-bold text-lilac-soft/70 hover:text-white pt-1">كبسولة أخرى</button>
                            </motion.div>
                        )}
                    </div>

                    {/* Rage Room */}
                    <div className="bg-[#F7F5F2] border border-rose-100 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute -left-6 -bottom-6 text-rose-500/10"><Frown size={100} /></div>
                        <h4 className="font-bold text-navy mb-2 flex items-center gap-2 relative z-10"><Frown size={18} className="text-[#8E7AAE]"/> الغرفة الصامتة (التفريغ الحر)</h4>
                        <p className="text-xs text-ink-mute mb-4 leading-relaxed relative z-10">مساحة آمنة لتكتب كل ما يغضبك بدون أحكام أو وعظ. تبيان سيحلل شعورك فقط ثم يمسح النص للأبد.</p>
                        
                        {!rageAnalysis ? (
                            <div className="relative z-10 space-y-3">
                                <textarea 
                                    value={rageText}
                                    onChange={(e) => setRageText(e.target.value)}
                                    placeholder="اكتب هنا، أفرغ غضبك، لا أحد سيقرأ..."
                                    className="w-full bg-white border border-rose-200 rounded-xl p-3 text-sm text-[#273548] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none h-24"
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
                                {rageAnalysis.unavailable || rageAnalysis.rage == null || rageAnalysis.sad == null || rageAnalysis.tired == null ? (
                                    <div role="status" className="flex flex-col items-center gap-2 py-2 text-center">
                                        <DnaIconTile icon={<CircleHelp size={20} />} tone="lilac" size="md" />
                                        <p className="text-sm font-bold text-navy">لا بيانات كافية لتحليل الآن</p>
                                        <p className="text-xs text-ink-mute">تم مسح النص. يمكنك المحاولة لاحقًا.</p>
                                    </div>
                                ) : (
                                <>
                                <p className="text-xs text-ink-mute text-center">تم مسح النص الأصلي. هذا ما استشعرناه من طيات كلماتك:</p>
                                <div className="flex items-start justify-around gap-2">
                                    <DnaRing value={rageAnalysis.rage} tone="coral" size={64} label={`${Math.round(rageAnalysis.rage)}%`} sublabel="غضب" ariaLabel={`غضب ${Math.round(rageAnalysis.rage)}%`} />
                                    <DnaRing value={rageAnalysis.sad} tone="indigo" size={64} label={`${Math.round(rageAnalysis.sad)}%`} sublabel="خذلان" ariaLabel={`خذلان ${Math.round(rageAnalysis.sad)}%`} />
                                    <DnaRing value={rageAnalysis.tired} tone="slate" size={64} label={`${Math.round(rageAnalysis.tired)}%`} sublabel="إرهاق" ariaLabel={`إرهاق ${Math.round(rageAnalysis.tired)}%`} />
                                </div>
                                </>
                                )}
                                <button onClick={() => setRageAnalysis(null)} className="w-full py-2 text-xs font-bold text-ink-mute hover:text-ink-soft">إغلاق وتجاوز</button>
                            </motion.div>
                        )}
                    </div>

                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="space-y-6">
                  
                  <div>
                    <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><UserIcon size={16} className="text-[#8E7AAE]"/> تخصيص الصورة المعرفية</h4>
                     <div className="grid grid-cols-5 gap-2">
                         {AVATARS.map(avatar => {
                             const isSelected = selectedAvatar === avatar.id;
                             return (
                                 <button 
                                    key={avatar.id}
                                    onClick={() => handleAvatarChange(avatar.id)}
                                    title={avatar.label}
                                    className={`aspect-square rounded-xl flex items-center justify-center transition-all border-2 ${isSelected ? 'border-lilac shadow-md scale-105' : 'border-transparent hover:bg-slate-100'} ${avatar.color}`}
                                 >
                                     <avatar.icon size={20} />
                                 </button>
                             )
                         })}
                     </div>
                  </div>

                  <div className="border-t border-[#8FA9C7]/15 pt-6">
                     <h4 className="font-bold text-navy mb-3 flex items-center gap-2"><Shield size={16} className="text-[#8E7AAE]"/> بياناتي وخصوصيتي</h4>
                     <p className="text-xs text-ink-mute mb-3 leading-relaxed">
                        أسئلتك وتحليلاتها محفوظة على هذا الجهاز. المحو يشمل السجل والكلمات المتكررة والتحليل المخزّن، ولا يمكن التراجع عنه.
                     </p>
                     <button onClick={clearMemory} className="w-full py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 transition-colors">
                        محو الذاكرة المعرفية (Reset Context)
                     </button>
                  </div>

                  <div className="border-t border-[#8FA9C7]/15 pt-6">
                     <button onClick={() => {
                        onClose();
                        if (IS_DEMO_MODE) { exitDemoMode(); return; }
                  auth.signOut();
                        window.location.reload();
                     }} className="w-full py-3 bg-slate-100 hover:bg-rose-50 text-[#3D4A5A] hover:text-rose-600 rounded-xl text-sm font-bold transition-colors">
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
