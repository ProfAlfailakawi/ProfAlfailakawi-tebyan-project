import { GamificationProvider } from "./components/GamificationProvider";
import { UserProvider } from "./contexts/UserContext";
import { CognitiveModeProvider } from "./contexts/CognitiveModeContext";
import { useAmbientIntelligence } from "./hooks/useAmbientIntelligence";
import { SmartIconWrapper } from "./components/common/SmartIconGuidance";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  GraduationCap,
  Globe,
  Command,
  Sparkles,
  ClipboardCheck,
  Gamepad2,
  Hourglass,
  BrainCircuit,
  Zap,
  Users,
  Lightbulb,
  RefreshCw,
  X,
  MessageCircleQuestion,
  Menu,
  LogOut,
  LayoutDashboard,
  Search,
  Network,
  BarChart3,
  LibraryBig,
  Route,
  TicketPercent,
  Mail,
  Settings,
  User,
  Lock,
  Box,
  Compass,
  Anchor,
  Moon,
  Sun,
  Heart,
  Brain,
  Loader2,
  WifiOff,
  ShieldCheck,
  ArrowLeft,
  HelpCircle,
  Grid3X3,
  Lamp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TebyanMark } from "./components/TebyanMark";
import { cn } from "./lib/utils";
import { useAuth } from "./components/AuthProvider";
import {
  PWAInstallPrompt,
  PWAHeaderButton,
} from "./components/PWAInstallPrompt";
import { OnboardingTour } from "./components/OnboardingTour";
import { TebyanTooltip } from "./components/TebyanTooltip";
import { getServiceTabs } from "./constants/serviceRegistry";

import { migrateLegacyData } from "./lib/migration";

import { getActiveUser, getGenderWord } from "./utils/genderHelper";

// Clear old search outputs instantly at moduleload/first-evaluation time so there are absolutely no race conditions or initial render leaks
try {
  if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("tebyan_current_query");
    sessionStorage.removeItem("tebyan_current_has_searched");
    localStorage.removeItem("tebyan_last_query");
    localStorage.removeItem("tebyan_last_has_searched");
  }
} catch (e) {}

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

const OracleTab = React.lazy(() =>
  import("./components/tabs/OracleTab").then((m) => ({ default: m.OracleTab })),
);
const ConceptsTab = React.lazy(() =>
  import("./components/tabs/ConceptsTab").then((m) => ({
    default: m.ConceptsTab,
  })),
);
const QuizTab = React.lazy(() =>
  import("./components/tabs/QuizTab").then((m) => ({ default: m.QuizTab })),
);
const SimulationTab = React.lazy(() =>
  import("./components/tabs/SimulationTab").then((m) => ({
    default: m.SimulationTab,
  })),
);
const TimeMachineTab = React.lazy(() =>
  import("./components/tabs/TimeMachineTab").then((m) => ({
    default: m.TimeMachineTab,
  })),
);
const CouncilTab = React.lazy(() =>
  import("./components/tabs/CouncilTab").then((m) => ({
    default: m.CouncilTab,
  })),
);
const LabTab = React.lazy(() =>
  import("./components/tabs/LabTab").then((m) => ({ default: m.LabTab })),
);
const QawlFaslTab = React.lazy(() =>
  import("./components/tabs/QawlFasl/QawlFaslTab").then((m) => ({
    default: m.QawlFaslTab,
  })),
);
const MindMapTab = React.lazy(() =>
  import("./components/tabs/MindMapTab").then((m) => ({
    default: m.MindMapTab,
  })),
);
const AnalyticsTab = React.lazy(() =>
  import("./components/tabs/AnalyticsTab").then((m) => ({
    default: m.AnalyticsTab,
  })),
);
const LoyaltyTab = React.lazy(() =>
  import("./components/tabs/LoyaltyTab").then((m) => ({
    default: m.LoyaltyTab,
  })),
);
const RoadmapTab = React.lazy(() =>
  import("./components/tabs/RoadmapTab").then((m) => ({
    default: m.RoadmapTab,
  })),
);
const StoryTab = React.lazy(() =>
  import("./components/tabs/StoryTab").then((m) => ({ default: m.StoryTab })),
);
const RippleEffectTab = React.lazy(() =>
  import("./components/tabs/RippleEffectTab").then((m) => ({
    default: m.RippleEffectTab,
  })),
);
const DecisionExecutiveTab = React.lazy(() =>
  import("./components/tabs/DecisionExecutiveTab").then((m) => ({
    default: m.DecisionExecutiveTab,
  })),
);
const MyLibraryTab = React.lazy(() => import("./components/tabs/MyLibraryTab"));
const ContactTab = React.lazy(() =>
  import("./components/tabs/ContactTab").then((m) => ({
    default: m.ContactTab,
  })),
);
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));

const StrategicArenaTab = React.lazy(
  () => import("./components/tabs/StrategicArenaTab"),
);
const CreativeLabWrapper = React.lazy(
  () => import("./components/tabs/CreativeLabWrapper"),
);
const KnowledgeCenterTab = React.lazy(
  () => import("./components/tabs/KnowledgeCenterTab"),
);
const ARTab = React.lazy(() => import("./components/tabs/ARTab"));
const TruthManuscriptTab = React.lazy(
  () => import("./components/tabs/TruthManuscriptTab"),
);

type Tab =
  | "home"
  | "oracle"
  | "concepts"
  | "quizzes"
  | "simulation"
  | "timemachine"
  | "council"
  | "lab"
  | "qawlfasl"
  | "mindmap"
  | "knowledgegraph"
  | "analytics"
  | "loyalty"
  | "roadmap"
  | "story"
  | "mylibrary"
  | "discover"
  | "adminusers"
  | "adminqawlfasl"
  | "contact"
  | "adminmessages"
  | "admindashboard"
  | "decisionroom"
  | "strategicarena"
  | "creativelab"
  | "knowledgecenter"
  | "ar"
  | "ripple"
  | "truthmanuscript"
  | "ask"
  | "growth"
  | "rukni";

type Mood = "default" | "revolutionary" | "calm" | "melancholic" | "optimistic";

const protectedFeatures: Tab[] = [
  "oracle",
  "concepts",
  "quizzes",
  "simulation",
  "timemachine",
  "council",
  "lab",
  "adminusers",
  "adminqawlfasl",
  "mindmap",
  "knowledgegraph",
  "analytics",
  "loyalty",
  "roadmap",
  "story",
  "adminmessages",
  "decisionroom",
  "admindashboard",
  "strategicarena",
  "creativelab",
  "knowledgecenter",
  "mylibrary",
  "truthmanuscript",
  // New consolidated doors inherit the same protection as their contents.
  "ask",
  "growth",
  "rukni",
];

import { logEvent } from "./services/analyticsService";

const SmartGateway = React.lazy(() =>
  import("./components/SmartGateway").then((m) => ({
    default: m.SmartGateway,
  })),
);
const AskTebyanDoor = React.lazy(
  () => import("./components/doors/AskTebyanDoor"),
);
const DecisionDoor = React.lazy(
  () => import("./components/doors/DecisionDoor"),
);
const GrowthDoor = React.lazy(() => import("./components/doors/GrowthDoor"));
const RukniDoor = React.lazy(() => import("./components/doors/RukniDoor"));
const Login = React.lazy(() => import("./components/Login"));
const UserMenu = React.lazy(() => import("./components/UserMenu"));
const ServiceExplorer = React.lazy(
  () => import("./components/ServiceExplorer"),
);
const ThoughtNebula = React.lazy(() =>
  import("./components/ThoughtNebula").then((m) => ({
    default: m.ThoughtNebula,
  })),
);
const KnowledgeGraphTab = React.lazy(() =>
  import("./components/tabs/KnowledgeGraphTab").then((m) => ({
    default: m.KnowledgeGraphTab,
  })),
);
const AdminUsersDashboard = React.lazy(
  () => import("./components/AdminUsersDashboard"),
);
const AdminQawlFasl = React.lazy(
  () => import("./components/tabs/QawlFasl/AdminQawlFasl"),
);
const AdminContactTab = React.lazy(() =>
  import("./components/tabs/AdminContactTab").then((m) => ({
    default: m.AdminContactTab,
  })),
);
const GlobalCommand = React.lazy(() =>
  import("./components/GlobalCommand").then((m) => ({
    default: m.GlobalCommand,
  })),
);
const LighthouseMode = React.lazy(() =>
  import("./components/LighthouseMode").then((m) => ({
    default: m.LighthouseMode,
  })),
);

const SplashScreen = ({
  onFinish,
  language,
}: {
  onFinish: () => void;
  language: "ar" | "en";
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem("tebyan_gate_to_search", "true");
        window.dispatchEvent(new CustomEvent("tebyan_gate_to_search"));
      } catch (e) {}
      onFinish();
    }, 2600);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.5, ease: "easeInOut" },
      }}
      className="fixed inset-0 z-[99999] bg-[#F8F5EF] flex flex-col items-center justify-center"
    >
      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <TebyanMark size={104} animated />
        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="font-serif text-5xl font-bold text-[#182231] tracking-tight"
          >
            تبيان
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.25, duration: 0.5 }}
            className="text-[#7C8796] font-medium text-sm"
          >
            {language === "ar" ? "نورٌ لما تريد فهمه" : "Light for what you seek"}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

const SessionRestoreLoader = ({
  language,
  slow = false,
}: {
  language: "ar" | "en";
  slow?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={cn(
      "fixed left-1/2 z-[9998] -translate-x-1/2 border border-white/70 bg-white/84 shadow-[0_14px_40px_rgba(103,88,132,0.12)] backdrop-blur-xl",
      slow
        ? "top-6 rounded-[28px] px-5 py-4 max-w-md w-[calc(100%-2rem)]"
        : "top-5 rounded-full px-4 py-2",
    )}
  >
    <div className="flex items-center gap-3 text-xs font-black text-[#7D689E]">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>
        {slow
          ? language === "ar"
            ? "نحافظ على مسارك ونستعيد الاتصال بالنظام…"
            : "Keeping your path while restoring the system…"
          : language === "ar"
            ? "جاري استعادة الجلسة…"
            : "Restoring session…"}
      </span>
    </div>
  </motion.div>
);

const OfflineNotice = ({ language }: { language: "ar" | "en" }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    className="fixed inset-0 z-[9999] flex items-end justify-center p-4 md:items-center bg-[#F8F5EF]/62 backdrop-blur-[6px]"
    dir={language === "ar" ? "rtl" : "ltr"}
  >
    <motion.div
      initial={{ y: 22, scale: 0.98, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ y: 22, scale: 0.98, opacity: 0 }}
      className="relative w-full max-w-lg overflow-hidden rounded-[34px] border border-[#F0D8D2] bg-[#FFF9F6]/94 p-5 md:p-7 shadow-[0_34px_110px_rgba(166,96,63,0.16)]"
    >
      <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#F1D7CC]/50 blur-[70px]" />
      <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#C9BEDF]/35 blur-[80px]" />
      <div className="relative flex items-start gap-4">
        <div className="relative mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-[#FAF0E6] text-[#A6603F]">
          <motion.span
            animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-[24px] border border-[#A6603F]/25"
          />
          <WifiOff className="h-6 w-6" />
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[11px] font-black tracking-[0.22em] uppercase text-[#A6603F]/75">
            {language === "ar" ? "وضع الحفاظ على المسار" : "Path-preserve mode"}
          </p>
          <h3 className="mt-1 text-xl md:text-2xl font-black text-[#182231]">
            {language === "ar"
              ? "الاتصال انقطع… لكن الفكرة لم تضِع"
              : "Connection paused… the idea is safe"}
          </h3>
          <p className="mt-2 text-sm font-bold leading-relaxed text-[#7C8796]">
            {language === "ar"
              ? "لا نعيد السبلاش الافتتاحي هنا. تبيان يحفظ حالتك الحالية، وعند عودة الشبكة نكمل من نفس الباب."
              : "We do not replay the opening splash here. Tebyan keeps your state and resumes from the same doorway when the network returns."}
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#E9D7CF] bg-white/60 px-3 py-2 text-xs font-black text-[#8D6A58]">
            <ShieldCheck className="h-4 w-4" />
            <span>
              {language === "ar"
                ? "مسارك الحالي محفوظ مؤقتاً"
                : "Your current path is temporarily preserved"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

import { LivingIcon } from "./components/LivingIcon";

const AppContent: React.FC = () => {
  const { user, profile, loading, authReady, userName, userGender } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const isInternalPage = activeTab !== "home" && activeTab !== "discover";
  const [toast, setToast] = useState<{
    message: string;
    type: "info" | "error" | "success";
  } | null>(null);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  // Show the opening mark once per session, long enough to actually be seen.
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem("tebyan_splash_seen") !== "true";
    } catch (e) {
      return false;
    }
  });
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [showSlowRecovery, setShowSlowRecovery] = useState(false);
  const [showPageHelp, setShowPageHelp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showGlobalCommand, setShowGlobalCommand] = useState(false);
  const [initialContext, setInitialContext] = useState<string>("");
  const [showHeader, setShowHeader] = useState(true);
  const [currentMood, setCurrentMood] = useState<Mood>("default");
  const [prevMood, setPrevMood] = useState<Mood>("default");
  const [showMoodTransition, setShowMoodTransition] = useState(false);
  const [enableNonCriticalUi, setEnableNonCriticalUi] = useState(false);

  useEffect(() => {
    const updateOnlineState = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    updateOnlineState();
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (showSplash || authReady) {
      setShowSlowRecovery(false);
      return;
    }
    const timer = setTimeout(() => setShowSlowRecovery(true), 1800);
    return () => clearTimeout(timer);
  }, [showSplash, authReady]);

  useEffect(() => {
    if (showSplash) {
      setEnableNonCriticalUi(false);
      return;
    }

    const win = window as typeof window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout?: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    let idleId: number | undefined;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const timer = window.setTimeout(
      () => {
        const start = () => setEnableNonCriticalUi(true);
        if (typeof win.requestIdleCallback === "function") {
          idleId = win.requestIdleCallback(start, {
            timeout: mobile ? 2200 : 900,
          });
        } else {
          start();
        }
      },
      mobile ? 2600 : 650,
    );

    return () => {
      window.clearTimeout(timer);
      if (idleId !== undefined) win.cancelIdleCallback?.(idleId);
    };
  }, [showSplash]);

  // Warm the two highest-frequency routes after the first paint. React.lazy
  // reuses this module cache, so tapping Ask/Explore never waits for a chunk.
  useEffect(() => {
    if (showSplash) return;
    const win = window as typeof window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout?: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const preload = () => {
      void import("./components/SmartGateway");
      void import("./components/ServiceExplorer");
    };
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(preload, { timeout: 900 });
      return () => win.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(preload, 250);
    return () => window.clearTimeout(id);
  }, [showSplash]);

  // Performance fix: the old automatic result-scroll fired multiple smooth scrolls after nearly every action.
  // It made the site feel like it was jumping/hanging, especially on mobile. Keep navigation fully manual and stable.

  useEffect(() => {
    // Run migration from legacy keys immediately
    migrateLegacyData();

    // Panic mode listener
    const handlePanic = (e: any) => {
      const isPanic = e.detail;
      if (isPanic) {
        setCurrentMood("calm");
        document.documentElement.classList.add("panic-mode");
      } else {
        setCurrentMood("default");
        document.documentElement.classList.remove("panic-mode");
      }
    };
    window.addEventListener("tebyan_panic_mode_change", handlePanic);
    if (localStorage.getItem("tebyan_panic_mode") === "true") {
      setCurrentMood("calm");
      document.documentElement.classList.add("panic-mode");
    }
    return () =>
      window.removeEventListener("tebyan_panic_mode_change", handlePanic);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-mood", currentMood);
    if (currentMood !== prevMood) {
      setShowMoodTransition(true);
      const timer = setTimeout(() => {
        setShowMoodTransition(false);
        setPrevMood(currentMood);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentMood, prevMood]);
  const [lighthouseIdea, setLighthouseIdea] = useState<{
    text: string;
    author: string;
  } | null>(null);
  const lastScrollTop = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  // Ambient Intelligence Hook
  useAmbientIntelligence(mainRef);

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
    main?.addEventListener("scroll", handleScroll);
    return () => main?.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Automatically check and run daily tasks when user is available and is an admin
    const isPrimaryAdmin =
      user?.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
      user?.email?.toLowerCase() === "ah_f@hotmail.com" ||
      user?.email?.toLowerCase() === "alfailakawidrahmad@gmail.com" ||
      user?.email?.toLowerCase() === "alfailakawidrahmad@outlook.com" ||
      user?.email?.toLowerCase().includes("dr.ahmad");

    if (authReady && user && (profile?.role === "admin" || isPrimaryAdmin)) {
      void import("./services/cronService").then(({ cronService }) =>
        cronService.runDailyTasks(),
      );
    }
  }, [authReady, user, profile]);

  useEffect(() => {
    // Run migration from legacy keys
    migrateLegacyData();

    // Clear saved query and search states so user starting/entering the site lands completely fresh without prefilled search text.
    try {
      sessionStorage.removeItem("tebyan_current_query");
      sessionStorage.removeItem("tebyan_current_has_searched");
      localStorage.removeItem("tebyan_last_query");
      localStorage.removeItem("tebyan_last_has_searched");
    } catch (e) {}

    // Desktop: default closed behavior
    if (window.innerWidth >= 1024) {
      setSidebarOpen(false);
    }

    // Real URLs for Qawl Fasl: /qawl and /qawl/<question-id> open the reference directly.
    if (window.location.pathname.startsWith("/qawl")) {
      const qid = decodeURIComponent(
        window.location.pathname.split("/")[2] || "",
      );
      if (qid) setInitialContext(qid);
      setActiveTab("qawlfasl");
      return;
    }

    // Check if there's a tab in the URL (new door ids and legacy ids both work)
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab");
    const legacyTabs = [
      "oracle", "concepts", "quizzes", "timemachine", "council", "mindmap",
      "analytics", "loyalty", "roadmap", "story", "mylibrary", "contact",
      "strategicarena", "creativelab", "knowledgecenter", "ar",
      "truthmanuscript", "adminusers", "adminqawlfasl", "adminmessages",
    ];
    if (
      tabParam &&
      (tabs.some((t) => t.id === tabParam) || legacyTabs.includes(tabParam))
    ) {
      const ctx = searchParams.get("q");
      if (ctx) setInitialContext(ctx);
      setActiveTab(tabParam as Tab);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Optional: you could still auto-close here if you wanted,
        // but let's keep it under user control.
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowGlobalCommand(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (user && showLogin) {
      setShowLogin(false);
    }
  }, [user, showLogin]);

  const showToast = (
    message: string,
    type: "info" | "error" | "success" = "info",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const checkAuth = useCallback(
    (tab: Tab) => {
      const needsAccount = protectedFeatures.includes(tab);
      // Public routes must never wait for account restoration. Authentication is
      // loaded after the first paint and only gates features that truly need it.
      if (!authReady && !needsAccount) return true;
      if (!authReady && needsAccount) {
        showToast(
          language === "ar"
            ? "لحظة واحدة، نستعيد حسابك…"
            : "One moment, restoring your account…",
          "info",
        );
        return false;
      }

      if (tab === "qawlfasl") return true;

      if (!user && needsAccount) {
        const msg =
          language === "ar"
            ? "هذه الخدمة خاصة للمشتركين... يرجى التسجيل أو الدخول."
            : "This service is for subscribers only. Please register or login to access.";
        showToast(msg, "info");
        setShowLogin(true);
        return false;
      }
      return true;
    },
    [authReady, language, user, showToast],
  );

  const handleTabChange = useCallback(
    (
      tab: Tab | "ar" | "simulation_roleplay",
      context: string = "",
      exit: boolean = false,
      updateHistory: boolean = true,
    ) => {
      if (exit) {
        localStorage.removeItem("tebyan_last_query");
        localStorage.removeItem("tebyan_last_has_searched");
        sessionStorage.removeItem("tebyan_current_query");
        sessionStorage.removeItem("tebyan_current_has_searched");
      }
      setMobileMenuOpen(false);
      setSidebarOpen(false); // Force close
      setShowGlobalCommand(false);
      setShowPageHelp(false);
      // Dispatch event to close all other potential overlays (like Serendipity Compass)
      window.dispatchEvent(new CustomEvent("close_overlays"));

      let targetTab = tab as any;
      let targetContext = context;

      if (targetTab === "simulation_roleplay") {
        targetTab = "simulation";
        targetContext = "[ROLEPLAY]" + context;
      }

      const actualTab =
        targetTab === "home" || (targetTab as string) === "dashboard"
          ? "home"
          : targetTab;
      if (checkAuth(actualTab as Tab)) {
        setIsLoading(false);
        setError(null);
        setInitialContext(targetContext);
        setActiveTab(actualTab);
        if (updateHistory && typeof window !== "undefined") {
          const nextUrl =
            actualTab === "home"
              ? window.location.pathname
              : `${window.location.pathname}?tab=${encodeURIComponent(String(actualTab))}`;
          const currentUrl = `${window.location.pathname}${window.location.search}`;
          if (nextUrl !== currentUrl)
            window.history.pushState({ tab: actualTab }, "", nextUrl);
        }
        logEvent("feature_use", language, undefined, {
          feature: actualTab,
          context: targetContext,
        });
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "auto" });
          document.documentElement.scrollTo({ top: 0, behavior: "auto" });
          document.body.scrollTo({ top: 0, behavior: "auto" });
          const mainEl = document.querySelector("main");
          if (mainEl) mainEl.scrollTo({ top: 0, behavior: "auto" });
        }, 50);
      }
    },
    [
      checkAuth,
      language,
      activeTab,
      setMobileMenuOpen,
      setSidebarOpen,
      setIsLoading,
      setError,
      setInitialContext,
      setActiveTab,
    ],
  );

  // Listen for custom navigation events dispatched from child components (e.g. ClientProfilePanel)
  // When a 'navigate_tab' event is received, navigate to the given tab using handleTabChange.
  useEffect(() => {
    const listener = (e: any) => {
      const targetTab = e?.detail?.tab as Tab | undefined;
      if (targetTab) {
        handleTabChange(targetTab);
      }
    };
    window.addEventListener("navigate_tab", listener);
    return () => {
      window.removeEventListener("navigate_tab", listener);
    };
  }, [handleTabChange]);

  useEffect(() => {
    const handlePopState = () => {
      const tab = new URLSearchParams(window.location.search).get(
        "tab",
      ) as Tab | null;
      handleTabChange(tab || "home", "", false, false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handleTabChange]);

  const tabs = [
    ...getServiceTabs(language),
    {
      id: "discover",
      label: language === "ar" ? "المشكاة" : "Mishkat",
      brand: language === "ar" ? "كل أدوات تبيان" : "All of Tebyan",
      icon: Lamp,
      tooltip:
        language === "ar"
          ? "استكشف جميع خدمات تبيان حسب حاجتك"
          : "Explore all Tebyan services by need",
      category: "understand",
    },
    {
      id: "adminusers",
      label: language === "ar" ? "المستخدمين" : "Users",
      icon: Users,
      tooltip:
        language === "ar" ? "لوحة تحكم إدارة المستخدمين" : "User Management",
      hidden: !(
        profile?.role === "admin" ||
        user?.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
        user?.email?.toLowerCase() === "ah_f@hotmail.com" ||
        user?.email?.toLowerCase().includes("alfailakawidrahmad") ||
        user?.email?.toLowerCase().includes("dr.ahmad")
      ),
    },
    {
      id: "adminqawlfasl",
      label: language === "ar" ? "إدارة قول فصل" : "Admin Qawl Fasl",
      icon: MessageCircleQuestion,
      tooltip:
        language === "ar"
          ? "لوحة تحكم إدارة أسئلة قول فصل"
          : "Manage Qawl Fasl Questions",
      hidden: !(
        profile?.role === "admin" ||
        user?.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
        user?.email?.toLowerCase() === "ah_f@hotmail.com" ||
        user?.email?.toLowerCase().includes("alfailakawidrahmad") ||
        user?.email?.toLowerCase().includes("dr.ahmad")
      ),
    },
    {
      id: "adminmessages",
      label: language === "ar" ? "إدارة رسائل الدعم" : "Admin Support Messages",
      icon: Mail,
      tooltip:
        language === "ar"
          ? "لوحة إدارة رسائل الدعم والاتصال"
          : "Support Tickets",
      hidden: !(
        profile?.role === "admin" ||
        user?.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
        user?.email?.toLowerCase() === "ah_f@hotmail.com" ||
        user?.email?.toLowerCase().includes("alfailakawidrahmad") ||
        user?.email?.toLowerCase().includes("dr.ahmad")
      ),
    },
  ];

  const getPageHelpDetails = () => {
    if (language === "ar") {
      const finalUserName =
        userName && userName !== "ضيف" && userName !== "New User"
          ? userName
          : "";
      const finalUserGender = userGender || "neutral";

      const getGreetingTitle = (pageTitle: string) => {
        const greetingPrefix = finalUserName
          ? getGenderWord(
              finalUserGender,
              `أهلاً بك يا ${finalUserName} في`,
              `أهلاً بكِ يا ${finalUserName} في`,
              `أهلاً بك في`,
            )
          : getGenderWord(
              finalUserGender,
              `أهلاً بك في`,
              `أهلاً بكِ في`,
              `أهلاً بك في`,
            );
        return `${greetingPrefix} ${pageTitle}`;
      };

      switch (activeTab) {
        case "qawlfasl":
          return {
            title: getGreetingTitle("قول فصل ⚖️"),
            intro: "مساحة الحكمة لفض النزاعات وحسم النقاشات برأي عادل ومنقح.",
            steps: [
              "1️⃣ اكتب السؤال أو القضية المعقدة في الخانة لتهيئة الحوار.",
              "2️⃣ سيقوم تبيان بفصل القضية مستشهداً بالحجج والمنطق دون انحياز.",
              "3️⃣ اضغط على التفاصيل الإضافية لتعميق الرؤية أو حفظ النتيجة.",
            ],
            tip: "💡 يمكنك الاسترشاد بالآراء التاريخية لتوسيع أفق الفهم!",
          };
        case "decisionroom":
          return {
            title: getGreetingTitle("غرفة القرار 🤫"),
            intro:
              "لتفكيك الحيرة والوصول إلى أفضل الخيارات الممكنة بهدوء وعمق.",
            steps: [
              "1️⃣ وضع القرار الذي يشغل بالك وصيغه بوضوح.",
              '2️⃣ تدرج عبر تسلسل الجلسة بتفعيل "النبضة الأولى" ثم "زد العمق".',
              "3️⃣ تابع تسلسل الخطوات الأربعة لتأكيد اليقين وفحص كل زاوية.",
            ],
            tip: "💡 ابدأ بزاوية واحدة، وإذا احتجت عمقاً أكثر افتح زاوية إضافية بهدوء.",
          };
        case "strategicarena":
          return {
            title: getGreetingTitle("الميدان الاستراتيجي 🏹"),
            intro:
              "لتحويل الأهداف المعقدة والرؤى البعيدة إلى خطة تكتيكية جاهزة.",
            steps: [
              "1️⃣ عبّر عن الهدف أو المشروع الاستراتيجي الخاص بك.",
              "2️⃣ حدد المدى وطريقة التوجيه والسرعة للتخطيط المثالي.",
              "3️⃣ طبّق التحليل للحصول على مسار تنفيذي تتابعه خطوة بخطوة.",
            ],
            tip: "💡 استخدم الخرائط المفتوحة لتوقع العقبات قبل حدوثها!",
          };
        case "creativelab":
          return {
            title: getGreetingTitle("المختبر الإبداعي ⚛️"),
            intro:
              "مصنعك الخاص لمزج الأفكار المتباعدة وولادة الابتكار غير المألوف.",
            steps: [
              "1️⃣ حدد المواد المعرفية أو الهوايات أو المجالات التي تريد دمجها.",
              "2️⃣ اطلق الشرارة الإبداعية وشاهد نقاط تلاقٍ مدهشة وذكية.",
              "3️⃣ طوّر التصاميم الجديدة وافرغ أفكارك في ركن الورشة التفاعلية.",
            ],
            tip: "💡 الخروج عن المألوف يحتاج لجرأة... جرّب دمج أفكار متناقضة!",
          };
        case "ar":
          return {
            title: getGreetingTitle("تبيان الروابط (AR) 🕶️"),
            intro: "شاهد أفكارك ومجسمات المعرفة المجردة كروابط حية تتجسد حولك.",
            steps: [
              "1️⃣ اسمح بفتح الكاميرا لتفعيل تجربة واقع تبيان المعزز.",
              "2️⃣ شاهد حركة الأوراق الفكرية وشبكات المفاهيم في الفضاء.",
              "3️⃣ المس أي مجسم معرفي لاستجلاء باطنه ورواسب فكرته.",
            ],
            tip: "💡 تفاعل بكاميرا الهاتف أو شاشتك في بيئة نظيفة وجيدة الإضاءة!",
          };
        case "truthmanuscript":
          return {
            title: getGreetingTitle("مخطوطة الحقيقة 📜"),
            intro:
              "لتحويل هواجسك، مشاعرك وتأملاتك العميقة إلى مخطوطة فنية خالدة.",
            steps: [
              "1️⃣ اكتب ما تشعر به أو الفكرة التي تعصف بذهنك الآن.",
              "2️⃣ اختر الأقلام الفكرية والأسلوب الفلسفي المفضل لديك لحياكة النص.",
              "3️⃣ اضغط صناعة المخطوطة الفنية واحتفظ بها كإرث ينبض بوعيك.",
            ],
            tip: "💡 عبّر بعفوية مطلقة... الفن يولد من قلب الصدق!",
          };
        case "knowledgecenter":
          return {
            title: getGreetingTitle("مركز المعرفة 🕸️"),
            intro:
              "استكشف المفاهيم المعقدة من خلال شجرة مترابطة من العلوم والمعرفة.",
            steps: [
              "1️⃣ افتح مربع البحث العلمي المعزز واكتب مفهوماً يشغلك.",
              "2️⃣ انظر للعلامات وشبكة الروابط لتغوص في أصل المفهوم وجذوره.",
              "3️⃣ اقرأ التفاصيل الجانبية للحصول على إضاءات فلسفية وعلمية نادرة.",
            ],
            tip: "💡 تتبع الروابط المتشابكة لتكشف خبايا لم تكن ظاهرة للعيان!",
          };
        case "oracle":
          return {
            title: getGreetingTitle("المستشار الكلي 🔮"),
            intro: "فريق استشاري متكامل ومكون من عقول بشرية مبدعة لحل معضلاتك.",
            steps: [
              "1️⃣ حدد المستشار الأقرب لطبيعة سؤالك (عقلي، مالي، أو مهني).",
              "2️⃣ وجه سؤالك بدقة للحصول على فتوى ورؤية من عمق التخصص.",
              "3️⃣ بدّل بين النوافذ لتسمع آراء متعددة ومختلفة للقضية الواحدة.",
            ],
            tip: "💡 الرأي الحكيم يبنى على رؤية المشكلة من زوايا متعددة!",
          };
        case "mylibrary":
          return {
            title: getGreetingTitle("مكتبتك الخاصة 🔖"),
            intro:
              "المستودع الآمن لجميع كنوزك المعرفية، مخطوطاتك وقراراتك التاريخية.",
            steps: [
              "• اضغط على أي مخطوطة أو تحليل لمحاكاة قراءته أو تكرار تعديله.",
              "• تحكم بروتين الحفظ والاستدعاء لتنظيم مخزون أفكارك الثمينة.",
              "• يمكنك مشاركتها مع الرفقاء أو تركها سراً فكرياً لك وحده.",
            ],
            tip: "💡 مراجعة أفكارك القديمة تمنحك وعياً أفضل لتطورك الفكري!",
          };
        case "loyalty":
          return {
            title: getGreetingTitle("الولاء والهدايا 🎁"),
            intro:
              "عقد تبيان المميز لتقدير رحلتك المعرفية معنا وتقديم الهدايا الفريدة.",
            steps: [
              "• اجمع النقاط والأوسمة الفكرية من خلال استخدامك اليومي للتطبيق.",
              "• فعّل الهدايا والكوبونات للاستفادة من الميزات الخاصة بعضويتك.",
              "• تفقّد مستواك الفكري الحالي والامتيازات الصاحبة له.",
            ],
            tip: "💡 استخدامك اليومي الذكي يقودك لبلوغ مراتب علمية أعلى في النظام!",
          };
        case "contact":
          return {
            title: getGreetingTitle("تواصل معنا ✉️"),
            intro: "بوابة مفتوحة لإرسال مقترحاتك وملاحظاتك لمطوري تبيان.",
            steps: [
              "1️⃣ املأ البيانات وحدد نوع استفسارك بدقة.",
              "2️⃣ اكتب رسالتك مع تفاصيل كافية لمساعدتنا على فهم غرضك.",
              "3️⃣ اضغط على إرسال لنقوم بالتجاوب معك ودعمك بأسرع وقت.",
            ],
            tip: "💡 نحن نصغي لكل رسالة بحب وعمق لنرتقي بتبيان معاً!",
          };
        default:
          return {
            title: getGreetingTitle("تبيان ✨"),
            intro: "مساحة التمكين المعرفي والوعي المتكامل لأفكارك وقراراتك.",
            steps: [
              "• اختر الأداة التي تناسب احتياجك أو اطرح سؤالك ليقودك تبيان.",
              "• تنقل بسلاسة عبر القوائم لاستكشاف الابتكارات المصممة لأجلك.",
              "• استخدم زر الرجوع أعلى اليسار للتنقّل دون فقدان سياق حديثك.",
            ],
            tip: "💡 تبيان صُمم ليكون امتداداً واعياً لعقلك وتأملاتك!",
          };
      }
    } else {
      switch (activeTab) {
        case "qawlfasl":
          return {
            title: "Welcome to Qawl Fasl ⚖️",
            intro:
              "A precise space to resolve disputes and complex debates using neutrality and logic.",
            steps: [
              "1️⃣ Type your issue or complex debate in the designated box.",
              "2️⃣ Tebyan will break down the arguments with philosophical and logical balance.",
              "3️⃣ Access extra details or save the final judgment easily.",
            ],
            tip: "💡 Use historic opinions to expand your analytical framework!",
          };
        case "decisionroom":
          return {
            title: "Welcome to Decision Room 🤫",
            intro:
              "Deconstruct hesitation and reach optimal paths with clarity and profound focus.",
            steps: [
              "1️⃣ Enter the decision or dilemma on your mind clearly.",
              '2️⃣ Progress through the session by selecting "First pulse" and then "Go deeper".',
              "3️⃣ Follow the 4-step sequence to stress-test your confidence and trace every angle.",
            ],
            tip: "💡 Switch to the full lab version if you need raw customized tools!",
          };
        case "strategicarena":
          return {
            title: "Welcome to Strategic Arena 🏹",
            intro:
              "Convert complex objectives and abstract visions into a solid, structured roadmap.",
            steps: [
              "1️⃣ Express your major strategic goal or personal project.",
              "2️⃣ Select the appropriate time depth, balancing mode, and execution pace.",
              "3️⃣ Apply analysis to generate a visual, sequential action plan.",
            ],
            tip: "💡 Map unforeseen obstacles before taking real life actions!",
          };
        case "creativelab":
          return {
            title: "Welcome to Creative Lab ⚛️",
            intro:
              "Your workshop to fuse unrelated domains and trigger raw, out-of-the-box innovation.",
            steps: [
              "1️⃣ Define the topics, fields, or hobbies you wish to combine.",
              "2️⃣ Spark the connection and witness intelligent, unexpected crossovers.",
              "3️⃣ Polish your mock designs and map ideas freely in the interactive workbench.",
            ],
            tip: "💡 Great breakthroughs often come from fusing completely opposite thoughts!",
          };
        case "ar":
          return {
            title: "Welcome to Tebyan AR 🕶️",
            intro:
              "Visualize abstract ideas and cognitive networks as living objects around you.",
            steps: [
              "1️⃣ Allow camera access to initialize the augmented reality platform.",
              "2️⃣ Observe the flow of knowledge nodes and intellectual concept structures.",
              "3️⃣ Interact with floating objects to reveal their inner depth.",
            ],
            tip: "💡 Use a well-lit, quiet environment for the best spatial tracking!",
          };
        case "truthmanuscript":
          return {
            title: "Welcome to Truth Manuscript 📜",
            intro:
              "Turn your inner struggles, deep emotions, or thoughts into an elegant historic manuscript.",
            steps: [
              "1️⃣ Type whatever occupies your soul or mind in an unfiltered way.",
              "2️⃣ Choose your preferred philosophical writer filter and creative writing tools.",
              "3️⃣ Click to finalize and bind the manuscript to store in your private library.",
            ],
            tip: "💡 Express yourself with complete honesty, where masterpieces are born!",
          };
        case "knowledgecenter":
          return {
            title: "Welcome to Knowledge Center 🕸️",
            intro:
              "Explore complex subjects via a highly interconnected neural network of wisdom.",
            steps: [
              "1️⃣ Open the advanced research input and type a concept you wish to study.",
              "2️⃣ Track the lines and visual bonds to map related domains and origin points.",
              "3️⃣ Open side panels to read rare philosophical or academic insights.",
            ],
            tip: "💡 Follow adjacent paths to discover secrets hidden on first sight!",
          };
        case "oracle":
          return {
            title: "Welcome to Omni Counselor 🔮",
            intro:
              "Consult a highly balanced cabinet of historic and modern expert intellects.",
            steps: [
              "1️⃣ Set the master advisor closest to your problem field (clinical, engineering, philosophy).",
              "2️⃣ Type your query to hear advice woven from high-tier professional wisdom.",
              "3️⃣ Toggle between advisors to notice opposite point of views on the same challenge.",
            ],
            tip: "💡 Balanced choices are made by checking multiple sound viewpoints!",
          };
        case "mylibrary":
          return {
            title: "Welcome to My Library 🔖",
            intro:
              "The secure repository for all your saved manuscripts, decisions, and intellectual steps.",
            steps: [
              "• Click any artifact to read, copy, share, or re-simulate its analysis.",
              "• Customize categorization to tidy your cognitive shelf of precious assets.",
              "• Keep them entirely confidential or export your gems to friends.",
            ],
            tip: "💡 Revisiting older reflections often rewards you with instant clarity on your personal growth!",
          };
        case "loyalty":
          return {
            title: "Welcome to Loyalty & Coupons 🎁",
            intro:
              "Tebyan’s token of appreciation for your loyalty, unlocking deep benefits and badges.",
            steps: [
              "• Earn unique points and badges by exploring and using more tools daily.",
              "• Activate promo coupons or special gifts granted to members.",
              "• Track your current level and the associated premium benefits.",
            ],
            tip: "💡 Consistent daily intellectual engagement rises your standing in the global hierarchy!",
          };
        case "contact":
          return {
            title: "Welcome to Contact Us ✉️",
            intro:
              "An open gate to suggest features or talk directly to Tebyan developers.",
            steps: [
              "1️⃣ Fill in your active contact information and select the message topic.",
              "2️⃣ Write down your feedback or bug report with optional details.",
              "3️⃣ Click send and we will review and reply swiftly.",
            ],
            tip: "💡 We read every single note with care to shape the future of Tebyan together!",
          };
        default:
          return {
            title: `Welcome to Tebyan ✨`,
            intro: `An ambient platform for cognitive growth, strategic action, and elevated decisions.`,
            steps: [
              "• Select a specialised tab or ask your core mind question at the main entry.",
              "• Move smoothly between menus with responsive transitions.",
              "• The global back button keeps you in flow without resetting states.",
            ],
            tip: "💡 Tebyan is designed to be an extensions of your cognitive thinking flow!",
          };
      }
    }
  };

  return (
    <div
      className={cn(
        "h-[100dvh] tebyan-living-background font-sans flex flex-col overflow-hidden text-[#182231] selection:bg-zinc-200 selection:text-black",
        language === "ar" ? "rtl" : "ltr",
      )}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <AnimatePresence>
        {lighthouseIdea && (
          <LighthouseMode
            idea={lighthouseIdea}
            onClose={() => setLighthouseIdea(null)}
            language={language}
          />
        )}
        {showSplash && (
          <SplashScreen
            key="splash"
            onFinish={() => {
              try {
                sessionStorage.setItem("tebyan_splash_seen", "true");
              } catch (e) {}
              setShowSplash(false);
            }}
            language={language}
          />
        )}
        {isOffline && !showSplash && (
          <OfflineNotice key="offline-notice" language={language} />
        )}
      </AnimatePresence>

      {/* Background Elements (Volume & Texture) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 flex flex-col"
        style={{ opacity: 0.28 }}
      >
        <div className="absolute inset-0 bg-noise mix-blend-multiply opacity-20"></div>
        <div
          className="absolute top-0 right-0 w-full h-full blur-[120px] mix-blend-normal"
          style={{ backgroundColor: "var(--mood-glow)" }}
        />
      </div>

      {/* Liquid Mood Pour Transition */}
      <AnimatePresence>
        {showMoodTransition && (
          <motion.div
            initial={{ clipPath: "circle(0% at 50% 90%)", opacity: 0 }}
            animate={{ clipPath: "circle(150% at 50% 90%)", opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] pointer-events-none bg-mood-primary opacity-20"
          />
        )}
      </AnimatePresence>

      {enableNonCriticalUi && activeTab === "discover" && (
        <React.Suspense fallback={null}>
          <ThoughtNebula />
        </React.Suspense>
      )}
      {isInternalPage && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+84px)] left-4 md:left-8 z-[1000] flex items-center gap-2.5 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPageHelp(false);
              handleTabChange("discover", "", true);
            }}
            aria-label={language === "ar" ? "رجوع" : "Back"}
            title={language === "ar" ? "رجوع" : "Back"}
            data-no-auto-scroll="true"
            className="tebyan-global-back w-12 h-12 rounded-2xl bg-[#182231] text-white border border-white/60 shadow-[0_14px_34px_rgba(24,34,49,0.22)] backdrop-blur-xl transition-all hover:bg-black hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft
              className={cn("w-5 h-5", language === "ar" ? "" : "rotate-180")}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPageHelp((v) => !v);
            }}
            aria-label={language === "ar" ? "شرح الصفحة" : "Page help"}
            title={language === "ar" ? "شرح الصفحة" : "Page help"}
            data-no-auto-scroll="true"
            className="tebyan-page-help-button w-10 h-10 rounded-full bg-white/92 text-[#6E5F8E] border border-[#8E7AAE]/20 shadow-[0_10px_24px_rgba(24,34,49,0.12)] backdrop-blur-xl transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      )}
      <AnimatePresence>
        {isInternalPage &&
          showPageHelp &&
          (() => {
            const helpData = getPageHelpDetails();
            return (
              <motion.div
                key="help-tooltip-popup"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                className="fixed top-[calc(env(safe-area-inset-top)+134px)] left-4 md:left-8 z-[999] w-[min(340px,calc(100vw-24px))] rounded-[26px] bg-white/98 border border-[#8E7AAE]/20 shadow-[0_24px_75px_rgba(24,34,49,0.18)] backdrop-blur-3xl p-5 text-right overflow-y-auto max-h-[70vh] tebyan-custom-scroll"
                dir={language === "ar" ? "rtl" : "ltr"}
              >
                <div className="flex items-center gap-2 mb-2 text-[#6E5F8E] border-b border-[#8E7AAE]/10 pb-2">
                  <HelpCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-black text-[#182231]">
                    {helpData.title}
                  </span>
                </div>

                <p className="text-xs font-bold leading-relaxed text-[#64788D] mb-3.5 bg-[#FAF9F6] p-2 rounded-xl border border-[#8E7AAE]/5">
                  {helpData.intro}
                </p>

                <div className="space-y-2.5 mb-3.5">
                  {helpData.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-semibold leading-relaxed text-[#465568] border-r-2 border-[#8E7AAE]/16 pr-2"
                    >
                      {step}
                    </div>
                  ))}
                </div>

                <div className="bg-[#FAF9F6] border border-[#8FA9C7]/15 rounded-xl p-2.5 text-[11px] font-bold text-[#6E5F8E] leading-relaxed">
                  {helpData.tip}
                </div>
              </motion.div>
            );
          })()}
      </AnimatePresence>


      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
            className={cn(
              "fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border font-medium flex items-center gap-3 text-sm max-w-[90vw] md:max-w-md w-max backdrop-blur-xl",
              toast.type === "info"
                ? "bg-white/90 border-zinc-200/50 text-zinc-900"
                : toast.type === "error"
                  ? "bg-rose-50/90 border-rose-200/50 text-rose-900"
                  : "bg-emerald-50/90 border-emerald-200/50 text-emerald-900",
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full shadow-inner",
                toast.type === "info"
                  ? "bg-blue-500"
                  : toast.type === "error"
                    ? "bg-rose-500"
                    : "bg-emerald-500",
              )}
            />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        animate={{ y: showHeader ? 0 : -100 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="tebyan-app-header fixed top-0 left-0 right-0 z-40 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between pointer-events-none"
      >
        <div className="tebyan-floating-nav flex items-center gap-2 md:gap-5 pointer-events-auto">
          <button
            onClick={() => handleTabChange("home")}
            className="flex items-center gap-3 transition-transform active:scale-95"
            aria-label={language === "ar" ? "الصفحة الرئيسية" : "Home"}
          >
            <div className="w-10 h-10 bg-white/90 border border-[#8E7AAE]/20 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500 tebyan-orb-mark">
              <TebyanMark size={26} />
            </div>
            <span className="font-serif text-2xl font-bold text-[#182231] tracking-tight transition-colors group-hover:text-mood-primary">
              تبيان
            </span>
          </button>

        </div>

        <div className="tebyan-header-actions flex items-center gap-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="tebyan-menu-trigger md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-[#8FA9C7]/18 bg-white/88 text-[#182231] shadow-[0_7px_20px_rgba(24,34,49,0.06)] active:scale-[0.96]"
            aria-label={
              language === "ar" ? "فتح قائمة الخدمات" : "Open services menu"
            }
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block">
            <PWAHeaderButton language={language} />
          </div>
          <div className="hidden md:block">
            <React.Suspense fallback={null}>
              {user ? (
                <UserMenu />
              ) : authReady ? (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#8FA9C7]/18 bg-white/88 p-0 text-zinc-900 shadow-[0_7px_20px_rgba(24,34,49,0.06)] transition-transform duration-100 active:scale-[0.96]"
                  title={language === "ar" ? "تسجيل الدخول" : "Login"}
                >
                  <User className="w-4 h-4" />
                </button>
              ) : null}
            </React.Suspense>
          </div>
        </div>
      </motion.header>

      {/* --- Menu Overlay --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-50 bg-zinc-900/28 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: language === "ar" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: language === "ar" ? "100%" : "-100%" }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 bottom-0 right-0 w-[82%] max-w-[330px] bg-white shadow-2xl flex flex-col will-change-transform"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <button
                  onClick={() => {
                    handleTabChange("home");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 active:scale-95 transition-transform text-right"
                >
                  <div className="w-8 h-8 bg-mood-primary rounded-lg flex items-center justify-center shadow-lg shadow-mood-glow">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-lg text-black">تبيان</span>
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-zinc-200/50 rounded-full text-zinc-600 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
                {[
                  {
                    id: "home",
                    label: language === "ar" ? "اسأل تبيان" : "Ask Tebyan",
                    icon: Search,
                  },
                  {
                    id: "discover",
                    label:
                      language === "ar"
                        ? "المشكاة — كل الأدوات"
                        : "Mishkat — all tools",
                    icon: Lamp,
                  },
                  {
                    id: "rukni",
                    label:
                      language === "ar" ? "ركني — مكتبتي ونقاطي" : "My corner",
                    icon: LibraryBig,
                  },
                  {
                    id: "loyalty",
                    label:
                      language === "ar"
                        ? "تقدمي ومكافآتي"
                        : "Progress and rewards",
                    icon: TicketPercent,
                  },
                  {
                    id: "contact",
                    label: language === "ar" ? "تواصل معنا" : "Contact us",
                    icon: Mail,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabChange(item.id as Tab)}
                      className={cn(
                        "w-full min-h-12 flex items-center gap-3 rounded-[16px] px-4 text-right text-sm font-black transition-colors",
                        activeTab === item.id
                          ? "bg-[#182231] text-white"
                          : "text-[#465568] hover:bg-[#F5F3F8]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          activeTab === item.id
                            ? "text-white"
                            : "text-[#8E7AAE]",
                        )}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div className="my-3 h-px bg-zinc-100" />

                <PWAHeaderButton variant="menu" language={language} />
                <button
                  type="button"
                  onClick={() =>
                    setLanguage((value) => (value === "ar" ? "en" : "ar"))
                  }
                  className="w-full min-h-12 flex items-center gap-3 rounded-[16px] px-4 text-right text-sm font-black text-[#465568] hover:bg-[#F5F3F8]"
                >
                  <Globe className="h-5 w-5 shrink-0 text-[#8E7AAE]" />
                  <span>{language === "ar" ? "English" : "العربية"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.dispatchEvent(
                      new CustomEvent("tebyan_open_onboarding"),
                    );
                  }}
                  className="w-full min-h-12 flex items-center gap-3 rounded-[16px] px-4 text-right text-sm font-black text-[#465568] hover:bg-[#F5F3F8]"
                >
                  <HelpCircle className="h-5 w-5 shrink-0 text-[#8E7AAE]" />
                  <span>
                    {language === "ar" ? "دليل الاستخدام" : "How to use Tebyan"}
                  </span>
                </button>
              </div>

              <div className="border-t border-zinc-100 bg-zinc-50/60 p-4 space-y-2">
                {authReady && !user && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogin(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-12 rounded-[16px] bg-[#182231] px-4 text-sm font-black text-white"
                  >
                    {language === "ar"
                      ? "تسجيل الدخول للحفظ والمتابعة"
                      : "Sign in to save and continue"}
                  </button>
                )}
                {user && (
                  <>
                    <div className="flex min-h-12 items-center justify-between rounded-[16px] border border-zinc-200 bg-white px-4">
                      <div className="flex items-center gap-3 text-sm font-black text-[#182231]">
                        <User className="h-5 w-5 text-[#8E7AAE]" />
                        <span>
                          {language === "ar" ? "حسابي" : "My account"}
                        </span>
                      </div>
                      <React.Suspense fallback={null}>
                        <UserMenu />
                      </React.Suspense>
                    </div>
                    {(profile?.role === "admin" ||
                      user?.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
                      user?.email?.toLowerCase() === "ah_f@hotmail.com" ||
                      user?.email
                        ?.toLowerCase()
                        .includes("alfailakawidrahmad") ||
                      user?.email?.toLowerCase().includes("dr.ahmad")) && (
                      <button
                        type="button"
                        onClick={() => handleTabChange("admindashboard")}
                        className="w-full min-h-12 rounded-[16px] bg-zinc-900 px-4 text-sm font-black text-white"
                      >
                        {language === "ar" ? "لوحة الإدارة" : "Admin dashboard"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        [
                          "tebyan_memory",
                          "tebyan_cognitive_memory",
                          "tebyan_sage_progress",
                          "tebyan_search_history",
                          "tebyan_usage_stats",
                          "tebyan_analytics_logs",
                          "tebyan_galaxy_cache",
                          "tebyan_custom_avatar",
                          "tebyan_style_confirmed",
                        ].forEach((key) => localStorage.removeItem(key));
                        import("./lib/firebase").then(({ auth }) =>
                          import("firebase/auth").then(({ signOut }) =>
                            signOut(auth),
                          ),
                        );
                        setMobileMenuOpen(false);
                      }}
                      className="w-full min-h-12 rounded-[16px] border border-rose-200 bg-white px-4 text-sm font-black text-rose-600"
                    >
                      {language === "ar" ? "تسجيل الخروج" : "Sign out"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        className="tebyan-mobile-dock fixed inset-x-5 bottom-[calc(env(safe-area-inset-bottom)+8px)] z-40 grid grid-cols-3 gap-1 rounded-[20px] border border-[#8FA9C7]/18 bg-white/94 p-1 shadow-[0_12px_34px_rgba(24,34,49,0.12)] md:hidden"
        aria-label={
          language === "ar" ? "التنقل الرئيسي" : "Primary navigation"
        }
      >
        {[
          {
            id: "home",
            label: language === "ar" ? "اسأل" : "Ask",
            icon: Search,
          },
          {
            id: "discover",
            label: language === "ar" ? "المشكاة" : "Mishkat",
            icon: Lamp,
          },
          {
            id: "rukni",
            label: language === "ar" ? "ركني" : "My corner",
            icon: LibraryBig,
          },
        ].map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onPointerDown={() => {
                if (item.id === "home")
                  void import("./components/SmartGateway");
                if (item.id === "discover")
                  void import("./components/ServiceExplorer");
              }}
              onClick={() => handleTabChange(item.id as Tab)}
              className={cn(
                "min-h-[46px] rounded-[15px] text-[11px] font-black transition-colors duration-100 flex items-center justify-center gap-1.5 active:scale-[0.97]",
                selected
                  ? "bg-[#182231] text-white shadow-sm"
                  : "text-[#64788D] active:bg-[#F4F0F8]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* --- Desktop Sidebar Removed --- */}

      <main
        ref={mainRef}
        className={cn(
          "flex-1 w-full min-h-0 pt-24 md:pb-0 overflow-y-auto overflow-x-hidden relative custom-scrollbar tebyan-route-shell",
          "pb-20 md:pb-0",
          `tebyan-route-${activeTab}`,
        )}
      >
        {/* Error Banner */}
        {error && (
          <div className="m-4 md:m-8 bg-rose-50 border border-rose-200 text-rose-800 px-6 py-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-medium">
              <Sparkles className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-2 hover:bg-rose-100 rounded-full cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div
          className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 w-full min-h-full cursor-default"
          onClick={(e) => {
            // Do not navigate on empty background clicks; this caused accidental exits and felt like lag.
          }}
        >
          <motion.div
            key={activeTab}
            initial={
              ["home", "discover", "mylibrary", "rukni"].includes(activeTab)
                ? false
                : { opacity: 0, y: 5 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: ["home", "discover", "mylibrary", "rukni"].includes(activeTab)
                ? 0.01
                : 0.14,
              ease: "easeOut",
            }}
            className="relative z-10"
          >
            <div className="absolute -top-10 left-12 w-32 h-32 bg-mood-glow rounded-full blur-[80px] pointer-events-none opacity-50" />
            <React.Suspense fallback={<TabFallback />}>
              {(() => {
                switch (activeTab) {
                  case "home":
                    return (
                      <SmartGateway
                        language={language}
                        handleTabChange={handleTabChange}
                        tabs={tabs}
                        initialQuery={initialContext}
                        mood={currentMood}
                        onShowLogin={() => setShowLogin(true)}
                        isHome
                      />
                    );
                  case "discover":
                    return (
                      <ServiceExplorer
                        language={language}
                        handleTabChange={handleTabChange}
                      />
                    );
                  case "ask":
                    return (
                      <AskTebyanDoor
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "growth":
                    return (
                      <GrowthDoor
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "rukni":
                    return (
                      <RukniDoor
                        handleTabChange={handleTabChange}
                        language={language}
                      />
                    );
                  case "strategicarena":
                    return (
                      <StrategicArenaTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "creativelab":
                    return (
                      <CreativeLabWrapper
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "ar":
                    return (
                      <ARTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "truthmanuscript":
                    return (
                      <TruthManuscriptTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "knowledgecenter":
                    return (
                      <KnowledgeCenterTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "oracle":
                    return (
                      <OracleTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "concepts":
                    return (
                      <ConceptsTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "quizzes":
                    return (
                      <QuizTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "simulation":
                    return (
                      <SimulationTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "knowledgegraph":
                    return (
                      <KnowledgeGraphTab
                        handleTabChange={handleTabChange}
                        language={language}
                      />
                    );
                  case "timemachine":
                    return (
                      <TimeMachineTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "council":
                    return (
                      <CouncilTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "mindmap":
                    return (
                      <MindMapTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "ripple":
                    return (
                      <RippleEffectTab
                        language={language}
                        handleTabChange={handleTabChange}
                        onFocusMode={(idea) => setLighthouseIdea(idea)}
                      />
                    );
                  case "analytics":
                    return (
                      <AnalyticsTab
                        handleTabChange={handleTabChange}
                        language={language}
                      />
                    );
                  case "loyalty":
                    return (
                      <LoyaltyTab
                        handleTabChange={handleTabChange}
                        language={language}
                      />
                    );
                  case "roadmap":
                    return (
                      <RoadmapTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "story":
                    return (
                      <StoryTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "mylibrary":
                    return (
                      <MyLibraryTab
                        language={language}
                        handleTabChange={handleTabChange}
                      />
                    );
                  case "lab":
                    return (
                      <LabTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "qawlfasl":
                    return (
                      <QawlFaslTab
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "decisionroom":
                    return (
                      <DecisionDoor
                        handleTabChange={handleTabChange}
                        language={language}
                        initialValue={initialContext}
                      />
                    );
                  case "adminusers":
                    return profile?.role === "admin" ||
                      user?.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
                      user?.email?.toLowerCase() === "ah_f@hotmail.com" ||
                      user?.email
                        ?.toLowerCase()
                        .includes("alfailakawidrahmad") ||
                      user?.email?.toLowerCase().includes("dr.ahmad") ? (
                      <AdminUsersDashboard />
                    ) : null;
                  case "adminqawlfasl":
                    return profile?.role === "admin" ||
                      user?.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
                      user?.email?.toLowerCase() === "ah_f@hotmail.com" ||
                      user?.email
                        ?.toLowerCase()
                        .includes("alfailakawidrahmad") ||
                      user?.email?.toLowerCase().includes("dr.ahmad") ? (
                      <AdminQawlFasl />
                    ) : null;
                  case "adminmessages":
                    return profile?.role === "admin" ||
                      user?.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
                      user?.email?.toLowerCase() === "ah_f@hotmail.com" ||
                      user?.email
                        ?.toLowerCase()
                        .includes("alfailakawidrahmad") ||
                      user?.email?.toLowerCase().includes("dr.ahmad") ? (
                      <AdminContactTab language={language} />
                    ) : null;
                  case "admindashboard":
                    return profile?.role === "admin" ||
                      user?.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
                      user?.email?.toLowerCase() === "ah_f@hotmail.com" ||
                      user?.email
                        ?.toLowerCase()
                        .includes("alfailakawidrahmad") ||
                      user?.email?.toLowerCase().includes("dr.ahmad") ? (
                      <AdminDashboard />
                    ) : null;
                  case "contact":
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
              <span className="font-bold text-zinc-500 tracking-tight">
                تبيان
              </span>
            </div>
            <p className="text-[13px] font-medium">
              نظامك لفهم العالم &copy; {new Date().getFullYear()}
            </p>
            <div className="mt-6 opacity-40">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-500">
                Version 3.0.0
              </span>
            </div>
          </footer>
        </div>
      </main>

      {/* Login Modal - Moved out of flow */}
      <AnimatePresence>
        {showLogin && !user && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
            }}
            className="flex items-center justify-center p-4 bg-zinc-900/40"
            onClick={() => setShowLogin(false)}
          >
            <div
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLogin(false)}
                className="absolute -top-12 right-0 z-10 p-2.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="shadow-[0_24px_60px_rgb(0,0,0,0.12)] rounded-[24px] md:rounded-[32px] overflow-hidden">
                <React.Suspense
                  fallback={
                    <div className="min-h-[420px] bg-white flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#8E7AAE]" />
                    </div>
                  }
                >
                  <Login />
                </React.Suspense>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {showGlobalCommand && (
        <React.Suspense fallback={null}>
          <GlobalCommand
            isOpen={showGlobalCommand}
            onClose={() => setShowGlobalCommand(false)}
            language={language}
            tabs={tabs}
            handleTabChange={handleTabChange}
          />
        </React.Suspense>
      )}



      <PWAInstallPrompt />
      <OnboardingTour language={language} />
    </div>
  );
};

import { TooltipProvider } from "./components/ui/tooltip";

const App = () => (
  <CognitiveModeProvider>
    <GamificationProvider>
      <UserProvider>
        <TooltipProvider delayDuration={300}>
          <AppContent />
        </TooltipProvider>
      </UserProvider>
    </GamificationProvider>
  </CognitiveModeProvider>
);

export default App;
