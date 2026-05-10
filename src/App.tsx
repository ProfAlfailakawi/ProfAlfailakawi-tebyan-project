import { GamificationProvider } from './components/GamificationProvider';
import { UserProvider } from './contexts/UserContext';
import { CognitiveModeProvider } from './contexts/CognitiveModeContext';
import { useAmbientIntelligence } from './hooks/useAmbientIntelligence';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Globe, Command, Sparkles, 
  ClipboardCheck, Gamepad2, Hourglass, BrainCircuit, 
  Zap, Users, Lightbulb, RefreshCw, X, MessageCircleQuestion, Menu, LogOut, LayoutDashboard,
  Search, Network, BarChart3, LibraryBig, Route, TicketPercent, Mail, Settings, User, Lock, Box,
  Compass, Anchor, Moon, Sun, Heart, Brain, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useAuth } from './components/AuthProvider';
import { auth, db } from './lib/firebase';
import { query, collection, where, limit, getDocs } from 'firebase/firestore';
import Login from './components/Login';
import UserMenu from './components/UserMenu';
import { signOut } from 'firebase/auth';
import { GlobalCommand } from './components/GlobalCommand';
import { GamificationBadge } from './components/GamificationBadge';
import { TheOrb } from './components/TheOrb';
import { VoiceCanvas } from './components/VoiceCanvas';
import { MessagesFloatingButton } from './components/MessagesFloatingButton';
import { ThoughtNebula } from './components/ThoughtNebula';
import { WhisperHint } from './components/WhisperHint';
import { SerendipityCompass } from './components/SerendipityCompass';
import { PWAInstallPrompt, PWAHeaderButton } from './components/PWAInstallPrompt';
import { SpatialGhost } from './components/SpatialGhost';

import { KnowledgeGraphTab } from './components/tabs/KnowledgeGraphTab';
import { GlobalSageBar } from './components/GlobalSageBar';

import AdminUsersDashboard from './components/AdminUsersDashboard';
import AdminQawlFasl from './components/tabs/QawlFasl/AdminQawlFasl';
import { AdminContactTab } from './components/tabs/AdminContactTab';

const TabFallback = () => (
  <div className="w-full space-y-8 p-6 md:p-12 bg-white rounded-[24px] md:rounded-[32px] border border-zinc-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] animate-pulse">
     <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-zinc-100 rounded-[16px]"></div>
        <div className="w-64 h-8 bg-zinc-100 rounded-lg"></div>
     </div>
     <div className="space-y-4">
       <div className="w-full h-16 bg-zinc-50 rounded-2xl"></div>
       <div className="w-4/5 h-16 bg-zinc-50 rounded-2xl"></div>
       <div className="w-full h-40 bg-zinc-50 rounded-2xl mt-12"></div>
     </div>
  </div>
);

const OracleTab = React.lazy(() => import('./components/tabs/OracleTab').then(m => ({ default: m.OracleTab })));
const ConceptsTab = React.lazy(() => import('./components/tabs/ConceptsTab').then(m => ({ default: m.ConceptsTab })));
const QuizTab = React.lazy(() => import('./components/tabs/QuizTab').then(m => ({ default: m.QuizTab })));
const SimulationTab = React.lazy(() => import('./components/tabs/SimulationTab').then(m => ({ default: m.SimulationTab })));
const TimeMachineTab = React.lazy(() => import('./components/tabs/TimeMachineTab').then(m => ({ default: m.TimeMachineTab })));
const CouncilTab = React.lazy(() => import('./components/tabs/CouncilTab').then(m => ({ default: m.CouncilTab })));
const LabTab = React.lazy(() => import('./components/tabs/LabTab').then(m => ({ default: m.LabTab })));
const QawlFaslTab = React.lazy(() => import('./components/tabs/QawlFasl/QawlFaslTab').then(m => ({ default: m.QawlFaslTab })));
const MindMapTab = React.lazy(() => import('./components/tabs/MindMapTab').then(m => ({ default: m.MindMapTab })));
const AnalyticsTab = React.lazy(() => import('./components/tabs/AnalyticsTab').then(m => ({ default: m.AnalyticsTab })));
const LoyaltyTab = React.lazy(() => import('./components/tabs/LoyaltyTab').then(m => ({ default: m.LoyaltyTab })));
const RoadmapTab = React.lazy(() => import('./components/tabs/RoadmapTab').then(m => ({ default: m.RoadmapTab })));
const StoryTab = React.lazy(() => import('./components/tabs/StoryTab').then(m => ({ default: m.StoryTab })));
const RippleEffectTab = React.lazy(() => import('./components/tabs/RippleEffectTab').then(m => ({ default: m.RippleEffectTab })));
const DecisionExecutiveTab = React.lazy(() => import('./components/tabs/DecisionExecutiveTab').then(m => ({ default: m.DecisionExecutiveTab })));
const MyLibraryTab = React.lazy(() => import('./components/tabs/MyLibraryTab'));
const ContactTab = React.lazy(() => import('./components/tabs/ContactTab').then(m => ({ default: m.ContactTab })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

const StrategicArenaTab = React.lazy(() => import('./components/tabs/StrategicArenaTab'));
const CreativeLabWrapper = React.lazy(() => import('./components/tabs/CreativeLabWrapper'));
const KnowledgeCenterTab = React.lazy(() => import('./components/tabs/KnowledgeCenterTab'));
const ARTab = React.lazy(() => import('./components/tabs/ARTab'));

type Tab = 'home' | 'oracle' | 'concepts' | 'quizzes' | 'simulation' | 'timemachine' | 'council' | 'lab' | 'qawlfasl' | 'mindmap' | 'knowledgegraph' | 'analytics' | 'loyalty' | 'roadmap' | 'story' | 'mylibrary' | 'discover' | 'adminusers' | 'adminqawlfasl' | 'contact' | 'adminmessages' | 'admindashboard' | 'decisionroom' | 'strategicarena' | 'creativelab' | 'knowledgecenter' | 'ar' | 'ripple';

type Mood = 'default' | 'revolutionary' | 'calm' | 'melancholic' | 'optimistic';

const protectedFeatures: Tab[] = ['oracle', 'concepts', 'quizzes', 'simulation', 'timemachine', 'council', 'lab', 'adminusers', 'adminqawlfasl', 'mindmap', 'knowledgegraph', 'analytics', 'loyalty', 'roadmap', 'story', 'adminmessages', 'decisionroom', 'admindashboard', 'strategicarena', 'creativelab', 'knowledgecenter', 'mylibrary'];

import DevPanel from './components/DevPanel';

import { SmartGateway } from './components/SmartGateway';
import { logEvent } from './services/analyticsService';
import { cronService } from './services/cronService';
import { LighthouseMode } from './components/LighthouseMode';
import { translateWithContext, findSoulMatch } from './services/geminiService';

const SplashScreen = ({ onFinish, language }: { onFinish: () => void, language: 'ar' | 'en' }) => {
    const quotes = language === 'ar' ? [
        "مكان تتبلور فيه الأفكار..",
        "ابحث عن العمق في كل فكرة..",
        "اصنع تأثيراً يمتد طويلاً..",
        "مرحباً بك في عالم التبيان..",
        "الأفكار العظيمة تحتاج مساحة للتنفس.."
    ] : [
        "Where ideas crystallize..",
        "Find depth in every thought..",
        "Create an impact that lasts..",
        "Welcome to the world of Tabyan..",
        "Great ideas need space to breathe.."
    ];

    const [randomQuote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

    useEffect(() => {
        const timer = setTimeout(() => {
            onFinish();
        }, 2500);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center overflow-hidden"
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.03, 0.08, 0.03]
                    }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-mood-secondary rounded-full blur-[120px]"
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.03, 0.05, 0.03]
                    }}
                    transition={{ duration: 20, repeat: Infinity, delay: 2 }}
                    className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-mood-primary rounded-full blur-[100px]"
                />
            </div>

            <div className="relative flex flex-col items-center gap-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="relative"
                >
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-black rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-black/20 rotate-12">
                        <Globe className="w-12 h-12 md:w-16 md:h-16 text-white -rotate-12" />
                    </div>
                </motion.div>

                <div className="text-center space-y-3">
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-4xl md:text-6xl font-black text-black tracking-tighter"
                    >
                        تبيان
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                        className="text-zinc-400 font-medium flex items-center justify-center gap-2"
                    >
                        {randomQuote}
                    </motion.p>
                </div>

                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 h-0.5 bg-zinc-100 overflow-hidden rounded-full">
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-full bg-black w-1/2"
                    />
                </div>
            </div>
        </motion.div>
    );
};

import { LivingIcon } from './components/LivingIcon';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading, authReady } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showGlobalCommand, setShowGlobalCommand] = useState(false);
  const [showVoiceCanvas, setShowVoiceCanvas] = useState(false);
  const [initialContext, setInitialContext] = useState<string>('');
  const [showHeader, setShowHeader] = useState(true);
  const [isMoodHudOpen, setIsMoodHudOpen] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('default');
  const [prevMood, setPrevMood] = useState<Mood>('default');
  const [showMoodTransition, setShowMoodTransition] = useState(false);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-mood', currentMood);
    if (currentMood !== prevMood) {
      setShowMoodTransition(true);
      const timer = setTimeout(() => {
        setShowMoodTransition(false);
        setPrevMood(currentMood);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentMood, prevMood]);
  const [lighthouseIdea, setLighthouseIdea] = useState<{ text: string; author: string } | null>(null);
  const [soulTwinMsg, setSoulTwinMsg] = useState<string | null>(null);
  const [isAnalyzingTwin, setIsAnalyzingTwin] = useState(false);
  const lastScrollTop = useRef(0);
  const mainRef = useRef<HTMLElement>(null);
  
  // Ambient Intelligence Hook
  const { isConfused } = useAmbientIntelligence(mainRef);

  useEffect(() => {
    const handleScroll = () => {
      const main = mainRef.current;
      if (!main) return;
      const scrollTop = main.scrollTop;
      if (scrollTop > lastScrollTop.current && scrollTop > 100) {
        setShowHeader(false); // Scrolling down
      } else {
        setShowHeader(true); // Scrolling up
      }
      lastScrollTop.current = scrollTop;
    };
    const main = mainRef.current;
    main?.addEventListener('scroll', handleScroll);
    return () => main?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Automatically check and run daily tasks when user is available
    if (authReady && user) {
      cronService.runDailyTasks();
    }
  }, [authReady, user]);

  useEffect(() => {
    // Desktop: default closed behavior
    if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
    }
    
    // Check if there's a tab in the URL
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && tabs.some(t => t.id === tabParam) || ['adminusers', 'adminqawlfasl', 'adminmessages', 'loyalty'].includes(tabParam as string)) {
        setActiveTab(tabParam as Tab);
    }

    // Digital Patina Simulation (Accelerated for demonstration)
    const visits = parseInt(localStorage.getItem('app_visits') || '0', 10) + 1;
    localStorage.setItem('app_visits', visits.toString());
    
    // If visited more than 5 times (or refresh), apply patina (aging effect)
    if (visits > 2) { // just for show
      document.body.classList.add('patina-aged');
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Optional: you could still auto-close here if you wanted, 
        // but let's keep it under user control.
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalCommand(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (user && showLogin) {
      setShowLogin(false);
    }
  }, [user, showLogin]);

  const showToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const checkAuth = useCallback((tab: Tab) => {
    if (!authReady) {
        return false;
    }

    if (tab === 'qawlfasl') return true;

    if (!user && protectedFeatures.includes(tab)) {
      const msg = language === 'ar' 
        ? "هذه الخدمة خاصة للمشتركين... يرجى التسجيل أو الدخول." 
        : "This service is for subscribers only. Please register or login to access.";
      showToast(msg, 'info');
      setShowLogin(true);
      return false;
    }
    return true;
  }, [authReady, language, user, showToast]);

  const handleTabChange = useCallback((tab: Tab | 'ar' | 'simulation_roleplay', context: string = '', exit: boolean = false) => {
    if (exit) {
      localStorage.removeItem('tebyan_last_query');
      localStorage.removeItem('tebyan_last_has_searched');
      sessionStorage.removeItem('tebyan_current_query');
      sessionStorage.removeItem('tebyan_current_has_searched');
    }
    setMobileMenuOpen(false);
    setSidebarOpen(false); // Force close
    setShowGlobalCommand(false);
    setShowVoiceCanvas(false);
    // Dispatch event to close all other potential overlays (like Serendipity Compass)
    window.dispatchEvent(new CustomEvent('close_overlays'));
    
    let targetTab = tab as any;
    let targetContext = context;

    if (targetTab === 'simulation_roleplay') {
      targetTab = 'simulation';
      targetContext = '[ROLEPLAY]' + context;
    }

    const actualTab = targetTab === 'home' || targetTab === 'discover' || (targetTab as string) === 'dashboard' ? 'home' : targetTab;
    if (checkAuth(actualTab as Tab)) {
      setIsLoading(false);
      setError(null);
      setInitialContext(targetContext);
      setActiveTab(actualTab);
      logEvent('feature_use', language, undefined, { feature: actualTab, context: targetContext });
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        document.documentElement.scrollTo({ top: 0, behavior: 'auto' });
        document.body.scrollTo({ top: 0, behavior: 'auto' });
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'auto' });
      }, 50);
    }
  }, [checkAuth, language, setMobileMenuOpen, setSidebarOpen, setIsLoading, setError, setInitialContext, setActiveTab]);

  const tabs = [
    { id: 'discover', label: language === 'ar' ? 'اكتشف' : 'Discover', icon: Search },
    { id: 'decisionroom', label: language === 'ar' ? 'غرفة القرار السرية' : 'Secret Decision Room', icon: Lock },
    { id: 'qawlfasl', label: language === 'ar' ? 'قول فصل' : 'Qawl Fasl', icon: MessageCircleQuestion },
    { id: 'strategicarena', label: language === 'ar' ? 'الميدان الاستراتيجي' : 'Strategic Arena', icon: BrainCircuit },
    { id: 'creativelab', label: language === 'ar' ? 'المختبر الإبداعي' : 'Creative Lab', icon: Zap },
    // { id: 'ar', label: language === 'ar' ? 'واقع تبيان المعزز' : 'Tibyan AR', icon: Box },
    { id: 'knowledgecenter', label: language === 'ar' ? 'مركز المعرفة' : 'Knowledge Center', icon: Network },
    { id: 'oracle', label: language === 'ar' ? 'المستشار الكلي' : 'Omni Counselor', icon: Command },
    { id: 'mylibrary', label: language === 'ar' ? 'المكتبة المفضلة' : 'My Library', icon: LibraryBig },
    { id: 'loyalty', label: language === 'ar' ? 'الولاء والكوبونات' : 'Loyalty & Coupons', icon: TicketPercent, hidden: profile?.role !== 'admin' },
    { 
      id: 'adminusers', 
      label: language === 'ar' ? 'المستخدمين' : 'Users', 
      icon: Users,
      hidden: profile?.role !== 'admin'
    },
    { 
      id: 'adminqawlfasl', 
      label: language === 'ar' ? 'إدارة قول فصل' : 'Admin Qawl', 
      icon: LayoutDashboard,
      hidden: profile?.role !== 'admin'
    },
    {
      id: 'adminmessages',
      label: language === 'ar' ? 'صندوق الوارد' : 'Inbox',
      icon: Mail,
      hidden: profile?.role !== 'admin'
    },
    {
      id: 'contact',
      label: language === 'ar' ? 'تواصل معنا' : 'Contact Us',
      icon: Mail
    }
  ];

  return (
        <div className={cn("h-[100dvh] bg-zinc-50 font-sans flex flex-col overflow-hidden text-zinc-900 selection:bg-zinc-200 selection:text-black", language === 'ar' ? 'rtl' : 'ltr')} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AnimatePresence>
            {lighthouseIdea && (
              <LighthouseMode 
                idea={lighthouseIdea} 
                onClose={() => setLighthouseIdea(null)} 
                language={language}
              />
            )}
            {showSplash && <SplashScreen key="splash" onFinish={() => setShowSplash(false)} language={language} />}
          </AnimatePresence>
          
          {/* Dynamic Background Glow Overlay */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-full h-full bg-mood-glow blur-[120px] transition-colors duration-1000 opacity-30" />
          </div>
          
          {/* Liquid Mood Pour Transition */}
          <AnimatePresence>
            {showMoodTransition && (
              <motion.div
                initial={{ clipPath: 'circle(0% at 50% 90%)', opacity: 0 }}
                animate={{ clipPath: 'circle(150% at 50% 90%)', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-[100] pointer-events-none bg-mood-primary opacity-20"
              />
            )}
          </AnimatePresence>

          <ThoughtNebula />
          <WhisperHint language={language} forceShow={isConfused} />
          
          {/* Spatial Ghosting (الذاكرة المكانية الوهمية) */}
          {activeTab === 'discover' && (
            <SpatialGhost 
              message={language === 'ar' ? "في زيارتك السابقة، توقفت مطولاً عند مقال عن الوعي الاصطناعي.." : "During your last visit, you lingered on an article about artificial consciousness.."} 
              x="left-8" 
              y="top-1/3" 
            />
          )}
          {activeTab === 'mindmap' && (
            <SpatialGhost 
              message={language === 'ar' ? "هناك رابط خفي لم تكتشفه بعد بين الفلسفة والتكنولوجيا.." : "There is a hidden link you haven't discovered yet between philosophy and tech.."} 
              x="right-10" 
              y="top-1/4" 
            />
          )}
          {activeTab === 'qawlfasl' && (
             <SpatialGhost 
               message={language === 'ar' ? "في الشهر الماضي، سألت عن معنى 'الحقيقة المطلقة'..." : "Last month, you asked for the meaning of 'absolute truth'..."} 
               x="left-10" 
               y="bottom-1/3" 
             />
          )}
          {activeTab === 'mylibrary' && (
             <SpatialGhost 
               message={language === 'ar' ? "كتاب 'تأملات' لا يزال ينتظر أن تكمله منذ أسبوعين.." : "The book 'Meditations' is still waiting for you to finish it since two weeks ago.."} 
               x="right-8" 
               y="top-1/2" 
             />
          )}

        <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
            className={cn(
              "fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border font-medium flex items-center gap-3 text-sm max-w-[90vw] md:max-w-md w-max backdrop-blur-xl",
              toast.type === 'info' ? "bg-white/90 border-zinc-200/50 text-zinc-900" : 
              toast.type === 'error' ? "bg-rose-50/90 border-rose-200/50 text-rose-900" : 
              "bg-emerald-50/90 border-emerald-200/50 text-emerald-900"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full shadow-inner", toast.type === 'info' ? "bg-blue-500" : toast.type === 'error' ? "bg-rose-500" : "bg-emerald-500")} />
            {toast.message}
          </motion.div>
        )}
        </AnimatePresence>


      <motion.header 
         animate={{ y: showHeader ? 0 : -100 }}
         transition={{ duration: 0.3, ease: "easeInOut" }}
         className="fixed top-0 left-0 right-0 z-40 bg-transparent px-8 py-4 flex items-center justify-between pointer-events-none"
      >
         <div className="flex items-center gap-6 pointer-events-auto">
           <button 
             onClick={() => handleTabChange('home')}
             className="flex items-center gap-3 transition-transform active:scale-95"
           >
             <div className="w-10 h-10 bg-mood-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-mood-glow transition-all duration-700">
               <LivingIcon icon={Globe} mood={currentMood} type="home" className="w-5 h-5" />
             </div>
             <span className="font-black text-xl text-black tracking-tighter transition-colors group-hover:text-mood-primary">تبيان</span>
           </button>
           
           {/* <button 
             onClick={() => setLanguage(l => l === 'ar' ? 'en' : 'ar')}
             className="hidden md:flex ml-4 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-sm border border-zinc-200/50 text-xs font-bold text-zinc-500 hover:text-black hover:bg-white transition-all shadow-sm"
           >
             {language === 'ar' ? 'EN' : 'عربي'}
           </button> */}
         </div>

         <div className="flex items-center gap-2 pointer-events-auto">
           <PWAHeaderButton />
           {user ? (
             <UserMenu />
           ) : authReady && Object.keys(user || {}).length === 0 ? (
             <button 
                onClick={() => setShowLogin(true)}
                className="bg-white p-2.5 mx-2 rounded-xl text-zinc-900 shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95 border border-zinc-200"
                title={language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              >
                <User className="w-5 h-5" />
              </button>
           ) : null}
         </div>
      </motion.header>


      {/* --- Menu Overlay --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: language === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 bottom-0 right-0 w-[85%] max-w-[340px] bg-white shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <button 
                  onClick={() => { handleTabChange('home'); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 active:scale-95 transition-transform text-right"
                >
                  <div className="w-8 h-8 bg-mood-primary rounded-lg flex items-center justify-center shadow-lg shadow-mood-glow">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-lg text-black">تبيان</span>
                </button>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-zinc-200/50 rounded-full text-zinc-600 hover:text-black">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {tabs.map(tab => !tab.hidden && (
                  <button
                    key={tab.id}
                    onClick={() => { handleTabChange(tab.id as Tab); setMobileMenuOpen(false); }}
                    className={cn(
                      "w-full flex flex-wrap md:flex-nowrap items-center gap-4 px-4 py-4 rounded-2xl font-medium transition-colors text-right relative",
                      activeTab === tab.id ? "bg-mood-primary text-white shadow-lg shadow-mood-glow" : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
                    )}
                  >
                    <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-zinc-400")} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 space-y-3">
                 {/* Language Switcher Hidden
                 <button onClick={() => { setLanguage(l => l === 'ar' ? 'en' : 'ar'); setMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-zinc-200/80 rounded-2xl text-sm font-semibold text-zinc-700 shadow-sm hover:border-zinc-300">
                    <Globe className="w-4 h-4" />
                    {language === 'ar' ? 'English' : 'العربية'}
                 </button>
                 */}
                 {authReady && !user && (
                    <button onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }} className="w-full py-3.5 bg-black text-white rounded-2xl text-sm font-semibold shadow-md">
                      تسجيل الدخول
                    </button>
                 )}
                 {user && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3">
                      {/* Admin Link for Mobile */}
                      {(profile?.role === 'admin' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad')) && (
                        <button 
                          onClick={() => {
                            handleTabChange('adminusers');
                          }}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 text-white rounded-[20px] text-base font-bold shadow-lg transition-all active:scale-[0.98]"
                        >
                          <Settings className="w-5 h-5 text-amber-400" />
                          لوحة الإدارة
                        </button>
                      )}
                      
                      <button 
                        onClick={() => signOut(auth)} 
                        className="w-full flex items-center justify-center gap-3 py-4 bg-rose-600 text-white hover:bg-rose-700 rounded-[20px] text-base font-black shadow-lg shadow-rose-200 transition-all active:scale-[0.98]"
                      >
                        <LogOut className="w-5 h-5" />
                        تسجيل الخروج
                      </button>
                    </div>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Desktop Sidebar Removed --- */}

      <main ref={mainRef} className="flex-1 w-full min-h-0 pt-24 overflow-y-auto overflow-x-hidden relative scroll-smooth custom-scrollbar">
        
        {/* Error Banner */}
        {error && (
          <div className="m-4 md:m-8 bg-rose-50 border border-rose-200 text-rose-800 px-6 py-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-medium">
              <Sparkles className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-rose-100 rounded-full cursor-pointer transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div 
          className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 w-full min-h-full cursor-default"
          onClick={(e) => {
            // If clicking the direct background of the tab area, return to home if not already there
            if (e.target === e.currentTarget && activeTab !== 'home' && activeTab !== 'discover') {
              handleTabChange('home');
            }
          }}
        >
            <motion.div 
              key={activeTab} 
              initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }} 
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} 
              transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
              className="relative z-10"
            >
            <div className="absolute -top-10 left-12 w-32 h-32 bg-mood-glow rounded-full blur-[80px] pointer-events-none opacity-50" />
            <React.Suspense fallback={<TabFallback />}>
              {(() => {
                switch (activeTab) {
                  case 'home':
                  case 'discover':
                    return <SmartGateway language={language} handleTabChange={handleTabChange} tabs={tabs} initialQuery={initialContext} mood={currentMood} />;
                  case 'strategicarena':
                    return <StrategicArenaTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'creativelab':
                    return <CreativeLabWrapper handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'ar':
                    return <ARTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'knowledgecenter':
                    return <KnowledgeCenterTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'oracle':
                    return <OracleTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'concepts':
                    return <ConceptsTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'quizzes':
                    return <QuizTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'simulation':
                    return <SimulationTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'knowledgegraph':
                    return <KnowledgeGraphTab handleTabChange={handleTabChange} language={language} />;
                  case 'timemachine':
                    return <TimeMachineTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'council':
                    return <CouncilTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'mindmap':
                    return <MindMapTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'ripple':
                    return <RippleEffectTab language={language} handleTabChange={handleTabChange} onFocusMode={(idea) => setLighthouseIdea(idea)} />;
                  case 'analytics':
                    return <AnalyticsTab handleTabChange={handleTabChange} language={language} />;
                  case 'loyalty':
                    return <LoyaltyTab handleTabChange={handleTabChange} language={language} />;
                  case 'roadmap':
                    return <RoadmapTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'story':
                    return <StoryTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'mylibrary':
                    return <MyLibraryTab language={language} handleTabChange={handleTabChange} />;
                  case 'lab':
                    return <LabTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'qawlfasl':
                    return <QawlFaslTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'decisionroom':
                    return <DecisionExecutiveTab handleTabChange={handleTabChange} language={language} initialValue={initialContext} />;
                  case 'adminusers':
                    return (profile?.role === 'admin' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad')) ? <AdminUsersDashboard /> : null;
                  case 'adminqawlfasl':
                    return (profile?.role === 'admin' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad')) ? <AdminQawlFasl /> : null;
                  case 'adminmessages':
                    return (profile?.role === 'admin' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad')) ? <AdminContactTab language={language} /> : null;
                  case 'admindashboard':
                    return (profile?.role === 'admin' || user?.email?.toLowerCase().includes('alfailakawidrahmad') || user?.email?.toLowerCase().includes('dr.ahmad')) ? <AdminDashboard /> : null;
                  case 'contact':
                    return <ContactTab language={language} />;
                  default:
                    return null;
                }
              })()}
            </React.Suspense>
            </motion.div>
          
          <footer className="text-center py-6 mt-10 text-zinc-400">
             <div className="flex items-center justify-center gap-2 mb-3">
               <Globe className="w-5 h-5" />
               <span className="font-bold text-zinc-500 tracking-tight">تبيان</span>
             </div>
             <p className="text-[13px] font-medium">نظامك لفهم العالم &copy; {new Date().getFullYear()}</p>
             <div className="mt-8 flex flex-col items-center gap-6">
                 <div className="flex flex-col items-center gap-4 py-8 border-t border-zinc-100/50 w-full max-w-xs transition-all duration-700">
                  <div className="flex flex-col items-center gap-1 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-mood-primary/70 animate-pulse">
                      {language === 'ar' ? 'بوصلة الوجدان' : 'MOOD COMPASS'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsMoodHudOpen(!isMoodHudOpen)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 group relative overflow-hidden active:scale-95",
                      isMoodHudOpen ? "bg-mood-primary text-white shadow-[0_0_30px_rgba(var(--mood-primary),0.3)]" : "bg-white border border-zinc-100 text-zinc-400 hover:text-mood-primary hover:border-mood-primary/30 shadow-sm"
                    )}
                  >
                    <LivingIcon icon={Compass} mood={currentMood} type="settings" className={cn("w-4 h-4 transition-all duration-1000", isMoodHudOpen ? "rotate-[360deg] scale-110" : "rotate-0 transform group-hover:rotate-45")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'بوصلة الوجدان' : 'Mood Compass'}</span>
                  </button>

                  <AnimatePresence>
                    {isMoodHudOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="flex items-center gap-2 p-2 bg-white/95 backdrop-blur-xl border border-zinc-200/60 rounded-[24px] shadow-2xl mt-4"
                      >
                        <button 
                            onClick={() => { setCurrentMood('revolutionary'); setIsMoodHudOpen(false); }}
                            className={cn("p-3 rounded-xl transition-all", currentMood === 'revolutionary' ? "bg-mood-primary text-white shadow-lg shadow-mood-glow" : "text-zinc-400 hover:bg-zinc-50")}
                            title={language === 'ar' ? 'ثوري' : 'Revolutionary'}
                        >
                            <LivingIcon icon={Zap} mood="revolutionary" className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => { setCurrentMood('calm'); setIsMoodHudOpen(false); }}
                            className={cn("p-3 rounded-xl transition-all", currentMood === 'calm' ? "bg-mood-primary text-white shadow-lg shadow-mood-glow" : "text-zinc-400 hover:bg-zinc-50")}
                            title={language === 'ar' ? 'هادئ' : 'Calm'}
                        >
                            <LivingIcon icon={Moon} mood="calm" className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => { setCurrentMood('melancholic'); setIsMoodHudOpen(false); }}
                            className={cn("p-3 rounded-xl transition-all", currentMood === 'melancholic' ? "bg-mood-primary text-white shadow-lg shadow-mood-glow" : "text-zinc-400 hover:bg-zinc-50")}
                            title={language === 'ar' ? 'عميق' : 'Melancholic'}
                        >
                            <LivingIcon icon={Heart} mood="melancholic" className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => { setCurrentMood('optimistic'); setIsMoodHudOpen(false); }}
                            className={cn("p-3 rounded-xl transition-all", currentMood === 'optimistic' ? "bg-mood-primary text-white shadow-lg shadow-mood-glow" : "text-zinc-400 hover:bg-zinc-50")}
                            title={language === 'ar' ? 'متفائل' : 'Optimistic'}
                        >
                            <LivingIcon icon={Sun} mood="optimistic" className="w-5 h-5" />
                        </button>
                        <div className="w-px h-8 bg-zinc-100 mx-1" />
                        <button 
                            onClick={async () => {
                              if (!user) {
                                 showToast(language === 'ar' ? 'سجل دخولك لتجد توأمك الفكري' : 'Sign in to find your intellectual twin', 'info');
                                 setShowLogin(true);
                                 return;
                              }
                              setIsAnalyzingTwin(true);
                              try {
                                const q = query(collection(db, 'ripples'), where('authorId', '==', user.uid), limit(5));
                                const snap = await getDocs(q);
                                const posts = snap.docs.map(d => d.data().text);
                                if (posts.length < 2) {
                                  showToast(language === 'ar' ? 'انشر بذوراً أكثر لنحلل نمطك الفكري!' : 'Post more seeds to analyze your pattern!', 'info');
                                  return;
                                }
                                const res = await findSoulMatch(posts, language);
                                if (res) setSoulTwinMsg(res);
                              } finally {
                                setIsAnalyzingTwin(false);
                              }
                            }}
                            className={cn("p-3 rounded-xl transition-all relative group", isAnalyzingTwin ? "bg-zinc-50" : "bg-zinc-900 text-white")}
                        >
                            {isAnalyzingTwin ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                              <>
                                <Brain className="w-5 h-5 relative z-10" />
                                <div className="absolute inset-0 bg-mood-primary opacity-0 group-hover:opacity-20 transition-opacity rounded-xl" />
                              </>
                            )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-12 flex flex-col items-center gap-1 opacity-40 scale-75 pt-8 border-t border-zinc-100/30 w-full max-w-[200px]">
                   <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-500">Version 3.2.0.Release</span>
                </div>
             </div>
          </footer>
        </div>
      </main>

      {/* Login Modal - Moved out of flow */}
      <AnimatePresence>
        {showLogin && !user && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
            className="flex items-center justify-center p-4 bg-zinc-900/40"
            onClick={() => setShowLogin(false)}
          >
            <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute -top-12 right-0 z-10 p-2.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="shadow-[0_24px_60px_rgb(0,0,0,0.12)] rounded-[24px] md:rounded-[32px] overflow-hidden">
                 <Login />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TheOrb 
        language={language}
        onTap={() => setShowGlobalCommand(true)}
        onDragUp={() => setShowVoiceCanvas(true)}
      />
      <MessagesFloatingButton />

      <VoiceCanvas
        isOpen={showVoiceCanvas}
        onClose={() => setShowVoiceCanvas(false)}
        language={language}
      />

      <GlobalCommand 
        isOpen={showGlobalCommand} 
        onClose={() => setShowGlobalCommand(false)} 
        language={language}
        tabs={tabs}
        handleTabChange={handleTabChange}
      />

      <SerendipityCompass language={language} contextTopic={initialContext || activeTab} handleTabChange={handleTabChange} />

      <AnimatePresence>
          {soulTwinMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed bottom-32 z-50 left-8 right-8 md:left-auto md:right-8 md:w-96 p-6 bg-white border border-zinc-200 rounded-[32px] shadow-3xl overflow-hidden"
              >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-emerald-500" />
                  <button onClick={() => setSoulTwinMsg(null)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="font-black text-sm uppercase tracking-widest">{language === 'ar' ? 'توأم الروح الفكري' : 'INTELLECTUAL TWIN'}</h4>
                  </div>
                  <p className="text-zinc-700 font-bold leading-relaxed">{soulTwinMsg}</p>
              </motion.div>
          )}
      </AnimatePresence>

      <PWAInstallPrompt />

      </div>
  );
};

const App = () => (
  <CognitiveModeProvider>
    <GamificationProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </GamificationProvider>
  </CognitiveModeProvider>
);

export default App;

