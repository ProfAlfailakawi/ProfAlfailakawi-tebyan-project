import { GoogleGenAI } from "@google/genai";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, MessageCircleQuestion, BrainCircuit, Gamepad2, ArrowLeft, Lightbulb, Zap, Route, Rocket, Activity, BarChart3, Network, Hourglass, ClipboardCheck, Command, X, LibraryBig, Lock, Box, Waves } from 'lucide-react';
import { cn } from '../lib/utils';
import { logEvent } from '../services/analyticsService';
import { useUser } from '../contexts/UserContext';
import { detectEmotion } from '../services/gemini';

import { GravityCard } from './GravityCard';
import { AIHeartbeat } from './ui/AIHeartbeat';
import { TypographicAcoustic } from './TypographicAcoustic';

const DAILY_CHALLENGES = [
    {
        titleAr: 'كيف تدير صراعاً حاداً بين أفراد فريقك أو عائلتك؟',
        titleEn: 'How to manage severe conflict among your team or family?',
        query: 'كيف أتعامل مع توتر حاد وصدام بين شخصين في فريقي؟',
        path: 'simulation'
    },
    {
        titleAr: 'ماذا تفعل إذا انهارت خطتك في اللحظة الأخيرة؟',
        titleEn: 'What to do if your plan falls apart at the last minute?',
        query: 'خطة مهمة جداً فشلت فجأة، كيف ألملم الوضع وأتخذ قراراً؟',
        path: 'simulation'
    },
  {
      titleAr: 'كيف تتصرف مع عميل أو شريك غاضب جداً؟',
      titleEn: 'How do you handle a very angry client or partner?',
      query: 'كيف أتصرف بذكاء مع شخص منفعل وغاضب يهاجمني الآن؟',
      path: 'simulation'
  },
  {
      titleAr: 'كيف تتخذ قراراً صعباً وسط ضغوط متضاربة؟',
      titleEn: 'How to make a difficult decision amid conflicting pressures?',
      query: 'أواجه قراراً معقداً ولا أعرف من أين أبدأ أو كيف أوازن المخاطر؟',
      path: 'simulation'
  },
    {
        titleAr: 'كيف تقنع طرفاً عنيداً بتوجه جديد دون صدام؟',
        titleEn: 'How to convince a stubborn party without a clash?',
        query: 'كيف أقنع شخصاً عنيداً بتغيير المسار وتجربة شيء جديد؟',
        path: 'simulation'
    }
];

const PLATFORM_INSIGHTS = [
    {
        titleAr: 'أكثر التحديات الإنسانية هذا الأسبوع',
        titleEn: 'Top human challenges this week',
        items: [
            { labelAr: 'إدارة الغضب', labelEn: 'Anger Management', pct: '70%', color: 'bg-emerald-500' },
            { labelAr: 'صناعة القرار', labelEn: 'Decision Making', pct: '85%', color: 'bg-indigo-500' }
        ]
    },
    {
        titleAr: 'تحديات التواصل الحديثة',
        titleEn: 'Modern Communication Challenges',
        items: [
            { labelAr: 'القلق والمخاوف', labelEn: 'Anxiety & Fears', pct: '60%', color: 'bg-rose-500' },
            { labelAr: 'الإقناع والتفاوض', labelEn: 'Persuasion & Negotiation', pct: '75%', color: 'bg-blue-500' }
        ]
    },
    {
        titleAr: 'مواقف صعبة شائعة اليوم',
        titleEn: 'Common Difficult Situations Today',
        items: [
            { labelAr: 'العناد المفرط', labelEn: 'Extreme Stubbornness', pct: '80%', color: 'bg-orange-500' },
            { labelAr: 'رفض التغيير', labelEn: 'Resistance to Change', pct: '50%', color: 'bg-purple-500' }
        ]
    },
    {
        titleAr: 'محاور الذكاء العاطفي',
        titleEn: 'Emotional Intelligence Focus',
        items: [
            { labelAr: 'حل النزاعات', labelEn: 'Conflict Resolution', pct: '65%', color: 'bg-teal-500' },
            { labelAr: 'التواصل الفعال', labelEn: 'Effective Communication', pct: '90%', color: 'bg-pink-500' }
        ]
    }
];

const colorMap: Record<string, string> = {
  indigo: '#6366f1',
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  zinc: '#71717a',
  rose: '#f43f5e',
  violet: '#8b5cf6'
};

import { useFluidTyping } from '../hooks/useFluidTyping';

interface SmartGatewayProps {
  language: 'ar' | 'en';
  handleTabChange: (id: any, context?: string) => void;
  tabs: any[];
}

export const SmartGateway: React.FC<SmartGatewayProps & { initialQuery?: string, onQueryUsed?: () => void }> = ({ language, handleTabChange, tabs, initialQuery, onQueryUsed }) => {
  const { preferences, setUserStyle: setGlobalUserStyle } = useUser();
  const { onType, fluidTheme, getFluidStyles, getFluidAmbient } = useFluidTyping();
  const aiClient = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }), []);
  const [query, setQuery] = useState(() => sessionStorage.getItem('tebyan_current_query') || '');
  const [searchValue, setSearchValue] = useState(() => sessionStorage.getItem('tebyan_current_query') || '');
  const [smartSuggestion, setSmartSuggestion] = useState("");
  const suggestion = smartSuggestion;
  const setSuggestion = setSmartSuggestion;
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const latestInputRef = useRef(searchValue);
  const requestIdRef = useRef(0);
  const [isFocused, setIsFocused] = useState(false);
  
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [insightIndexList, setInsightIndexList] = useState(0);

  useEffect(() => {
    setChallengeIndex(Math.floor(Math.random() * DAILY_CHALLENGES.length));
    setInsightIndexList(Math.floor(Math.random() * PLATFORM_INSIGHTS.length));
  }, []);

  const currentChallenge = DAILY_CHALLENGES[challengeIndex % DAILY_CHALLENGES.length];
  const currentInsight = PLATFORM_INSIGHTS[insightIndexList % PLATFORM_INSIGHTS.length];

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length === 1) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSearchInputChange = (value: string) => {
    setSearchValue(value);
    latestInputRef.current = value;
    setSmartSuggestion("");
    setQuery(value);
    onType();
    if (hasSearched) setHasSearched(false);
    
    if (!value || value.trim().length < 6) return;
  };

  useEffect(() => {
    const currentText = searchValue.trim();
    if (currentText.length < 6) {
      setSmartSuggestion("");
      return;
    }

    const requestId = ++requestIdRef.current;
    const textForThisRequest = currentText;
    
    const timer = window.setTimeout(async () => {
      try {
        setIsSuggestionLoading(true);
        const latestText = latestInputRef.current.trim();
        
        if (latestText !== textForThisRequest) return;
        
        const prompt = `
أنت محرك اقتراح ذكي داخل تطبيق تبيان.

المستخدم كتب النص التالي: "${latestText}"

المطلوب:
- أكمل صياغة النص كمقترح بحث فقط
- لا تجب على السؤال
- لا تعط نصيحة
- لا تغيّر نية المستخدم
- استخدم نفس اللهجة والأسلوب
- اجعل الاقتراح امتداداً طبيعياً للجملة
- إذا النص واضح ومكتمل، حسّنه قليلاً فقط
- لا تعتمد على أول كلمة، اعتمد على النص الكامل الحالي فقط

أرجع جملة واحدة فقط.
`;
        const response = await aiClient.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });

        const suggestion = response.text?.trim() || "";

        if (requestId !== requestIdRef.current) return;
        if (latestInputRef.current.trim() !== latestText) return;

        if (suggestion && suggestion !== latestText) {
          setSmartSuggestion(suggestion);
        }
      } catch (error) {
        console.error("Smart search suggestion error:", error);
        setSmartSuggestion("");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSuggestionLoading(false);
        }
      }
    }, 700);
    
    return () => {
      window.clearTimeout(timer);
    };
  }, [searchValue, aiClient]);

  const [isQueryExpanded, setIsQueryExpanded] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const loadingPhrasesAr = [
      'جاري تشريح الأبعاد الاستراتيجية...',
      'فحص المسارات المحتملة للقرار...',
      'تصفية التناقضات السلوكية...',
      'استخراج الجوهر التفاوضي المفقود...',
      'بناء خارطة الطريق الشاملة...'
  ];

  const loadingPhrasesEn = [
      'Dissecting strategic dimensions...',
      'Scanning potential decision paths...',
      'Filtering behavioral contradictions...',
      'Extracting hidden negotiation essence...',
      'Constructing a comprehensive roadmap...'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isThinking) {
        setLoadingPhraseIndex(0);
        interval = setInterval(() => {
            setLoadingPhraseIndex(prev => (prev + 1) % loadingPhrasesAr.length);
        }, 1200);
    }
    return () => clearInterval(interval);
  }, [isThinking]);
  const [lastInteraction, setLastInteraction] = useState<any>(null);
  const proactiveInsights = useMemo(() => {
    const hour = new Date().getHours();
    let arG, enG, arSub, enSub;
    let dynamicSuggests: {ar: string, en: string}[] = [];

    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

    if (hour < 12) {
      if (lastInteraction && lastInteraction.query) {
        arG = 'صباح الوعي والتجدد';
        enG = 'Good morning, visionary';
        arSub = (
          <div className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer" onClick={() => setIsQueryExpanded(!isQueryExpanded)}>
            <span>أهلاً بك مجدداً.. توقفنا في المرة السابقة عند</span>
            <span className={`text-content text-indigo-500 font-bold transition-all ${isQueryExpanded ? 'whitespace-normal w-full text-center mt-2 break-words' : 'truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom'}`}>
                "{lastInteraction.query}"
            </span>
            <span>، هل القهوة جاهزة لنكمل؟ ☕</span>
          </div>
        );
        enSub = (
          <div className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer" onClick={() => setIsQueryExpanded(!isQueryExpanded)}>
            <span>Welcome back.. last time we stopped at</span>
             <span className={`text-content text-indigo-500 font-bold transition-all ${isQueryExpanded ? 'whitespace-normal w-full text-center mt-2 break-words' : 'truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom'}`}>
                "{lastInteraction.query}"
            </span>
            <span>, is your coffee ready to continue? ☕</span>
          </div>
        );
        dynamicSuggests = [
            { ar: `أكمل تحليل: ${lastInteraction.query}`, en: `Continue analyzing: ${lastInteraction.query}` },
            { ar: `كيف أتعامل مع تمرد أو عناد الموظفين؟`, en: `How can I deal with team rebellion?` },
            { ar: `أفضل طريقة لإيصال أخبار سيئة للإدارة؟`, en: `Best way to deliver bad news to management?` },
            { ar: `تقييم مخاطر قرار توسع استراتيجي`, en: `Evaluate risks of a strategic expansion` },
            { ar: `خطوات حل نزاع حاد بين شريكين`, en: `Steps to resolve severe conflict between partners` },
            { ar: `كيف أعيد تحفيز فريق أصابه الإحباط؟`, en: `How to remotivate a frustrated team?` },
            { ar: `التعامل مع عميل منفعل وغاضب جداً`, en: `Handling a very angry and frustrated client` },
            { ar: `مراجعة خطة تراجع المبيعات المفاجئ`, en: `Reviewing sudden drop in sales plan` }
        ].sort(() => 0.5 - Math.random());
      } else {
        arG = 'صباح الوعي والتجدد';
        enG = 'Morning of awareness';
        arSub = 'هل نلخص لك التحولات المعرفية لهذا الصباح؟';
        enSub = 'Shall we summarize the cognitive shifts this morning?';
        dynamicSuggests = [
            { ar: `استعراض ملخص التطورات في سوق العمل`, en: `Global developments summary in labor market` },
            { ar: `بناء خريطة تحفيز لفريق المبيعات`, en: `Build a daily strategic roadmap for sales` },
            { ar: `كيف أرتب أولويات المؤسسة لتخطي الأزمة؟`, en: `How to prioritize organizational goals during crisis?` },
            { ar: `تحليل فجوات الأداء الإداري والمهارات`, en: `Analyze management performance and skill gaps` },
            { ar: `كيف أعالج مشكلة تسرب الكفاءات الوظيفية؟`, en: `How to treat employee turnover?` },
            { ar: `تحليل آليات اتخاذ القرار في أوقات التعثر المالي`, en: `Analyzing decision-making under financial crisis` },
            { ar: `كيف أدير أزمة تواصل مع شريك استراتيجي؟`, en: `How to handle a communication crisis with partner?` },
            { ar: `مراجعة مؤشرات الأداء الحيوية بعد الفشل`, en: `Reviewing vital performance indicators after failure` }
        ].sort(() => 0.5 - Math.random()).slice(0, 6);
      }
    } else if (hour < 18) {
      if (lastInteraction && lastInteraction.query) {
        arG = 'مساء التمكين والعمق';
        enG = 'Good afternoon, visionary';
        arSub = (
          <div className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer" onClick={() => setIsQueryExpanded(!isQueryExpanded)}>
            <span>أهلاً بك مجدداً.. توقفنا في المرة السابقة عند</span>
            <span className={`text-content text-indigo-500 font-bold transition-all ${isQueryExpanded ? 'whitespace-normal w-full text-center mt-2 break-words' : 'truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom'}`}>
                "{lastInteraction.query}"
            </span>
            <span>، هل نكمل الاستكشاف؟ ☕</span>
          </div>
        );
        enSub = (
          <div className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer" onClick={() => setIsQueryExpanded(!isQueryExpanded)}>
            <span>Welcome back.. last time we stopped at</span>
            <span className={`text-content text-indigo-500 font-bold transition-all ${isQueryExpanded ? 'whitespace-normal w-full text-center mt-2 break-words' : 'truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom'}`}>
                "{lastInteraction.query}"
            </span>
            <span>, shall we continue exploring? ☕</span>
          </div>
        );
        dynamicSuggests = [
            { ar: `أكمل تحليل: ${lastInteraction.query}`, en: `Continue analyzing: ${lastInteraction.query}` },
            { ar: `مراجعة وتصحيح مسار القرار الأخير`, en: `Review and correct my path about this` },
            { ar: `طريقة احتواء استقالة مفاجئة`, en: `How to contain a sudden resignation` },
            { ar: `كيف أتعامل مع ضغط تراجع الأرباح الآن؟`, en: `How to handle profit drop stress now?` },
            { ar: `توليد أفكار لتسويق منتج متعثر`, en: `Brainstorming marketing for struggling product` },
            { ar: `تحليل التحديات المعقدة في الاندماج`, en: `Analyze complex challenges in merger` }
        ].sort(() => 0.5 - Math.random()).slice(0, 6);
      } else {
          arG = 'منتصف يوم حافل';
          enG = 'A busy midday';
          arSub = 'هل تحتاج لنقطة ارتكاز قبل اتخاذ قرارك القادم؟';
          enSub = 'Do you need a pivot point before your next decision?';
          dynamicSuggests = [
              { ar: `اقتراح الموازنة بين ميزانية التسويق والتشغيل`, en: `Suggest balancing marketing vs operations budget` },
              { ar: `مراجعة وتصحيح مسار مشاريع اليوم`, en: `Review and correct my path today` },
              { ar: `كيف أتعامل مع تمرد العمال ومطالبهم؟`, en: `How to deal with worker demands?` },
              { ar: `كيف أتعامل مع ضغط تهديدات المنافس الجديد؟`, en: `How to handle threat of new competitor?` },
              { ar: `فكرة إبداعية لحل مشكلة توفر الموارد`, en: `Creative idea to solve resources issue` },
              { ar: `نصيحة للخروج من تعقّد الإجراءات الروتينية`, en: `Tip to escape complex bureaucratic procedures` },
              { ar: `كيف أدير اجتماعاً عاصفاً بطريقة أفضل؟`, en: `How to run a chaotic meeting better?` },
              { ar: `التعامل بحكمة مع تسريب أسرار العمل`, en: `Handling data leak with wisdom` },
              { ar: `توليد حلول لمشروع ديون مستعصي`, en: `Brainstorming ideas for debt management` }
          ].sort(() => 0.5 - Math.random()).slice(0, 6);
      }
    } else {
      if (lastInteraction && lastInteraction.query) {
        arG = 'مساء التأمل والعمق';
        enG = 'Evening of reflection';
        arSub = (
          <div className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer" onClick={() => setIsQueryExpanded(!isQueryExpanded)}>
            <span>أهلاً بك مجدداً.. توقفنا في المرة السابقة عند</span>
             <span className={`text-content text-indigo-500 font-bold transition-all ${isQueryExpanded ? 'whitespace-normal w-full text-center mt-2 break-words' : 'truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom'}`}>
                "{lastInteraction.query}"
            </span>
            <span>.. هل كان يوماً مثمراً؟ 🌟</span>
          </div>
        );
        enSub = (
          <div className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer" onClick={() => setIsQueryExpanded(!isQueryExpanded)}>
            <span>Welcome back.. last time we stopped at</span>
             <span className={`text-content text-indigo-500 font-bold transition-all ${isQueryExpanded ? 'whitespace-normal w-full text-center mt-2 break-words' : 'truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom'}`}>
                "{lastInteraction.query}"
            </span>
            <span>, how was your day? 🌟</span>
          </div>
        );
        dynamicSuggests = [
            { ar: `أكمل تحليل: ${lastInteraction.query}`, en: `Continue analyzing: ${lastInteraction.query}` },
            { ar: `كيف أستعد لمواجهة الخصم غداً بذكاء؟`, en: `How to prepare for opponent tomorrow smartly?` },
            { ar: `حوار هادئ لحل أزمة ثقة مع فريق العمل`, en: `Calm dialogue to resolve team trust crisis` },
            { ar: `تقييم خسائر اليوم وكيفية التعويض`, en: `Reflections on today's losses and compensation` },
            { ar: `خطوات تأسيس بيئة عمل أكثر شفافية`, en: `Steps to build a more transparent work environment` },
            { ar: `التغلب على التفكير المفرط بالخسارة`, en: `Overcoming overthinking of business loss` }
        ].sort(() => 0.5 - Math.random()).slice(0, 6);
      } else {
          arG = 'مساء التأمل والعمق';
          enG = 'Evening of reflection';
          arSub = 'ما الذي يشغل حيز وعيك في نهاية هذا اليوم؟';
          enSub = 'What occupies your consciousness at the end of this day?';
          dynamicSuggests = [
              { ar: `تأملات استراتيجية في مخرجات الأزمة السابقة`, en: `Strategic reflections on today's crisis output` },
              { ar: `التخطيط الاستباقي للأسوأ غداً`, en: `Proactive planning for the worst tomorrow` },
              { ar: `تقييم الاستجابة למوقف تمرد الموظفين اليوم`, en: `Evaluate response to employee rebellion` },
              { ar: `حوار منهجي لترتيب إغلاق الشراكة`, en: `Systematic dialogue for partnership closure` },
              { ar: `استعراض أسباب رفض المشروع وسبل التعديل`, en: `Summarizing project rejection and pivoting` },
              { ar: `تحليل استراتيجي لمنافس شرس ظهر اليوم`, en: `Strategic analysis of a new competitor seen today` },
              { ar: `مراجعة أخلاقيات القرار في بيئة تسريح العمال`, en: `Review decision ethics in layoff environment` },
              { ar: `كيفية بناء إرث مهني والنجاة من الإفلاس`, en: `How to survive bankruptcy and build a legacy` }
          ].sort(() => 0.5 - Math.random()).slice(0, 6);
      }
    }
    return { arG, enG, arSub, enSub, dynamicSuggests };
  }, [lastInteraction, isQueryExpanded]);
  
  // React to initialQuery prop
  useEffect(() => {
    if (initialQuery) {
        setQuery(initialQuery);
        sessionStorage.setItem('tebyan_current_query', initialQuery);
        
        // Restore search results if they exist, rather than re-computing
        const wasSearched = sessionStorage.getItem('tebyan_current_has_searched') === 'true';
        if (wasSearched) {
            setHasSearched(true);
        } else {
            handleSubmit(undefined, initialQuery);
        }
        
        if (onQueryUsed) onQueryUsed();
    }
  }, [initialQuery, onQueryUsed]);

  const [styleConfirmed, setStyleConfirmed] = useState(() => localStorage.getItem('tebyan_style_confirmed') === 'true');
  const [showStylePicker, setShowStylePicker] = useState(false);

  const confirmStyle = (style: 'practical' | 'analytical' | 'simulation') => {
    setGlobalUserStyle(style);
    setStyleConfirmed(true);
    localStorage.setItem('tebyan_style_confirmed', 'true');
    setShowStylePicker(false);
    logEvent('feature_use', language, undefined, { confirmedStyle: style });
  };

  const [selectionFeedback, setSelectionFeedback] = useState('');
  const [sageProgress, setSageProgress] = useState({
    points: 0,
    level: 'seeker',
    badges: [] as string[],
    stats: { wisdom: 0, dialogue: 0, patience: 0 }
  });

  const levels = [
    { id: 'seeker', ar: 'باحث', en: 'Seeker', min: 0 },
    { id: 'awakened', ar: 'متيقظ', en: 'Awakened', min: 100 },
    { id: 'enlightened', ar: 'مستنير', en: 'Enlightened', min: 300 },
    { id: 'sage', ar: 'حكيم', en: 'Sage', min: 600 },
    { id: 'transcendent', ar: 'متسامي', en: 'Transcendent', min: 1000 }
  ];

  const badges = [
    { id: 'wisdom', icon: BrainCircuit, ar: 'وسام الحكمة', en: 'Wisdom Badge', desc: { ar: 'تُمنح لتحليل المواقف بعمق قبل الرد', en: 'Awarded for deep analysis before acting' } },
    { id: 'dialogue', icon: MessageCircleQuestion, ar: 'وسام الحوار', en: 'Dialogue Badge', desc: { ar: 'تُمنح للتدريب على الحوار المتزن', en: 'Awarded for practicing balanced dialogue' } },
    { id: 'patience', icon: Sparkles, ar: 'وسام الصبر', en: 'Patience Badge', desc: { ar: 'تُمنح للمتابعة والوصول لنتائج هادئة', en: 'Awarded for following up and reaching calm results' } }
  ];

  useEffect(() => {
    // Memory Layer & Gamification: Load from localStorage
    const savedMemory = localStorage.getItem('tebyan_memory');
    const savedProgress = localStorage.getItem('tebyan_sage_progress');

    if (savedMemory) {
      const data = JSON.parse(savedMemory);
      setLastInteraction(data);
      const lastTime = new Date(data.timestamp).getTime();
      const now = new Date().getTime();
      if (now - lastTime > 3600000 && !data.followedUp) {
        setShowFollowUp(true);
      }
    }

    if (savedProgress) {
      setSageProgress(JSON.parse(savedProgress));
    }
  }, []);

  const updateSageProgress = (pointsToAdd: number, statKey?: keyof typeof sageProgress.stats) => {
    setSageProgress(prev => {
      const newPoints = prev.points + pointsToAdd;
      const newStats = { ...prev.stats };
      if (statKey) newStats[statKey] += 1;

      // Check for level up
      const currentLevelObj = [...levels].reverse().find(l => newPoints >= l.min) || levels[0];
      
      // Check for new badges
      const newBadges = [...prev.badges];
      if (newStats.wisdom >= 3 && !newBadges.includes('wisdom')) newBadges.push('wisdom');
      if (newStats.dialogue >= 3 && !newBadges.includes('dialogue')) newBadges.push('dialogue');
      if (newStats.patience >= 2 && !newBadges.includes('patience')) newBadges.push('patience');

      const next = {
        points: newPoints,
        level: currentLevelObj.id,
        badges: newBadges,
        stats: newStats
      };
      
      localStorage.setItem('tebyan_sage_progress', JSON.stringify(next));
      return next;
    });
  };

  const handleFollowUpFeedback = (status: 'success' | 'fail') => {
    if (lastInteraction) {
        const updated = { ...lastInteraction, followedUp: true, feedback: status };
        localStorage.setItem('tebyan_memory', JSON.stringify(updated));
        setLastInteraction(updated);
        
        if (status === 'success') {
            updateSageProgress(20, 'patience');
        }
    }
    setShowFollowUp(false);
  };

    const onPathSelect = (id: any, query: string) => {
    console.log('[SmartGateway] onPathSelect called:', id, query);
    // Usage Tracking for personalization
    const usageStats = JSON.parse(localStorage.getItem('tebyan_usage_stats') || '{}');
    usageStats[id] = (usageStats[id] || 0) + 1;
    localStorage.setItem('tebyan_usage_stats', JSON.stringify(usageStats));

    // Memory
    const memory = {
        query,
        path: id,
        timestamp: new Date().toISOString(),
        followedUp: false
    };
    localStorage.setItem('tebyan_memory', JSON.stringify(memory));

    // Gamification rewards based on behavior
    if (id === 'council' || id === 'concepts') updateSageProgress(15, 'wisdom');
    else if (id === 'simulation' || id === 'lab') updateSageProgress(10, 'dialogue');
    else updateSageProgress(5);

    handleTabChange(id, query);
  };

  const [hasSearched, setHasSearched] = useState(() => sessionStorage.getItem('tebyan_current_has_searched') === 'true');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [emotion, setEmotion] = useState<'neutral'|'stress'|'creative'>('neutral');

  useEffect(() => {
    if (emotion === 'stress') {
        document.body.classList.add('emotion-stress');
        document.body.classList.remove('emotion-creative');
    } else if (emotion === 'creative') {
        document.body.classList.add('emotion-creative');
        document.body.classList.remove('emotion-stress');
    } else {
        document.body.classList.remove('emotion-stress', 'emotion-creative');
    }
    return () => {
        document.body.classList.remove('emotion-stress', 'emotion-creative');
    }
  }, [emotion]);

  useEffect(() => {
    const history = localStorage.getItem('tebyan_search_history');
    if (history) setSearchHistory(JSON.parse(history));
  }, []);

  const addToHistory = (q: string) => {
    const newHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('tebyan_search_history', JSON.stringify(newHistory));
  };

  const [showResumePrompt, setShowResumePrompt] = useState(() => {
    const lastQuery = sessionStorage.getItem('tebyan_current_query');
    const lastHasSearched = sessionStorage.getItem('tebyan_current_has_searched');
    return !!lastQuery && lastHasSearched !== 'true';
  });

  const [insightIndex, setInsightIndex] = useState(0);
  
  const getIntentAndEmotion = (q: string) => {
    const lowQ = q.toLowerCase();
    
    // Urgent / Risk / Emergency / Defense
    const urgentWords = ['عاجل', 'خطر', 'مصيبة', 'مشكلة كبيرة', 'كارثة', 'طوارئ', 'انقذني', 'شسوي', 'الحقوني', 'طاحت', 'urgent', 'danger', 'crisis', 'emergency', 'help', 'save me'];
    if (urgentWords.some(w => lowQ.includes(w))) return { type: 'urgent', intent: 'rescue', emotion: 'panic' };
    
    // Emotional / Psychological Conflict / Needs Safety
    const emotionalWords = ['كذب', 'يخفي', 'خوف', 'قلق', 'توتر', 'مكتئب', 'حزين', 'ضايق خلقي', 'مهموم', 'مخنوق', 'lie', 'hide', 'fear', 'anxiety', 'stress', 'depressed', 'sad'];
    if (emotionalWords.some(w => lowQ.includes(w))) return { type: 'emotional', intent: 'safety', emotion: 'vulnerability' };

    // Behavioral / Aggression / Resistance / Expression
    const behavioralWords = ['غضب', 'يصارخ', 'عناد', 'يرفض', 'تحدي', 'يضرب', 'يعاند', 'ما يسمع', 'نجرة', 'يقهر', 'angry', 'scream', 'stubborn', 'refuse', 'challenge', 'hit', 'frustrated'];
    if (behavioralWords.some(w => lowQ.includes(w))) return { type: 'behavioral', intent: 'expression', emotion: 'frustration' };

    // Strategic / Planning / Decision / Development
    const strategicWords = ['خطة', 'هدف', 'مشروع', 'مستقبل', 'قرار', 'طموح', 'plan', 'goal', 'project', 'future', 'decision', 'ambition'];
    if (strategicWords.some(w => lowQ.includes(w))) return { type: 'strategic', intent: 'development', emotion: 'focus' };

    // Understanding / Explanation / Logical / Curiosity
    const understandingWords = ['ليش', 'شلون', 'كيف', 'مفاهيم', 'شرح', 'فهم', 'why', 'how', 'concept', 'explain', 'understand'];
    if (understandingWords.some(w => lowQ.includes(w))) return { type: 'explanation', intent: 'understanding', emotion: 'curiosity' };

    return { type: 'mixed_general', intent: 'observation', emotion: 'neutral' };
  };

  const getDynamicInsights = () => {
    const { emotion, type, intent } = getIntentAndEmotion(query);
    const base = language === 'ar' ? [
      "كل سلوك هو رسالة...دعنا نفهم ما وراء السطح.",
      "الهدوء والوعي الإدراكي هما أقوى أدوات الإدارة.",
      "الحلول الاستراتيجية تُبنى بالتدرج والملاحظة.",
      "فهم السياق يسبق اتخاذ القرار دائماً.",
      "الرؤية الشاملة تفتح أبواب الحلول المبتكرة."
    ] : [
      "Every behavior is a message...let's understand what's beneath.",
      "Calmness and awareness are the strongest management tools.",
      "Strategic solutions are built gradually.",
      "Understanding context always precedes decision making.",
      "A holistic view opens the door to innovative solutions."
    ];

    if (type === 'urgent') {
      return language === 'ar' ? 
        ["في المواقف العاجلة، الخطوة الأولى هي التهدئة", "تجنب القرارات الانفعالية أثناء الأزمات الحادة", ...base] : 
        ["In urgent situations, the first step is de-escalation", "Avoid impulsive decisions during acute crises", ...base];
    }
    if (type === 'behavioral' || emotion === 'frustration') {
      return language === 'ar' ? 
        ["المقاومة غالباً ما تكون وسيلة تواصل غير ناضجة", "افصل بين السلوك وبين الشخص نفسه", ...base] : 
        ["Resistance is often an immature form of communication", "Separate the behavior from the person", ...base];
    }
    if (type === 'emotional' || emotion === 'fear' || emotion === 'vulnerability') {
      return language === 'ar' ? 
        ["الصدق والمصارحة تُبنى بالثقة لا بالخوف", "الاحتواء العاطفي هو المفتاح الأول في هذه الحالة", ...base] : 
        ["Honesty is built on trust, not fear", "Emotional containment is the first key in this state", ...base];
    }
    if (emotion === 'frustration' || intent === 'expression') {
      return language === 'ar' ? 
        ["خلف كل صرخة حاجة لم تُلبَ", "هدوؤك هو قدوته الأولى في استرجاع السيطرة على النفس", ...base] : 
        ["Behind every scream is an unmet need", "Your calm is their first example of regaining self-control", ...base];
    }
    if (intent === 'identity') {
      return language === 'ar' ? 
        ["العناد غالباً ما يكون صرخة لاستقلال الشخصية", "امنحه خيارات بدلاً من الأوامر المباشرة", ...base] :
        ["Stubbornness is often a cry for independent personality", "Give them choices instead of direct orders", ...base];
    }
    return base;
  };

  const dynamicInsights = useMemo(getDynamicInsights, [query, language]);

  useEffect(() => {
    let interval: any;
    if (isThinking) {
      interval = setInterval(() => {
        setInsightIndex(prev => (prev + 1) % dynamicInsights.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isThinking, dynamicInsights]);

  const handleSubmit = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = overrideQuery || query;
    console.log('[SmartGateway] Search triggered. Query:', activeQuery);
    
    if (!activeQuery.trim()) {
      console.log('[SmartGateway] Search blocked: active query is empty');
      setErrorMsg(language === 'ar' ? 'اكتب موقفك أولاً' : 'Write your situation first');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    if (overrideQuery) setQuery(overrideQuery);
    setShowResumePrompt(false);

    if (activeQuery.trim()) {
        try {
            const historyStr = localStorage.getItem('tibyan_search_history');
            let historyList = historyStr ? JSON.parse(historyStr) : [];
            if (!historyList.includes(activeQuery)) {
                historyList.unshift(activeQuery);
                historyList = historyList.slice(0, 50); // keep recent 50
                localStorage.setItem('tibyan_search_history', JSON.stringify(historyList));
            }
        } catch (e) {}
    }

    // Intercept fluid navigation commands
    const qLower = activeQuery.toLowerCase();
    const navMatch = tabs?.find(t => 
      qLower.includes('افتح') && qLower.includes(t.label.toLowerCase()) || 
      qLower.includes('open') && qLower.includes(t.label.toLowerCase())
    );

    if (navMatch) {
        setIsThinking(true);
        setTimeout(() => {
            setIsThinking(false);
            handleTabChange(navMatch.id as any);
        }, 600); // short transition effect
        return;
    }

    // Analytics: Log search
    logEvent('search', language, activeQuery);
    addToHistory(activeQuery);

    detectEmotion(activeQuery).then(emo => {
      setEmotion(emo);
    }).catch(console.error);

    // Caching check
    const cacheKey = `tebyan_cache_v1_${activeQuery.trim().toLowerCase()}`;
    const isCached = localStorage.getItem(cacheKey);

    setHasSearched(false);
    setIsThinking(true);
    sessionStorage.setItem('tebyan_current_query', activeQuery);
    sessionStorage.setItem('tebyan_current_has_searched', 'false');
    
    // Performance: Faster analysis if cached, or just reduced base delay
    const delay = 50; // Ultra fast, no fake loading delay 
    
    setTimeout(() => {
        // Phase 2: Show initial insight if available
        if (!isCached) {
            logEvent('feature_use', language, activeQuery, { phase: 'pre_insight' });
        }
    }, delay * 0.4);

    setTimeout(() => {
      setIsThinking(false);
      setHasSearched(true);
      setSuggestion('');
      sessionStorage.setItem('tebyan_current_has_searched', 'true');
      setSelectionFeedback('');
      localStorage.setItem(cacheKey, 'true'); // Flag it as "seen" to speed up next time
      console.log('[SmartGateway] Analysis complete.');
    }, delay);
  };

  const handlePathSelect = (id: string, q: string) => {
    console.log('[SmartGateway] Path selected triggered:', id, 'with query:', q);
    
    // Save usage stats for ranking boost
    try {
      const stats = JSON.parse(localStorage.getItem('tebyan_usage_stats') || '{}');
      stats[id] = (stats[id] || 0) + 1;
      localStorage.setItem('tebyan_usage_stats', JSON.stringify(stats));
    } catch (e) { console.warn('Failed to save usage stats', e); }

    // Analytics: Log path selection
    logEvent('path_select', language, q, { pathId: id });
    
    setSelectionFeedback('');
    setSuggestion('');
    
    onPathSelect(id, q);
  };

  const currentLevelObj = useMemo(() => {
    return [...levels].reverse().find(l => sageProgress.points >= l.min) || levels[0];
  }, [sageProgress.points]);

  const followUpPrompts = useMemo(() => {
    if (!query || query.length < 5) return [];
    const q = query.toLowerCase();
    if (q.includes('كذب') || q.includes('lie')) return [
        { ar: 'كيف أبني الثقة مجدداً؟', en: 'How to rebuild trust?' },
        { ar: 'ما هي دوافع الكذب في هذا العمر؟', en: 'Why do they lie at this age?' }
    ];
    if (q.includes('غضب') || q.includes('angry')) return [
        { ar: 'تمارين هدوء فورية', en: 'Immediate calming exercises' },
        { ar: 'خطوات احتواء الموقف', en: 'Steps to contain the situation' }
    ];
    return [
        { ar: 'أقترح لي خطة عمل تفصيلية', en: 'Suggest a detailed action plan' },
        { ar: 'ما هي المخاطر المحتملة؟', en: 'What are the potential risks?' }
    ];
  }, [query, language]);

  const ALL_CHIP_SUGGESTIONS = [
    { ar: 'ابني يدخن وعمره 15 سنة، شسوي؟', en: 'My son is smoking and he is 15, what should I do?' },
    { ar: 'كيف أتعامل مع ابني المراهق العنيد؟', en: 'How to deal with my stubborn teenage son?' },
    { ar: 'ولدي ما يسمع الكلام وكله يعاندني بالبيت', en: 'My son doesnt listen and always rebels at home' },
    { ar: 'رفيجي بالدوام وايد يذم فيني قفاي، شلون أتصرف؟', en: 'My friend at work backbites me, how to behave?' },
    { ar: 'مديري بالدوام وايد يضغطني وشايل علي، شالحل؟', en: 'My boss pressures me and has a grudge, what is the solution?' },
    { ar: 'ابني يكذب علي باستمرار، ما الحل؟', en: 'My son lies to me constantly, what is the solution?' },
    { ar: 'طفلي يرفض الذهاب للمدرسة ويتمارض', en: 'My child refuses to go to school and fakes illness' },
    { ar: 'إدمان الأطفال على الألعاب الإلكترونية', en: 'Childrens addiction to electronic games' },
    { ar: 'كيف أغرس الصدق والأمانة في أطفالي؟', en: 'How to instill honesty and integrity in my children?' },
    { ar: 'توسعة النشاط التجاري المتعثر', en: 'Expanding a struggling business' },
    { ar: 'إقناع المستثمرين بتمويل المشروع', en: 'Persuading investors to fund the project' },
    { ar: 'إدارة أزمة ثقة حادة داخل الفريق', en: 'Managing a severe trust crisis within the team' },
    { ar: 'الموازنة بين العقل والعاطفة في القرار', en: 'Balancing mind and emotion in decisions' },
    { ar: 'ابتكار نموذج عمل تنافسي وجريء', en: 'Innovating a competitive and bold business model' },
    { ar: 'استراتيجيات التفاوض مع طرف عنيد', en: 'Negotiation strategies with a stubborn party' },
    { ar: 'تحليل المنافسين وتوقع خطواتهم القادمة', en: 'Analyzing competitors and predicting their next moves' },
    { ar: 'قرار مصيري بشأن تغيير المسار المهني', en: 'Critical decision about career path change' }
  ];

  const chipSuggestions = useMemo(() => {
    return [...ALL_CHIP_SUGGESTIONS].sort(() => 0.5 - Math.random()).slice(0, 7);
  }, []);

  const allPossibleQueries = useMemo(() => {
    const list = [
      ...ALL_CHIP_SUGGESTIONS.map(s => language === 'ar' ? s.ar : s.en),
      ...DAILY_CHALLENGES.map(c => language === 'ar' ? c.titleAr : c.titleEn),
      ...proactiveInsights.dynamicSuggests.map(s => language === 'ar' ? s.ar : s.en),
      ...searchHistory
    ];
    return Array.from(new Set(list)).filter(s => typeof s === 'string' && s.length > 0);
  }, [language, proactiveInsights.dynamicSuggests, searchHistory]);

  useEffect(() => {
    const currentText = query.trim();

    if (!currentText || currentText.length < 6) {
      setSuggestion("");
      return;
    }

    const requestId = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        setIsSuggestionLoading(true);
        const textAtRequestTime = latestInputRef.current.trim();

        if (!textAtRequestTime || textAtRequestTime.length < 6) {
          setSuggestion("");
          return;
        }

        const prompt = `
أكمل الجملة التالية كمقترح بحث ذكي لتطبيق تبيان.

النص الحالي:
"${textAtRequestTime}"

الشروط:
- أكمل المعنى بناءً على النص الكامل الحالي
- لا تغيّر نية المستخدم
- استخدم نفس اللهجة والأسلوب
- اجعل الاقتراح قصير ومفيد
- لا تعطِ إجابة، فقط أكمل صياغة السؤال أو المشكلة
- لا تكرر النص إذا كان كاملاً
`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });

        const aiSuggestion = response.text?.trim() || '';

        // Validate stale request
        if (
          requestId !== requestIdRef.current ||
          latestInputRef.current.trim() !== textAtRequestTime
        ) {
          return;
        }

        setSuggestion(aiSuggestion || "");
      } catch (error) {
        console.error("Smart autocomplete failed:", error);
        setSuggestion("");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSuggestionLoading(false);
        }
      }
    }, 700);

    return () => {
      clearTimeout(timer);
    };
  }, [query, aiClient]);

  const smartResponse = useMemo(() => {
    if (query.trim().length < 5) return null;
    const q = query.toLowerCase();
    
    // Dynamic Analysis based on keywords
    let analysis = '';
    if (q.includes('كذب') || q.includes('كاذب') || q.includes('lie')) {
      analysis = language === 'ar' 
        ? `تحليلي لموقف (الكذب) في "${query}" يشير إلى حاجة ملحة لغرس قيمة الصدق بدلاً من العقاب فقط.` 
        : `My analysis of the (lying) situation in "${query}" suggests an urgent need to instill the value of honesty rather than just punishment.`;
    } else if (q.includes('خوف') || q.includes('يخاف') || q.includes('fear') || q.includes('afraid')) {
      analysis = language === 'ar'
        ? `يبدو أن "${query}" يعكس حالة من القلق أو عدم الأمان، التدخل هنا يتطلب بناء جسر ثقة أولاً.`
        : `It seems "${query}" reflects a state of anxiety or insecurity; intervention here requires building a bridge of trust first.`;
    } else if (q.includes('غضب') || q.includes('صراخ') || q.includes('angry') || q.includes('scream')) {
      analysis = language === 'ar'
        ? `نوبة الغضب الموصوفة في "${query}" غالباً ما تكون وسيلة تواصل غير ناضجة لمشاعر مكبوتة.`
        : `The anger episode described in "${query}" is often an immature communication method for suppressed feelings.`;
    } else if (q.includes('شخص') || q.includes('مدير') || q.includes('زميل') || q.includes('person') || q.includes('team')) {
      analysis = language === 'ar'
        ? `الموقف في "${query}" يحتاج موازنة بين الحزم وبين الاحتواء العاطفي لتجنب التصعيد.`
        : `The situation in "${query}" needs a balance between firmness and emotional containment to avoid escalation.`;
    } else {
      analysis = language === 'ar'
        ? `قمت بتحليل "${query}"، وأرى أن الحل الأمثل يكمن في التعامل مع جذور المشكلة لا أعراضها فقط.`
        : `I analyzed "${query}", and I see that the optimal solution lies in dealing with the roots of the problem, not just its symptoms.`;
    }

    return analysis;
  }, [query, language]);

  const suggestions = useMemo(() => {
    const q = query.toLowerCase();
    const ranked: any[] = [];
    const { intent, emotion } = getIntentAndEmotion(query);
    
    console.log('[SmartGateway] STARTING ANALYSIS FOR:', q, { intent, emotion });

    // Scoring helpers with dynamic reasoning and categorization
    const addPath = (id: string, category: string, labelAr: string, labelEn: string, icon: any, descAr: string, descEn: string, reasonAr: string, reasonEn: string, score: number) => {
      // Avoid duplicates
      if (ranked.some(r => r.id === id)) return;

      // Personalization booster
      const usageStats = JSON.parse(localStorage.getItem('tebyan_usage_stats') || '{}');
      const localUsage = (usageStats[id] || 0);
      const boost = localUsage * 0.7; // Stronger local weight
      
      // Style Synergy Booster
      let styleBoost = 0;
      
      let finalScore = score + boost + styleBoost;
      
      // Intent/Emotion fallback boosts (gives an edge when keywords fail)
      if (intent === 'defense' || emotion === 'fear') {
          if (id === 'council') finalScore += 3;
          if (id === 'story') finalScore += 2;
          if (id === 'qawlfasl') finalScore += 1;
      }
      if (intent === 'expression' || emotion === 'frustration') {
          if (id === 'simulation') finalScore += 3;
          if (id === 'qawlfasl') finalScore += 2.5;
          if (id === 'council') finalScore += 1;
      }
      if (intent === 'development' || emotion === 'focus') {
          if (id === 'roadmap') finalScore += 4;
          if (id === 'quizzes') finalScore += 3;
      }
      if (intent === 'understanding' || emotion === 'curiosity') {
          if (id === 'oracle') finalScore += 4;
          if (id === 'concepts') finalScore += 3;
          if (id === 'mindmap') finalScore += 2;
      }

      // Dynamic reasoning adjustment based on style/keywords
      let refinedReasonAr = reasonAr;
      let refinedReasonEn = reasonEn;

      if (id === 'council') {
        refinedReasonAr = 'لأنك تفضل عادةً الفهم العميق المتأني لكل زوايا الموقف';
        refinedReasonEn = 'Because you usually prefer a deep, careful understanding of all angles';
      }

      ranked.push({
        id,
        category,
        label: language === 'ar' ? labelAr : labelEn,
        icon,
        desc: language === 'ar' ? descAr : descEn,
        reason: language === 'ar' ? refinedReasonAr : refinedReasonEn,
        weight: finalScore,
        isPersonalized: localUsage >= 3 || styleBoost > 0
      });
    };

    // --- DIMENSION MAPPING ---
    
    // 1. Action (Solution Bank)
    const actionMatch = !q || q.includes('حل') || q.includes('سؤال') || q.includes('كيف') || q.includes('عاجل') || q.includes('طوارئ') || q.includes('قرار') || q.includes('solve');
    addPath('qawlfasl', 'action', 'قول فصل', 'Solution Bank', Zap, 'حلول وقرارات مباشرة', 'Direct certified answer', 'لأن الحالة تتطلب توجيهاً عملياً وقراراً واضحاً في هذه اللحظة', 'Because you seek direct practical guidance', actionMatch ? 10 : 2);
    
    // 2. Analysis (Expert Council)
    const analysisMatch = !q || q.includes('لماذا') || q.includes('سبب') || q.includes('تحليل') || q.includes('موقف') || q.includes('حالة') || q.includes('سياق') || q.includes('why') || q.includes('reason');
    addPath('strategicarena', 'analysis', 'الميدان الاستراتيجي', 'Strategic Arena', BrainCircuit, 'تحليل ومحاكاة استراتيجية', 'Analysis and simulation', 'ميدان متكامل لتحليل المواقف، المحاكاة، واستعراض الأبعاد الزمنية للقرارات', 'Integrated arena for situation analysis, simulation, and temporal dimensions', analysisMatch ? 12 : 3);

    // 2b. Predictive Radar
    const analyticsMatch = !q || q.includes('نبض') || q.includes('رادار') || q.includes('توقع') || q.includes('سلوك') || q.includes('متابعة') || q.includes('تحليل') || q.includes('بيانات') || q.includes('pulse') || q.includes('analytics') || q.includes('radar') || q.includes('analysis') || q.includes('data');
    addPath('knowledgecenter', 'analysis', 'مركز المعرفة', 'Knowledge Center', Activity, 'الرادار والنتائج', 'Predictive Radar & Analytics', 'لقياس مدى التحسن في النتائج والتنبؤ بالسلوكيات', 'To measure performance and behavior trends', analyticsMatch ? 11 : 3);

    // 3. Simulation (Simulator)
    const simMatch = !q || q.includes('تدريب') || q.includes('تجربة') || q.includes('حوار') || q.includes('مواجهة') || q.includes('كذب') || q.includes('عناد') || q.includes('angry') || q.includes('train') || q.includes('practice') || q.includes('تقمص') || q.includes('دور') || q.includes('roleplay');
    addPath('strategicarena', 'simulation', 'الميدان الاستراتيجي', 'Strategic Arena', Gamepad2, 'تدريب واقعي ومحاكاة', 'Realistic training and simulation', 'لأن المواجهة تحتاج تدريب ومحاكاة لضمان أفضل نتيجة', 'Because confrontation needs simulation and practice', simMatch ? 11 : 3);

    // 4. Roadmap (Success Plan)
    const roadMatch = !q || q.includes('خطة') || q.includes('طريق') || q.includes('خطوات') || q.includes('برمجة') || q.includes('عناد') || q.includes('plan') || q.includes('steps') || q.includes('coding') || q.includes('program');
    addPath('knowledgecenter', 'roadmap', 'مركز المعرفة', 'Knowledge Center', Route, 'خارطة طريق ونتائج', 'Roadmap and metrics', 'لأن الموقف يحتاج خطة زمنية واضحة ومتابعة دقيقة للنتائج', 'For clear timelines and performance metrics', roadMatch ? 11 : 3);

    // 5. Narrative (Storyteller)
    const storyMatch = !q || q.includes('قصة') || q.includes('شخص') || q.includes('حكاية') || q.includes('تبسيط') || q.includes('كذب') || q.includes('story') || q.includes('tell');
    addPath('creativelab', 'story', 'المختبر الإبداعي', 'Creative Lab', MessageCircleQuestion, 'تحويل الموقف لقصة وفكرة', 'Turn into story/concept', 'لأن القصص والأفكار الإبداعية هي أسرع وسيلة لإيصال المعنى', 'Because stories and creative concepts are the fastest way to convey meaning', storyMatch ? 9 : 2);

    // 6. Innovation (Omni Counselor <button Concepts)
    const innovMatch = !q || q.includes('فكرة') || q.includes('جديد') || q.includes('ابتكار') || q.includes('تغيير') || q.includes('استراتيجية') || q.includes('innovation') || q.includes('creative') || q.includes('سؤال') || q.includes('مشورة');
    addPath('oracle', 'innovation', 'المستشار الكلي', 'Omni Counselor', Command, 'حوار استراتيجي شامل', 'Comprehensive cognitive dialogue', 'للحصول على مشورة حكيمة تدمج بين علوم السلوك والاستراتيجية', 'For wise advice integrating behavior and strategy', innovMatch ? 8.5 : 1.5);
    addPath('creativelab', 'innovation', 'المختبر الإبداعي', 'Creative Lab', Sparkles, 'هندسة الابتكار والأفكار', 'Idea & Innovation Engineering', 'لأنك تحتاج إلى تفكيك الموقف وابتكار وسائل جديدة للحل', 'To deconstruct the situation and innovate new solutions', innovMatch ? 8.5 : 2);
    addPath('creativelab', 'innovation', 'المختبر الإبداعي', 'Creative Lab', Zap, 'أدوات التصميم والحلول', 'Strategic design tools', 'لتحليل الأدوات المتاحة للموقف وابتكار وسائل جديدة للحل', 'To analyze available tools and innovate new ones', innovMatch ? 6 : 1);
    
    // 7. Visualization/Thinking Tools
    const thinkMatch = !q || q.includes('رسم') || q.includes('توضيح') || q.includes('بصري') || q.includes('هيكلة') || q.includes('think') || q.includes('map');
    addPath('knowledgecenter', 'thinking', 'مركز المعرفة', 'Knowledge Center', Network, 'هيكلة بصرية للأفكار', 'Visual thought structure', 'لتنظيم شتات الأفكار واستكشاف الروابط المعرفية', 'To organize thoughts and explore knowledge connections', thinkMatch ? 8 : 2);
    addPath('knowledgecenter', 'thinking', 'مركز المعرفة', 'Knowledge Center', Network, 'روابط الأفكار المكتشفة', 'Neural knowledge structure', 'لاستكشاف كيف تترابط أبحاثك وأفكارك في شبكة واحدة', 'To explore how your research and ideas interconnect', thinkMatch ? 8 : 2);
    addPath('strategicarena', 'analysis', 'الميدان الاستراتيجي', 'Strategic Arena', Hourglass, 'تأمل وحوار عبر الزمن', 'Journey through time', 'لفهم كيف تطور المفهوم عبر العصور وتوقع مستقبله', 'To understand how the concept evolved and predict its future', thinkMatch ? 8 : 2);
    
    // 8. Specialized Labs
    const specializedMatch = !q || q.includes('قرار') || q.includes('خيار') || q.includes('أزمة') || q.includes('تنفيذي') || q.includes('استراتيجي') || q.includes('decision') || q.includes('strategic') || q.includes('executive');
    addPath('decisionroom', 'innovation', 'غرفة القرار', 'Decision Room', Lock, 'مختبر القرارات الاستراتيجية', 'Strategic decision lab', 'لتحليل الخيارات المعقدة واتخاذ قرارات مصيرية بناءً على محاور القوة والمخاطر', 'To analyze complex choices and make critical decisions', specializedMatch ? 12 : 2);
    
    addPath('knowledgecenter', 'roadmap', 'مركز المعرفة', 'Knowledge Center', ClipboardCheck, 'قياس الفجوة', 'Measure gap', 'للتأكد من استيعاب السياق أو المفهوم قبل البدء في التطبيق', 'To ensure core context is understood before applying', roadMatch ? 8 : 2);
    

    // Sort by weight descending
    ranked.sort((a, b) => (b.weight || 0) - (a.weight || 0));

    console.log('[SmartGateway] RESULTS FOUND:', ranked.length);
    console.log('[SmartGateway] IDS:', ranked.map(r => r.id));

    return ranked;
  }, [query, language]);

  // Split suggestions into three tiers
  const { primarySuggestion, secondarySuggestions, alternativeSuggestions } = useMemo(() => {
    const primary = suggestions[0] || null;
    const secondary = suggestions.slice(1, 3);
    const alternative = suggestions.slice(3, 12);
    
    return { 
      primarySuggestion: primary, 
      secondarySuggestions: secondary, 
      alternativeSuggestions: alternative 
    };
  }, [suggestions]);

  /* useEffect for typing indicator removed to prevent conflict with handleSubmit */

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-2 flex flex-col min-h-0">
      {/* Hero / Search Section - Pulled higher, balanced */}
      <div className="flex flex-col mt-2 md:mt-4 mb-8 md:mb-12">
        
        {/* Title Section always visible */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4 md:mb-6"
          >
             <header className="text-center">
        
                <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="text-zinc-500 font-bold text-sm mb-2"
                >
                   {language === 'ar' ? proactiveInsights.arSub : proactiveInsights.enSub}
                </motion.div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black tracking-tighter leading-[0.9] mb-4 md:mb-6">
                  {language === 'ar' ? proactiveInsights.arG.split(' ')[0] : proactiveInsights.enG.split(' ')[0]}<br/>
                  <span className="text-zinc-400 italic">
                      {language === 'ar' 
                          ? proactiveInsights.arG.split(' ').slice(1).join(' ') 
                          : proactiveInsights.enG.split(' ').slice(1).join(' ')}
                  </span>
                </h1>
             </header>
          </motion.div>

        <AnimatePresence>
            {showStylePicker && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-8 bg-white border border-zinc-100 p-6 rounded-[32px] shadow-2xl space-y-6 text-right"
                >
                    <div className="flex items-center justify-between">
                        <button onClick={() => setShowStylePicker(false)} className="text-zinc-400 hover:text-black">
                            <X className="w-5 h-5" />
                        </button>
                        <h4 className="font-black text-zinc-800">
                            {language === 'ar' ? 'كيف تفضل أن تتعلم؟' : 'How do you prefer to learn?'}
                        </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            { id: 'practical', labelAr: 'عملي (حلول سريعة)', labelEn: 'Practical (Fast solutions)', icon: Zap },
                            { id: 'analytical', labelAr: 'تحليلي (فهم عميق)', labelEn: 'Analytical (Deep insight)', icon: BrainCircuit },
                            { id: 'simulation', labelAr: 'تدريبي (محاكاة)', labelEn: 'Simulation (Practice)', icon: Gamepad2 }
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => confirmStyle(s.id as any)}
                                className={cn(
                                    "p-4 rounded-2xl border text-right transition-all group flex flex-col gap-3",
                                    "bg-white border-zinc-100 hover:border-black"
                                )}
                            >
                                <s.icon className={cn("w-6 h-6", "text-zinc-400 group-hover:text-black")} />
                                <div>
                                    <div className="font-black text-sm">{language === 'ar' ? s.labelAr : s.labelEn}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[40vh]">
        <form 
          onSubmit={handleSubmit}
          className="w-full max-w-4xl flex flex-col items-center"
        >
          <div className="w-full relative flex flex-col items-center mt-12 mb-12 group">

            {isThinking && (
               <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full scale-150 animate-pulse pointer-events-none" />
            )}
            <div className={cn(
              "flex items-center w-full max-w-2xl rounded-3xl p-2 transition-all duration-300",
              isFocused ? "shadow-xl border-zinc-300 ring-2 ring-zinc-100" : "shadow-sm border-zinc-200",
              getFluidStyles(),
              getFluidAmbient()
            )}>
              <div className="flex-1 relative flex items-center overflow-hidden">
                <input
                  ref={inputRef}
                  value={searchValue}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  placeholder={language === 'ar' ? "اكتب سؤالك أو مشكلتك..." : "Type your question or problem..."}
                  onKeyDown={(e) => {
                    if ((e.key === 'Tab' || e.key === 'Enter') && smartSuggestion && smartSuggestion.startsWith(searchValue)) {
                      e.preventDefault();
                      setSearchValue(smartSuggestion);
                      latestInputRef.current = smartSuggestion;
                      setQuery(smartSuggestion);
                      setSmartSuggestion('');
                    } else if (e.key === 'Enter') {
                      // Let normal submit take over
                    } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && smartSuggestion && smartSuggestion.startsWith(searchValue)) {
                      if (e.currentTarget.selectionStart === searchValue.length) {
                        e.preventDefault();
                        setSearchValue(smartSuggestion);
                        latestInputRef.current = smartSuggestion;
                        setQuery(smartSuggestion);
                        setSmartSuggestion('');
                      }
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full bg-transparent border-none outline-none p-4 text-base md:text-xl font-bold text-black placeholder:text-zinc-400 z-10 relative"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  autoFocus
                />
                
                {smartSuggestion && smartSuggestion.startsWith(searchValue) && (
                  <div 
                    className="pointer-events-none absolute inset-0 flex items-center px-4 text-base md:text-xl font-bold z-0"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <span className="invisible whitespace-pre">{searchValue}</span>
                    <span className="whitespace-pre text-zinc-300">{smartSuggestion.slice(searchValue.length)}</span>
                  </div>
                )}
              </div>

              
              <button 
                type="submit"
                className={cn(
                  "bg-black text-white p-3 md:p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0",
                  query.length > 0 ? "opacity-100" : "opacity-30 pointer-events-none"
                )}
              >
                  <Search className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

          </div>

          <AnimatePresence>
            {selectionFeedback  && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-14 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-3 rounded-full text-sm font-black shadow-2xl z-50 whitespace-nowrap"
              >
                {selectionFeedback}
              </motion.div>
            )}

            {errorMsg  && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-6 py-2 rounded-full text-xs font-black shadow-xl"
              >
                {errorMsg}
              </motion.div>
            )}

            {(isThinking || hasSearched)  && (
              <motion.div
                key="desktop-suggestions"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-zinc-100 mt-2 p-4 hidden md:block space-y-4"
              >
                {isThinking ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-6">
                    <div className="relative w-full max-w-sm h-20 flex flex-col items-center justify-center overflow-hidden gap-4">
                       <AIHeartbeat className="opacity-50" />
                       <AnimatePresence mode="popLayout">
                          <TypographicAcoustic
                             key={loadingPhraseIndex}
                             type="snap"
                             className="text-black font-black text-xl text-center w-full"
                          >
                             {language === 'ar' ? loadingPhrasesAr[loadingPhraseIndex] : loadingPhrasesEn[loadingPhraseIndex]}
                          </TypographicAcoustic>
                       </AnimatePresence>
                    </div>
                    
                    <div className="text-center space-y-4 max-w-sm mx-auto px-4">
                        <AnimatePresence mode="wait">
                            {smartResponse  && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-4"
                                >
                                    <div className="flex items-center gap-2 mb-2 justify-center">
                                        <Sparkles className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[11px] leading-[1.6] font-black text-emerald-600 uppercase tracking-widest">
                                            {language === 'ar' ? 'استنتاج أولي' : 'Initial Insight'}
                                        </span>
                                    </div>
                                    <p className="text-emerald-900 font-bold text-sm leading-relaxed">
                                        {smartResponse}
                                    </p>
                                </motion.div>
                            )}
                            
                            <TypographicAcoustic
                                key={insightIndex}
                                type="whisper"
                                className="min-h-[60px] flex items-center justify-center italic text-base leading-relaxed"
                            >
                                "{dynamicInsights[insightIndex]}"
                            </TypographicAcoustic>
                        </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <>
                    {smartResponse  && (
                        <motion.div 
                            key="smart-response-bubble"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl flex items-start gap-3"
                        >
                            <Sparkles className="w-5 h-5 text-zinc-400 shrink-0 mt-1" />
                            <p className="text-sm font-bold text-zinc-700 leading-relaxed">{smartResponse}</p>
                        </motion.div>
                    )}

                    <div className="space-y-8">
                       <div className="md:grid grid-cols-12 gap-8 mt-8">
                          <div className="col-span-12 md:col-span-8">
                              {/* Focus Layer: Primary Suggestion */}
                              {primarySuggestion  && (
                                  <div className="space-y-4">
                                      <div className="px-4 py-2 text-[11px] font-black text-emerald-600 uppercase tracking-widest border-b border-zinc-100 flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                           <span>{language === 'ar' ? 'المسار الأنسب لمطابقتك' : 'YOUR STRONGEST MATCH'}</span>
                                           <Zap className="w-3 h-3" />
                                         </div>
                                      </div>
                                      
                                      <button
                                        type="button"
                                        onClick={() => handlePathSelect(primarySuggestion.id, query)}
                                        className="w-full flex-col md:flex-row flex md:items-center justify-between p-6 md:p-10 rounded-[32px] md:rounded-[48px] transition-all group text-right border active:scale-[0.98] bg-black text-white hover:bg-zinc-900 border-black shadow-2xl relative overflow-hidden"
                                      >
                                         <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 relative z-10 w-full md:w-auto">
                                             <div className="w-14 h-14 md:w-20 md:h-20 rounded-[20px] md:rounded-[32px] bg-white/10 flex items-center justify-center transition-all group-hover:scale-110 shrink-0 self-end md:self-auto">
                                                 {(() => { const Icon = primarySuggestion.icon; return <Icon className="w-7 h-7 md:w-10 md:h-10" />; })()}
                                             </div>
                                             <div className="text-right w-full">
                                                 <div className="flex items-center gap-2 mb-1 md:mb-2 justify-end md:justify-start">
                                                    <h3 className="text-2xl md:text-3xl font-black">{primarySuggestion.label}</h3>
                                                 </div>
                                                 <p className="text-sm md:text-base font-bold opacity-80 max-w-md">
                                                     {primarySuggestion.reason || primarySuggestion.desc}
                                                 </p>
                                             </div>
                                         </div>
                                         <div className="mt-6 md:mt-0 relative z-10 w-full md:w-auto text-center md:text-right">
                                            <div className="w-full md:w-auto inline-flex justify-center items-center gap-3 md:gap-4 bg-white/10 px-6 md:px-8 py-3 md:py-3 rounded-full md:group-hover:bg-emerald-500 transition-all">
                                               <span className="font-bold text-sm">{language === 'ar' ? 'البدء' : 'Start'}</span>
                                               <ArrowLeft className={cn("w-4 h-4 md:w-5 md:h-5", language === 'ar' ? "group-hover:-translate-x-2" : "rotate-180 group-hover:translate-x-2")} />
                                            </div>
                                         </div>
                                      </button>
                                  </div>
                              )}

                              {/* Focus Layer: Secondary Options */}
                              {secondarySuggestions.length > 0  && (
                                  <div className="mt-8 pt-8 border-t border-zinc-100">
                                     <h4 className="text-[11px] leading-[1.6] font-black text-zinc-400 uppercase tracking-widest mb-4 px-2">
                                        {language === 'ar' ? 'خيارات إضافية للموقف' : 'SECONDARY OPTIONS'}
                                     </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {secondarySuggestions.map((s) => {
                                           const Icon = s.icon;
                                           return (
                                             <button
                                               key={`sec-${s.id}`}
                                               type="button"
                                               onClick={() => handlePathSelect(s.id, query)}
                                               className="flex items-center justify-between p-4 rounded-[24px] transition-all group text-right border bg-white border-zinc-200 hover:border-black active:scale-95 shadow-sm"
                                             >
                                              <div className="flex items-center gap-4">
                                                  <div className="w-10 h-10 rounded-[16px] bg-zinc-100 text-zinc-400 group-hover:bg-black group-hover:text-white transition-all flex items-center justify-center">
                                                      <Icon className="w-5 h-5" />
                                                  </div>
                                                  <div className="text-right">
                                                      <h4 className="text-sm font-black text-black">{s.label}</h4>
                                                      <p className="text-[11px] leading-[1.6] text-zinc-500 font-bold mt-1 line-clamp-1">{s.desc}</p>
                                                  </div>
                                              </div>
                                              <ArrowLeft className={cn("w-4 h-4 text-zinc-300 group-hover:text-black", language === 'ar' ? "" : "rotate-180")} />
                                             </button>
                                           );
                                        })}
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* Alternative Paths */}
                          <div className="col-span-12 md:col-span-4 space-y-4">
                             <h4 className="text-[11px] leading-[1.6] font-black text-zinc-400 uppercase tracking-widest px-2">
                                 {language === 'ar' ? 'مسارات أخرى' : 'ALTERNATIVE PATHS'}
                             </h4>
                             <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                                {alternativeSuggestions.map((s: any) => {
                                   const Icon = s.icon;
                                   return (
                                     <button
                                       key={`alt-${s.id}`}
                                       type="button"
                                       onClick={() => handlePathSelect(s.id, query)}
                                       className="w-full flex items-center gap-3 p-3 rounded-[20px] transition-all group text-right bg-zinc-50 border border-transparent hover:border-zinc-200 active:scale-95"
                                     >
                                       <div className="w-8 h-8 rounded-xl bg-white text-zinc-400 flex items-center justify-center shadow-sm group-hover:text-black">
                                         <Icon className="w-4 h-4" />
                                       </div>
                                       <div className="text-right flex-1 min-w-0">
                                          <div className="font-bold text-xs text-zinc-800 truncate">{s.label}</div>
                                          <p className="text-[11px] leading-[1.6] text-zinc-500 font-bold mt-1 line-clamp-1">{s.desc}</p>
                                       </div>
                                     </button>
                                   );
                                })}
                             </div>
                          </div>
                       </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
            
            {/* Mobile simplified results */}
            {(isThinking || hasSearched)  && (
                 <motion.div 
                    key="mobile-suggestions"
                    className="md:hidden border-t px-4 py-6 space-y-6 max-h-[60vh] overflow-y-auto bg-white"
                 >
                    {isThinking ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-6">
                           <div className="relative w-full max-w-sm h-20 flex flex-col items-center justify-center overflow-hidden gap-4">
                               <AIHeartbeat className="opacity-50" />
                               <AnimatePresence mode="popLayout">
                                  <motion.p
                                     key={loadingPhraseIndex}
                                     initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
                                     animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                     exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }}
                                     transition={{ duration: 0.4 }}
                                     className="text-black font-black text-lg text-center w-full"
                                  >
                                     {language === 'ar' ? loadingPhrasesAr[loadingPhraseIndex] : loadingPhrasesEn[loadingPhraseIndex]}
                                  </motion.p>
                               </AnimatePresence>
                            </div>
                           
                           <div className="text-center space-y-3 px-4">
                                <AnimatePresence mode="wait">
                                    {smartResponse  && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-2"
                                        >
                                            <p className="text-emerald-900 font-bold text-xs leading-relaxed">
                                                {smartResponse}
                                            </p>
                                        </motion.div>
                                    )}

                                    <motion.div
                                        key={insightIndex}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="min-h-[50px] flex items-center justify-center"
                                    >
                                <p className="text-zinc-400 font-bold italic text-sm leading-relaxed px-6">
                                            "{dynamicInsights[insightIndex]}"
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                           </div>
                        </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Mobile Primary */}
                        {primarySuggestion  && (
                          <div className="space-y-3">
                             <span className="font-black text-[10px] text-zinc-400 uppercase tracking-widest px-2">{language === 'ar' ? 'المسار الأقوى' : 'TOP MATCH'}</span>
                             <button 
                               type="button"
                               onClick={() => handlePathSelect(primarySuggestion.id, query)}
                               className="w-full flex items-center justify-between p-6 bg-black text-white rounded-[32px] shadow-2xl border border-black active:scale-95 transition-all"
                             >
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                      {(() => { const Icon = primarySuggestion.icon; return <Icon className="w-6 h-6" />; })()}
                                   </div>
                                   <div className="text-right">
                                      <div className="font-black text-lg tracking-tight">{primarySuggestion.label}</div>
                                      <div className="text-[11px] leading-[1.6] opacity-60 font-bold">{language === 'ar' ? 'البداية الأسرع والأكثر فعالية' : 'Fastest and most effective start'}</div>
                                   </div>
                                </div>
                                <ArrowLeft className={cn("w-6 h-6", language === 'ar' ? "" : "rotate-180")} />
                             </button>
                          </div>
                        )}

                        {/* Mobile Secondary */}
                        {secondarySuggestions.length > 0  && (
                          <div className="space-y-3">
                             <span className="font-black text-[10px] text-zinc-400 uppercase tracking-widest px-2">{language === 'ar' ? 'أبعاد داعمة' : 'SUPPORTING'}</span>
                             <div className="grid grid-cols-1 gap-2">
                                {secondarySuggestions.map(s => {
                                  const Icon = s.icon;
                                  return (
                                    <button 
                                      key={`mob-sec-${s.id}`}
                                      type="button"
                                      onClick={() => handlePathSelect(s.id, query)}
                                      className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-[24px] border border-zinc-100 active:scale-95 transition-all"
                                    >
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-zinc-400 shadow-sm">
                                             <Icon className="w-5 h-5" />
                                          </div>
                                          <div className="text-right">
                                             <div className="font-bold text-sm text-zinc-900">{s.label}</div>
                                             <p className="text-[11px] leading-[1.6] text-zinc-500 font-bold mt-1 line-clamp-1">{s.desc}</p>
                                          </div>
                                       </div>
                                       <ArrowLeft className={cn("w-4 h-4 text-zinc-300", language === 'ar' ? "" : "rotate-180")} />
                                    </button>
                                  );
                                })}
                             </div>
                          </div>
                        )}

                        <div className="h-px bg-zinc-100 mx-4" />

                        {/* Mobile Alternative Paths */}
                        {alternativeSuggestions.length > 0  && (
                           <div className="space-y-3">
                              <span className="font-black text-[10px] text-zinc-400 uppercase tracking-widest px-2">{language === 'ar' ? 'مسارات أخرى' : 'ALTERNATIVE PATHS'}</span>
                              <div className="grid grid-cols-2 gap-2">
                                 {alternativeSuggestions.map((s: any) => {
                                    const Icon = s.icon;
                                     return (
                                      <div 
                                         key={`mob-rest-${s.id}`} 
                                         onClick={() => handlePathSelect(s.id, query)} 
                                         className="flex flex-col items-start gap-3 p-4 bg-white rounded-[24px] border border-zinc-100 hover:border-black active:scale-95 transition-all group cursor-pointer"
                                      >
                                         <div className="w-8 h-8 rounded-[12px] bg-zinc-50 text-zinc-400 group-hover:bg-black group-hover:text-white transition-all flex items-center justify-center">
                                            <Icon className="w-4 h-4" />
                                         </div>
                                         <div className="text-right">
                                            <div className="font-bold text-[11px] text-zinc-800">{s.label}</div>
                                            <p className="text-[11px] leading-[1.6] text-zinc-500 font-bold mt-1 line-clamp-1">{s.desc}</p>
                                         </div>
                                      </div>
                                    );
                                 })}
                              </div>
                           </div>
                        )}
                      </div>
                    )}
                 </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Dynamic Suggestion Chips */}
        <div className="mt-8 flex overflow-x-auto pb-4 gap-2 snap-x snap-mandatory no-scrollbar w-full max-w-full">
            {proactiveInsights.dynamicSuggests.map((chip, idx) => (
                <button
                    key={idx}
                    onClick={() => {
                        setQuery(language === 'ar' ? chip.ar : chip.en);
                        handleSubmit(undefined, language === 'ar' ? chip.ar : chip.en);
                        setIsFocused(true);
                    }}
                    className={cn(
                        "px-4 py-2 rounded-full border border-zinc-200 text-sm font-bold transition-all active:scale-95 shadow-sm whitespace-nowrap snap-center shrink-0 cursor-pointer",
                        "bg-white text-zinc-500 hover:border-black hover:text-black"
                    )}
                >
                    {language === 'ar' ? chip.ar : chip.en}
                </button>
            ))}
        </div>
      </div>
      </div>

      {/* Daily Challenge & Insights Section */}
      <div className="emotion-hide mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           className="bg-indigo-600 rounded-[24px] md:rounded-[40px] p-6 md:p-8 text-white relative overflow-hidden group"
        >
            <div className="relative z-10">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full w-fit mb-4 md:mb-6">
                    <Gamepad2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="text-[11px] leading-[1.6] uppercase font-black tracking-widest">{language === 'ar' ? 'تحدي اليوم' : 'DAILY CHALLENGE'}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4">
                    {language === 'ar' ? currentChallenge.titleAr : currentChallenge.titleEn}
                </h3>
                <p className="text-indigo-100 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed">
                    {language === 'ar' ? 'تحدَّ نفسك في المحاكي اليوم' : 'Challenge yourself in the simulator today'}
                </p>
                <button 
                    onClick={() => onPathSelect(currentChallenge.path as any, currentChallenge.query)}
                    className="w-full py-3 md:py-4 bg-white text-indigo-600 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-emerald-400 hover:text-white transition-all shadow-lg active:scale-95"
                >
                    {language === 'ar' ? 'ابدأ التحدي' : 'Start Challenge'}
                </button>
            </div>
            {/* Abstract background element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: -20 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           className="bg-white rounded-[24px] md:rounded-[40px] p-6 md:p-8 border border-zinc-200 flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full w-fit mb-4 md:mb-6">
                    <BrainCircuit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="text-[11px] leading-[1.6] uppercase font-black tracking-widest">{language === 'ar' ? 'رؤية المنصة' : 'PLATFORM INSIGHT'}</span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-black mb-4">
                    {language === 'ar' ? currentInsight.titleAr : currentInsight.titleEn}
                </h3>
                <div className="space-y-3 md:space-y-4">
                    {currentInsight.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 md:p-3 bg-zinc-50 rounded-xl">
                            <span className="text-xs md:text-sm font-bold text-zinc-700">{language === 'ar' ? item.labelAr : item.labelEn}</span>
                            <div className="h-1 md:h-1.5 w-16 md:w-24 bg-zinc-200 rounded-full overflow-hidden">
                                 <div className={`h-full ${item.color} w-[${item.pct}]`} style={{ width: item.pct }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <p className="mt-6 md:mt-8 text-[10px] md:text-[11px] text-zinc-400 font-bold uppercase tracking-widest text-center">
                {language === 'ar' ? 'تحليل 2000 حالة' : 'Based on 2000 cases'}
            </p>
        </motion.div>
      </div>

      {/* Quick Gates (Educational Tools) */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="emotion-hide mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-stretch gap-4 md:gap-8"
      >
          <div className="flex-1 p-8 bg-[#F6F5F0] rounded-[32px] border border-[#EBEAE4] flex flex-col justify-between gap-6 hover:border-[#A68F58]/40 transition-colors group cursor-pointer" onClick={() => handleTabChange('mylibrary')}>
              <div className="flex items-center gap-6 text-right">
                  <div className="w-16 h-16 rounded-[24px] bg-white flex items-center justify-center text-[#A68F58] shadow-sm transform group-hover:-translate-y-1 transition-transform">
                      <LibraryBig className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                      <h3 className="text-xl font-black text-[#2A2925] mb-1">
                          {language === 'ar' ? 'مكتبتك المفضلة' : 'Your Favorite Library'}
                      </h3>
                      <p className="text-[#6B6A65] font-bold text-sm">
                          {preferences.savedLibrary && preferences.savedLibrary.length > 0 ? (
                            language === 'ar' 
                              ? `لديك ${preferences.savedLibrary.length} مادة محفوظة للرجوع إليها.` 
                              : `You have ${preferences.savedLibrary.length} items saved for reference.`
                          ) : (
                            language === 'ar'
                              ? 'ابدأ بحفظ الإجابات.'
                              : 'Start saving answers.'
                          )}
                      </p>
                  </div>
              </div>
          </div>

        {/* <div className="flex-1 p-8 bg-black rounded-[32px] border border-zinc-800 flex flex-col justify-between gap-6 hover:border-black transition-colors group cursor-pointer relative overflow-hidden" onClick={() => handleTabChange('ar')}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 to-fuchsia-900/20 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-6 text-right relative z-10">
                  <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center text-white shadow-sm border border-white/20 transform group-hover:scale-110 transition-transform">
                      <Box className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                      <h3 className="text-xl font-black text-white mb-1">
                          {language === 'ar' ? 'فضاء تبيان (AR)' : 'Tibyan AR Space'}
                      </h3>
                      <p className="text-zinc-400 font-bold text-sm">
                          {language === 'ar' ? 'تجسيد الأفكار' : 'Materialize concepts'}
                      </p>
                  </div>
              </div>
          </div> */}

          <div className="flex-1 p-8 bg-zinc-950 rounded-[32px] border border-zinc-800 flex flex-col justify-between gap-6 hover:border-indigo-500/50 transition-colors group cursor-pointer relative overflow-hidden" onClick={() => handleTabChange('knowledgegraph')}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-screen pointer-events-none group-hover:opacity-30 transition-opacity"></div>
              <div className="flex items-center gap-6 text-right relative z-10">
                  <div className="w-16 h-16 rounded-[24px] bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm border border-indigo-500/30 transform group-hover:scale-110 transition-transform">
                      <Network className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                      <h3 className="text-xl font-black text-white mb-1">
                          {language === 'ar' ? 'الشبكة العصبية' : 'Knowledge Graph'}
                      </h3>
                      <p className="text-zinc-400 font-bold text-sm">
                          {language === 'ar' ? 'ارتباط الأفكار بوعيك' : 'How ideas connect'}
                      </p>
                  </div>
              </div>
          </div>

          <div className="flex-1 p-8 bg-zinc-950 rounded-[32px] border border-zinc-800 flex flex-col justify-between gap-6 hover:border-rose-500/50 transition-colors group cursor-pointer relative overflow-hidden" onClick={() => handleTabChange('ripple')}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-screen pointer-events-none group-hover:opacity-30 transition-opacity"></div>
              <div className="flex items-center gap-6 text-right relative z-10">
                  <div className="w-16 h-16 rounded-[24px] bg-rose-500/20 flex items-center justify-center text-rose-400 shadow-sm border border-rose-500/30 transform group-hover:scale-110 transition-transform">
                      <Waves className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                      <h3 className="text-xl font-black text-white mb-1">
                          {language === 'ar' ? 'التأثير المتسلسل' : 'Ripple Effect'}
                      </h3>
                      <p className="text-zinc-400 font-bold text-sm">
                          {language === 'ar' ? 'العواقب غير المتوقعة لأفكارك' : 'Unexpected consequences'}
                      </p>
                  </div>
              </div>
          </div>
      </motion.div>
      {/* Gravity of Intent Demonstration */}

    </div>
  );
};
