import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Sparkles,
  MessageCircleQuestion,
  BrainCircuit,
  Gamepad2,
  ArrowLeft,
  Lightbulb,
  Zap,
  Route,
  Rocket,
  Activity,
  BarChart3,
  Network,
  Hourglass,
  ClipboardCheck,
  Command,
  X,
  Lock,
  Box,
  Waves,
  ScrollText,
  Compass,
  Moon,
  Eye,
  CheckCircle2,
  LayoutGrid,
} from "lucide-react";
import { cn } from "../lib/utils";
import { logEvent } from "../services/analyticsService";
import { useUser } from "../contexts/UserContext";
import { useAuth } from "../components/AuthProvider";
import {
  getActiveUser,
  getGenderWord,
  whiteDialectPhrases,
} from "../utils/genderHelper";

import { GravityCard } from "./GravityCard";
import { AIHeartbeat } from "./ui/AIHeartbeat";
import { TypographicAcoustic } from "./TypographicAcoustic";
import { SmartIntentEngine } from "./common/SmartIntentEngine";
import { KnowledgeSignature } from "./common/KnowledgeSignature";
import { TebyanGlyph } from "./common/TebyanGlyph";
import TextareaAutosize from "react-textarea-autosize";
import { TebyanTooltip } from "./TebyanTooltip";
import { DirectAnswerCard } from "./gateway/DirectAnswerCard";
import {
  buildDirectGuidance,
  type ResponseMode,
} from "./gateway/directGuidance";

const DAILY_CHALLENGES = [
  {
    titleAr: "كيف تدير صراعاً حاداً بين أفراد فريقك أو عائلتك؟",
    titleEn: "How to manage severe conflict among your team or family?",
    query: "كيف أتعامل مع توتر حاد وصدام بين شخصين في فريقي؟",
    path: "simulation_roleplay",
  },
  {
    titleAr: "ماذا تفعل إذا انهارت خطتك في اللحظة الأخيرة؟",
    titleEn: "What to do if your plan falls apart at the last minute?",
    query: "خطة مهمة جداً فشلت فجأة، كيف ألملم الوضع وأتخذ قراراً؟",
    path: "simulation_roleplay",
  },
  {
    titleAr: "كيف تتصرف مع عميل أو شريك غاضب جداً؟",
    titleEn: "How do you handle a very angry client or partner?",
    query: "كيف أتصرف بذكاء مع شخص منفعل وغاضب يهاجمني الآن؟",
    path: "simulation_roleplay",
  },
  {
    titleAr: "كيف تتخذ قراراً صعباً وسط ضغوط متضاربة؟",
    titleEn: "How to make a difficult decision amid conflicting pressures?",
    query: "أواجه قراراً معقداً ولا أعرف من أين أبدأ أو كيف أوازن المخاطر؟",
    path: "simulation_roleplay",
  },
  {
    titleAr: "كيف تقنع طرفاً عنيداً بتوجه جديد دون صدام؟",
    titleEn: "How to convince a stubborn party without a clash?",
    query: "كيف أقنع شخصاً عنيداً بتغيير المسار وتجربة شيء جديد؟",
    path: "simulation_roleplay",
  },
];

const PLATFORM_INSIGHTS = [
  {
    titleAr: "أكثر التحديات الإنسانية هذا الأسبوع",
    titleEn: "Top human challenges this week",
    items: [
      {
        labelAr: "إدارة الغضب",
        labelEn: "Anger Management",
        pct: "70%",
        color: "bg-[#8FA9C7]",
      },
      {
        labelAr: "صناعة القرار",
        labelEn: "Decision Making",
        pct: "85%",
        color: "bg-[#8E7AAE]",
      },
    ],
  },
  {
    titleAr: "تحديات التواصل الحديثة",
    titleEn: "Modern Communication Challenges",
    items: [
      {
        labelAr: "القلق والمخاوف",
        labelEn: "Anxiety & Fears",
        pct: "60%",
        color: "bg-[#B7A7C7]",
      },
      {
        labelAr: "الإقناع والتفاوض",
        labelEn: "Persuasion & Negotiation",
        pct: "75%",
        color: "bg-[#AFC0D2]",
      },
    ],
  },
  {
    titleAr: "مواقف صعبة شائعة اليوم",
    titleEn: "Common Difficult Situations Today",
    items: [
      {
        labelAr: "العناد المفرط",
        labelEn: "Extreme Stubbornness",
        pct: "80%",
        color: "bg-[#9F8CC0]",
      },
      {
        labelAr: "رفض التغيير",
        labelEn: "Resistance to Change",
        pct: "50%",
        color: "bg-[#CFDAE5]",
      },
    ],
  },
  {
    titleAr: "محاور الذكاء العاطفي",
    titleEn: "Emotional Intelligence Focus",
    items: [
      {
        labelAr: "حل النزاعات",
        labelEn: "Conflict Resolution",
        pct: "65%",
        color: "bg-[#9BB4CD]",
      },
      {
        labelAr: "التواصل الفعال",
        labelEn: "Effective Communication",
        pct: "90%",
        color: "bg-[#D6CDE2]",
      },
    ],
  },
];

const colorMap: Record<string, string> = {
  mood: "var(--mood-primary)",
  secondary: "var(--mood-secondary)",
  zinc: "#71717a",
};

import { useFluidTyping } from "../hooks/useFluidTyping";

interface SmartGatewayProps {
  language: "ar" | "en";
  handleTabChange: (id: any, context?: string) => void;
  tabs: any[];
  mood?: string;
  onShowLogin?: () => void;
  isHome?: boolean;
}

type JourneyProfile = {
  id: string;
  title: { ar: string; en: string };
  promise: { ar: string; en: string };
  firstDoor: { ar: string; en: string };
  deepen: { ar: string; en: string };
  accent: string;
  icon: any;
};

const pickJourneyProfile = (
  raw: string,
  fallbackId?: string,
): JourneyProfile => {
  const q = (raw || "").toLowerCase();
  const has = (...words: string[]) => words.some((word) => q.includes(word));

  if (
    has(
      "قرار",
      "اختار",
      "احسم",
      "حيرة",
      "محتار",
      "مصيري",
      "decision",
      "choose",
      "decide",
    ) ||
    fallbackId === "decisionroom"
  ) {
    return {
      id: "decision",
      title: { ar: "رحلة قرار", en: "Decision journey" },
      promise: {
        ar: "نحول الحيرة إلى باب واحد واضح، ثم نزيد العمق فقط إذا احتجت.",
        en: "We turn hesitation into one clear doorway, then deepen only if needed.",
      },
      firstDoor: {
        ar: "افتح أول باب للحسم",
        en: "Open the first decision doorway",
      },
      deepen: {
        ar: "بعدها نقدر نكشف المخاطر أو المستقبل.",
        en: "After that, we can reveal risks or the future.",
      },
      accent: "#8E7AAE",
      icon: Lock,
    };
  }

  if (
    has(
      "فكرة",
      "ابتكار",
      "مشروع",
      "تصميم",
      "إبداع",
      "creative",
      "idea",
      "project",
      "design",
    ) ||
    fallbackId === "creativelab"
  ) {
    return {
      id: "idea",
      title: { ar: "رحلة فكرة", en: "Idea journey" },
      promise: {
        ar: "نأخذ الفكرة الخام ونفتح لها أول زاوية قابلة للتطوير.",
        en: "We take the raw idea and open the first buildable angle.",
      },
      firstDoor: { ar: "ابدأ تشكيل الفكرة", en: "Start shaping the idea" },
      deepen: {
        ar: "بعدها نقدر نحولها لخطة أو نختبرها.",
        en: "Then we can turn it into a plan or test it.",
      },
      accent: "#C8A9CB",
      icon: Lightbulb,
    };
  }

  if (
    has("خطة", "خطوات", "تنفيذ", "هدف", "roadmap", "plan", "execute", "goal") ||
    fallbackId === "roadmap"
  ) {
    return {
      id: "execution",
      title: { ar: "رحلة تنفيذ", en: "Execution journey" },
      promise: {
        ar: "نرتب الفوضى إلى خطوة أولى، ثم مسار قابل للمتابعة.",
        en: "We turn the mess into a first step, then a trackable path.",
      },
      firstDoor: {
        ar: "حوّلها إلى خطوة عملية",
        en: "Turn it into an action step",
      },
      deepen: {
        ar: "بعدها نقدر نقيس التقدم أو نرسم الطريق.",
        en: "Then we can measure progress or map the road.",
      },
      accent: "#8FA9C7",
      icon: Route,
    };
  }

  if (
    has(
      "خلاف",
      "نزاع",
      "غضب",
      "توتر",
      "صراع",
      "مشكلة",
      "conflict",
      "angry",
      "fight",
      "tension",
    ) ||
    fallbackId === "qawlfasl"
  ) {
    return {
      id: "conflict",
      title: { ar: "رحلة موقف", en: "Situation journey" },
      promise: {
        ar: "نهدئ الضجيج ونفتح أول باب لفهم الموقف والتصرف بذكاء.",
        en: "We quiet the noise and open the first doorway to understand and act wisely.",
      },
      firstDoor: {
        ar: "افتح باب التصرف الصحيح",
        en: "Open the right response doorway",
      },
      deepen: {
        ar: "بعدها نقدر نحاكي الحوار أو نسمع زوايا مختلفة.",
        en: "Then we can simulate the dialogue or hear different angles.",
      },
      accent: "#A8C3BD",
      icon: MessageCircleQuestion,
    };
  }

  if (
    has(
      "مستقبل",
      "توقع",
      "زمن",
      "مخاطر",
      "سيناريو",
      "future",
      "risk",
      "scenario",
    ) ||
    fallbackId === "simulation"
  ) {
    return {
      id: "future",
      title: { ar: "رحلة مستقبل", en: "Future journey" },
      promise: {
        ar: "نفتح أول مشهد لما قد يحدث، بدون إغراقك بكل المختبر.",
        en: "We open the first scene of what may happen, without flooding you with the whole lab.",
      },
      firstDoor: { ar: "شاهد أول سيناريو", en: "See the first scenario" },
      deepen: {
        ar: "بعدها نقدر نختبر القرار بقسوة أكبر.",
        en: "Then we can stress-test it harder.",
      },
      accent: "#B7A7C7",
      icon: Hourglass,
    };
  }

  return {
    id: "understanding",
    title: { ar: "رحلة فهم", en: "Understanding journey" },
    promise: {
      ar: "نبدأ بفهم واضح واحد، ثم نفتح العمق فقط إذا طلبته.",
      en: "We begin with one clear understanding, then open depth only when you ask.",
    },
    firstDoor: { ar: "افتح باب الفهم", en: "Open the understanding doorway" },
    deepen: {
      ar: "بعدها نقدر نحول الفهم إلى قرار أو خطة.",
      en: "Then we can turn understanding into a decision or plan.",
    },
    accent: "#7C8796",
    icon: BrainCircuit,
  };
};

const JOURNEY_DOOR_ORDER: Record<string, string[]> = {
  decision: [
    "decisionroom",
    "qawlfasl",
    "strategicarena",
    "knowledgecenter",
    "oracle",
    "ripple",
  ],
  conflict: [
    "qawlfasl",
    "simulation_roleplay",
    "strategicarena",
    "oracle",
    "knowledgecenter",
    "decisionroom",
  ],
  idea: [
    "creativelab",
    "oracle",
    "knowledgecenter",
    "strategicarena",
    "ripple",
    "decisionroom",
  ],
  execution: [
    "knowledgecenter",
    "roadmap",
    "strategicarena",
    "qawlfasl",
    "oracle",
    "decisionroom",
  ],
  future: [
    "strategicarena",
    "decisionroom",
    "oracle",
    "knowledgecenter",
    "qawlfasl",
    "ripple",
  ],
  understanding: [
    "oracle",
    "knowledgecenter",
    "qawlfasl",
    "strategicarena",
    "creativelab",
    "decisionroom",
    "ripple",
  ],
};

const DOOR_COPY: Record<
  string,
  Array<{ ar: string; en: string; descAr: string; descEn: string }>
> = {
  decision: [
    {
      ar: "باب الحسم",
      en: "Decision door",
      descAr: "نرتب الاختيارات ونقرب القرار.",
      descEn: "We organize options and move toward a decision.",
    },
    {
      ar: "باب الحقيقة",
      en: "Truth door",
      descAr: "نكشف ما هو ثابت وما يحتاج سؤالاً.",
      descEn: "We reveal what is solid and what still needs asking.",
    },
    {
      ar: "باب المستقبل",
      en: "Future door",
      descAr: "نرى أثر القرار قبل حدوثه.",
      descEn: "We preview the decision before it happens.",
    },
    {
      ar: "باب الفجوة",
      en: "Gap door",
      descAr: "نعرف ما ينقصنا قبل الخطوة.",
      descEn: "We find what is missing before the next move.",
    },
    {
      ar: "باب الحكمة",
      en: "Wisdom door",
      descAr: "نأخذ جواباً أهدأ وأوسع.",
      descEn: "We take a calmer, wider answer.",
    },
    {
      ar: "باب الأثر",
      en: "Impact door",
      descAr: "نشوف كيف القرار يلمس بقية الأفكار.",
      descEn: "We see how the decision touches other ideas.",
    },
  ],
  conflict: [
    {
      ar: "باب التصرف",
      en: "Response door",
      descAr: "نهدئ الموقف ونحدد الرد الأنسب.",
      descEn: "We calm the situation and choose the best response.",
    },
    {
      ar: "باب التجربة",
      en: "Rehearsal door",
      descAr: "نجرب الحوار قبل أن تقوله.",
      descEn: "We rehearse the conversation before you say it.",
    },
    {
      ar: "باب الصورة الكبيرة",
      en: "Big picture door",
      descAr: "نرى القوى الخفية في الموقف.",
      descEn: "We see the hidden forces in the situation.",
    },
    {
      ar: "باب الحكمة",
      en: "Wisdom door",
      descAr: "نسمع جواباً متزنًا بلا استعجال.",
      descEn: "We hear a balanced answer without rushing.",
    },
    {
      ar: "باب الفهم",
      en: "Understanding door",
      descAr: "نربط الأسباب ونخفف التشويش.",
      descEn: "We connect causes and reduce noise.",
    },
    {
      ar: "باب القرار",
      en: "Decision door",
      descAr: "إذا احتجت حسم، نحسم بهدوء.",
      descEn: "If you need a decision, we decide calmly.",
    },
  ],
  idea: [
    {
      ar: "باب التشكيل",
      en: "Shaping door",
      descAr: "نحوّل الفكرة الخام إلى بداية واضحة.",
      descEn: "We turn the raw idea into a clear start.",
    },
    {
      ar: "باب الإلهام",
      en: "Inspiration door",
      descAr: "نفتح زاوية غير متوقعة.",
      descEn: "We open an unexpected angle.",
    },
    {
      ar: "باب الفجوة",
      en: "Gap door",
      descAr: "نعرف ما تحتاجه الفكرة لتكبر.",
      descEn: "We find what the idea needs to grow.",
    },
    {
      ar: "باب السوق",
      en: "Strategy door",
      descAr: "نختبر الفكرة في الواقع.",
      descEn: "We test the idea against reality.",
    },
    {
      ar: "باب النسيج",
      en: "Fabric door",
      descAr: "نشوف تشعبات الفكرة وأثرها.",
      descEn: "We see the idea branches and impact.",
    },
    {
      ar: "باب الحسم",
      en: "Decision door",
      descAr: "نختار النسخة الأقوى من الفكرة.",
      descEn: "We choose the strongest version of the idea.",
    },
  ],
  execution: [
    {
      ar: "باب الخطوة",
      en: "Action door",
      descAr: "نحوّل الموضوع إلى خطوة عملية.",
      descEn: "We turn the topic into a practical step.",
    },
    {
      ar: "باب الطريق",
      en: "Road door",
      descAr: "نرسم المسار بدون تعقيد.",
      descEn: "We map the path without complexity.",
    },
    {
      ar: "باب الأولويات",
      en: "Priority door",
      descAr: "نرتب المهم قبل المستعجل.",
      descEn: "We order what matters before what shouts.",
    },
    {
      ar: "باب الوضوح",
      en: "Clarity door",
      descAr: "نزيل العوائق من البداية.",
      descEn: "We remove obstacles from the start.",
    },
    {
      ar: "باب الحكمة",
      en: "Wisdom door",
      descAr: "نراجع الخطة بعين أهدأ.",
      descEn: "We review the plan with a calmer eye.",
    },
    {
      ar: "باب القرار",
      en: "Decision door",
      descAr: "نحسم الخطوة التالية بثقة.",
      descEn: "We decide the next step with confidence.",
    },
  ],
  future: [
    {
      ar: "باب السيناريو",
      en: "Scenario door",
      descAr: "نرى ما قد يحدث قبل أن يحدث.",
      descEn: "We see what may happen before it happens.",
    },
    {
      ar: "باب الاختبار",
      en: "Stress-test door",
      descAr: "نضغط القرار ونشوف صلابته.",
      descEn: "We pressure-test the decision.",
    },
    {
      ar: "باب الحكمة",
      en: "Wisdom door",
      descAr: "نوسع النظر قبل الحركة.",
      descEn: "We widen the view before moving.",
    },
    {
      ar: "باب الفجوة",
      en: "Gap door",
      descAr: "نكشف ما لم يُحسب حسابه.",
      descEn: "We reveal what was not accounted for.",
    },
    {
      ar: "باب الحقيقة",
      en: "Truth door",
      descAr: "نثبت النقاط قبل التوقع.",
      descEn: "We ground the facts before forecasting.",
    },
    {
      ar: "باب الأثر",
      en: "Impact door",
      descAr: "نراقب امتداد القرار.",
      descEn: "We watch the decision ripple outward.",
    },
  ],
  understanding: [
    {
      ar: "باب المعنى",
      en: "Meaning door",
      descAr: "نفهم الموضوع دون تشتت.",
      descEn: "We understand the topic without clutter.",
    },
    {
      ar: "باب الفجوة",
      en: "Gap door",
      descAr: "نحدد ما يحتاج توضيحاً.",
      descEn: "We identify what needs clarification.",
    },
    {
      ar: "باب الحقيقة",
      en: "Truth door",
      descAr: "نفرق بين الشعور والمعطيات.",
      descEn: "We separate feeling from facts.",
    },
    {
      ar: "باب الصورة الكبيرة",
      en: "Big picture door",
      descAr: "نضع الموضوع في سياقه الأوسع.",
      descEn: "We place the topic in its wider context.",
    },
    {
      ar: "باب الفكرة",
      en: "Idea door",
      descAr: "نحوّل الفهم إلى احتمال جديد.",
      descEn: "We turn understanding into a new possibility.",
    },
    {
      ar: "باب الحسم",
      en: "Decision door",
      descAr: "إذا اتضح المعنى، نختار الخطوة.",
      descEn: "When meaning is clear, we choose the step.",
    },
    {
      ar: "باب النسيج",
      en: "Fabric door",
      descAr: "نرى الروابط التي لم تكن ظاهرة.",
      descEn: "We see links that were not visible.",
    },
  ],
};

const decorateJourneyDoors = (
  ranked: any[],
  tabs: any[],
  journeyId: string,
  language: "ar" | "en",
) => {
  const order =
    JOURNEY_DOOR_ORDER[journeyId] || JOURNEY_DOOR_ORDER.understanding;
  const rankedById = new Map(ranked.map((item) => [item.id, item]));
  const tabById = new Map((tabs || []).map((tab) => [tab.id, tab]));
  const used = new Set<string>();
  const copySet = DOOR_COPY[journeyId] || DOOR_COPY.understanding;

  const buildDoor = (id: string, index: number) => {
    const base = rankedById.get(id) || tabById.get(id);
    if (!base || used.has(id)) return null;
    used.add(id);
    const copy = copySet[index % copySet.length];
    return {
      ...base,
      id,
      icon: base.icon || Sparkles,
      label: language === "ar" ? copy.ar : copy.en,
      desc: language === "ar" ? copy.descAr : copy.descEn,
      tooltip: language === "ar" ? copy.descAr : copy.descEn,
      doorIndex: index + 1,
    };
  };

  const doors = order.map((id, index) => buildDoor(id, index)).filter(Boolean);
  ranked.forEach((item) => {
    if (used.has(item.id)) return;
    const copy = copySet[doors.length % copySet.length];
    used.add(item.id);
    doors.push({
      ...item,
      label: language === "ar" ? copy.ar : copy.en,
      desc: language === "ar" ? copy.descAr : copy.descEn,
      tooltip: language === "ar" ? copy.descAr : copy.descEn,
      doorIndex: doors.length + 1,
    });
  });

  return doors.slice(0, 8);
};

const getMoodTypography = (mood: string) => {
  switch (mood) {
    case "revolutionary":
      return "font-black italic skew-x-[-10deg] tracking-tight transition-all duration-700";
    case "calm":
      return "font-light tracking-widest italic opacity-80 font-sans transition-all duration-1000";
    case "melancholic":
      return "font-medium tracking-tight opacity-70 underline underline-offset-4 decoration-current transition-all duration-1000";
    case "optimistic":
      return "font-bold tracking-normal uppercase transition-all duration-500";
    default:
      return "font-bold tracking-tight transition-all";
  }
};

const getCognitiveMood = (text: string, language: "ar" | "en") => {
  const q = (text || "").toLowerCase();
  const has = (words: string[]) => words.some((w) => q.includes(w));
  if (
    has([
      "خطر",
      "أزمة",
      "طوارئ",
      "كارثة",
      "ينتحر",
      "يؤذي",
      "urgent",
      "danger",
      "crisis",
      "emergency",
    ])
  ) {
    return {
      id: "warning",
      label: language === "ar" ? "مقام تنبيه هادئ" : "Calm alert mood",
      hint:
        language === "ar"
          ? "تبيان سيحافظ على الهدوء ويطلب السياق الحاسم."
          : "Tebyan will stay calm and ask for decisive context.",
      accent: "#A6603F",
      glow: "rgba(166,96,63,0.16)",
      soft: "rgba(166,96,63,0.07)",
    };
  }
  if (
    has([
      "قرار",
      "احسم",
      "اختار",
      "حيرة",
      "أقرر",
      "decide",
      "decision",
      "choose",
    ])
  ) {
    return {
      id: "decision",
      label: language === "ar" ? "مقام قرار" : "Decision mood",
      hint:
        language === "ar"
          ? "السؤال يميل إلى الترجيح والحسم."
          : "This leans toward weighing and deciding.",
      accent: "#8E7AAE",
      glow: "rgba(142,122,174,0.22)",
      soft: "rgba(142,122,174,0.08)",
    };
  }
  if (
    has([
      "إبداع",
      "فكرة",
      "ابتكار",
      "مشروع",
      "creative",
      "idea",
      "innovation",
      "project",
    ])
  ) {
    return {
      id: "creative",
      label: language === "ar" ? "مقام إبداع" : "Creative mood",
      hint:
        language === "ar"
          ? "تبيان سيبحث عن زاوية جديدة لا عن جواب عادي."
          : "Tebyan will seek a fresh angle, not a generic answer.",
      accent: "#C8A9CB",
      glow: "rgba(200,169,203,0.22)",
      soft: "rgba(200,169,203,0.08)",
    };
  }
  if (
    has([
      "معرفة",
      "مفهوم",
      "بحث",
      "مصدر",
      "تعلم",
      "knowledge",
      "concept",
      "research",
      "learn",
    ])
  ) {
    return {
      id: "knowledge",
      label: language === "ar" ? "مقام معرفة" : "Knowledge mood",
      hint:
        language === "ar"
          ? "السؤال يحتاج ربطاً بين المفاهيم والمعنى."
          : "This needs links between concepts and meaning.",
      accent: "#7C8796",
      glow: "rgba(124,135,150,0.20)",
      soft: "rgba(124,135,150,0.08)",
    };
  }
  return {
    id: "understanding",
    label: language === "ar" ? "مقام فهم" : "Understanding mood",
    hint:
      language === "ar"
        ? "تبيان يقرأ طبيعة السؤال ويهيّئ مسار الفهم."
        : "Tebyan reads the question and prepares the understanding path.",
    accent: "#8FA9C7",
    glow: "rgba(143,169,199,0.22)",
    soft: "rgba(143,169,199,0.08)",
  };
};

const ThoughtJourney = ({
  language,
  moodLabel,
}: {
  language: "ar" | "en";
  moodLabel: string;
}) => {
  const steps =
    language === "ar"
      ? [
          { label: "كُتبت", icon: MessageCircleQuestion },
          { label: "فُهمت", icon: Eye },
          { label: "وُجّهت", icon: Route },
          { label: "صارت معرفة", icon: CheckCircle2 },
        ]
      : [
          { label: "Written", icon: MessageCircleQuestion },
          { label: "Understood", icon: Eye },
          { label: "Routed", icon: Route },
          { label: "Knowledge", icon: CheckCircle2 },
        ];
  return (
    <div
      className="tebyan-thought-journey tebyan-focus-keep"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-[#8E7AAE]/14 shadow-sm">
            <Sparkles className="h-4 w-4 text-[#8E7AAE]" />
          </span>
          <div>
            <p className="text-xs font-black text-[#182231]">
              {language === "ar" ? "رحلة الفكرة" : "Thought journey"}
            </p>
            <p className="text-[10px] font-bold text-[#7C8796]">{moodLabel}</p>
          </div>
        </div>
        <span className="text-[10px] font-black text-[#8E7AAE] bg-white/70 px-3 py-1 rounded-full border border-[#8E7AAE]/10">
          {language === "ar" ? "مسار معرفي" : "Cognitive path"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className="relative rounded-2xl bg-white/72 border border-[#8FA9C7]/14 px-2 py-3 text-center shadow-sm overflow-hidden"
            >
              {index < steps.length - 1 && (
                <span className="hidden md:block absolute top-1/2 -left-2 h-px w-4 bg-[#8FA9C7]/28" />
              )}
              <Icon className="h-4 w-4 mx-auto mb-2 text-[#6E5F8E]" />
              <span className="block text-[10px] md:text-[11px] font-black text-[#465568]">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MoodBackgroundEffect = ({ mood }: { mood: string }) => {
  if (mood === "melancholic") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`drop-${i}`}
            initial={{ y: -50, opacity: 0 }}
            animate={{
              y: [null, 200, 600],
              opacity: [0, 0.4, 0],
              x: 10 + Math.random() * 80 + "%",
            }}
            transition={{
              duration: 10 + Math.random() * 8,
              repeat: Infinity,
              delay: i * 1.5,
            }}
            className="absolute top-0 w-[1px] h-40 bg-gradient-to-b from-transparent via-mood-primary/30 to-transparent blur-[1px]"
          />
        ))}
      </div>
    );
  }
  if (mood === "revolutionary") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`spark-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.8, 0],
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
            }}
            transition={{
              duration: 1.5 + Math.random() * 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
            className="absolute w-1 h-1 bg-mood-primary rounded-full shadow-[0_0_8px_rgba(var(--mood-primary-rgb),0.8)]"
          />
        ))}
      </div>
    );
  }
  return null;
};

import { useSmartSearch } from "../hooks/useSmartSearch";
import { useInstantSearch } from "../hooks/useInstantSearch";
import { InstantResults } from "./InstantResults";
import { useGamification } from "../hooks/useGamification";

export const SmartGateway: React.FC<
  SmartGatewayProps & { initialQuery?: string; onQueryUsed?: () => void }
> = ({
  language,
  handleTabChange,
  tabs,
  initialQuery,
  onQueryUsed,
  mood,
  onShowLogin,
  isHome = false,
}) => {
  const {
    preferences,
    addToLibrary,
    removeFromLibrary,
    setUserStyle: setGlobalUserStyle,
  } = useUser();
  const { user, userName, userGender } = useAuth();
  const { state: gamificationState } = useGamification();
  const helpOpacity = Math.max(0, 1 - (gamificationState.level - 1) * 0.35);

  const { onType, fluidTheme, getFluidStyles, getFluidAmbient } =
    useFluidTyping();
  const [query, setQuery] = useState(
    () => sessionStorage.getItem("tebyan_current_query") || "",
  );
  const [searchValue, setSearchValue] = useState(
    () => sessionStorage.getItem("tebyan_current_query") || "",
  );

  const latestInputRef = useRef(searchValue);
  const [isFocused, setIsFocused] = useState(false);

  const smartResponse = useMemo(() => {
    if (query.trim().length < 5) return null;
    const q = query.toLowerCase();

    // Dynamic Analysis based on keywords
    let analysis = "";
    if (q.includes("كذب") || q.includes("كاذب") || q.includes("lie")) {
      analysis =
        language === "ar"
          ? `تحليلي لموقف (الكذب) في "${query}" يشير إلى حاجة ملحة لغرس قيمة الصدق بدلاً من العقاب فقط.`
          : `My analysis of the (lying) situation in "${query}" suggests an urgent need to instill the value of honesty rather than just punishment.`;
    } else if (
      q.includes("خوف") ||
      q.includes("يخاف") ||
      q.includes("fear") ||
      q.includes("afraid")
    ) {
      analysis =
        language === "ar"
          ? `يبدو أن "${query}" يعكس حالة من القلق أو عدم الأمان، التدخل هنا يتطلب بناء جسر ثقة أولاً.`
          : `It seems "${query}" reflects a state of anxiety or insecurity; intervention here requires building a bridge of trust first.`;
    } else if (
      q.includes("غضب") ||
      q.includes("صراخ") ||
      q.includes("angry") ||
      q.includes("scream")
    ) {
      analysis =
        language === "ar"
          ? `نوبة الغضب الموصوفة في "${query}" غالباً ما تكون وسيلة تواصل غير ناضجة لمشاعر مكبوتة.`
          : `The anger episode described in "${query}" is often an immature communication method for suppressed feelings.`;
    } else if (
      q.includes("شخص") ||
      q.includes("مدير") ||
      q.includes("زميل") ||
      q.includes("person") ||
      q.includes("team")
    ) {
      analysis =
        language === "ar"
          ? `الموقف في "${query}" يحتاج موازنة بين الحزم وبين الاحتواء العاطفي لتجنب التصعيد.`
          : `The situation in "${query}" needs a balance between firmness and emotional containment to avoid escalation.`;
    } else {
      analysis =
        language === "ar"
          ? `قمت بتحليل "${query}"، وأرى أن الحل الأمثل يكمن في التعامل مع جذور المشكلة لا أعراضها فقط.`
          : `I analyzed "${query}", and I see that the optimal solution lies in dealing with the roots of the problem, not just its symptoms.`;
    }

    return analysis;
  }, [query, language]);

  const isAlreadySaved = useMemo(() => {
    if (!preferences?.savedLibrary) return false;
    return preferences.savedLibrary.some(
      (item: any) => item && item.type === "concept" && item.question === query,
    );
  }, [preferences?.savedLibrary, query]);

  const handleSaveToLibrary = () => {
    if (!user) {
      if (onShowLogin) {
        onShowLogin();
      }
      return;
    }

    if (isAlreadySaved) {
      removeFromLibrary({
        question: query,
        type: "concept",
      });
    } else {
      addToLibrary(
        {
          id: `concept-${Date.now()}`,
          question: query,
          content: smartResponse || "",
          type: "concept",
          tabId: "concept",
        },
        "concept",
      );
    }
  };

  const EPHEMERAL_WISDOMS = useMemo(
    () => [
      {
        ar: "الشك هو بداية اليقين.. لا تخف من إعادة النظر في قناعاتك اليوم.",
        en: "Doubt is the beginning of certainty.. don't fear reconsidering your convictions today.",
      },
      {
        ar: "القرار الذي تتجنبه هو غالباً القرار الذي تحتاجه.",
        en: "The decision you are avoiding is often the one you need.",
      },
      {
        ar: "ليس كل تراجع فشل، بعض التراجعات هي إعادة تموضع.",
        en: "Not every retreat is a failure; some are repositioning.",
      },
      {
        ar: "عندما تتساوى الخيارات، اختر الخيار الذي يوسع آفاقك.",
        en: "When options are equal, choose the one that expands your horizons.",
      },
      {
        ar: "الصمت في بعض الحوارات هو أقوى إجابة.",
        en: "Silence in some dialogues is the most powerful answer.",
      },
      {
        ar: "لا تقيم قراراً جيداً بناءً على نتيجة سيئة حدثت بالصدفة.",
        en: "Do not judge a good decision by a bad outcome that happened by chance.",
      },
      {
        ar: "الخوف من اتخاذ القرار أسوأ من القرار الخاطئ.",
        en: "The fear of making a decision is worse than making a wrong one.",
      },
    ],
    [],
  );

  const [ephemeralTime, setEphemeralTime] = useState({ m: 9, s: 59 });
  const [wisdomIndex, setWisdomIndex] = useState(0);

  const currentWisdom = EPHEMERAL_WISDOMS[wisdomIndex];

  const [challengeIndex, setChallengeIndex] = useState(0);
  const [insightIndexList, setInsightIndexList] = useState(0);

  useEffect(() => {
    setChallengeIndex(Math.floor(Math.random() * DAILY_CHALLENGES.length));
    setInsightIndexList(Math.floor(Math.random() * PLATFORM_INSIGHTS.length));
  }, []);

  const currentChallenge =
    DAILY_CHALLENGES[challengeIndex % DAILY_CHALLENGES.length];

  /**
   * Handle the "Surprise" button by selecting a random challenge each time
   * it is clicked. This ensures the user receives varied suggestions rather
   * than the same preset challenge on each interaction. After selecting a
   * random challenge, navigate to its path using onPathSelect.
   */
  const handleSurprise = () => {
    const randomIndex = Math.floor(Math.random() * DAILY_CHALLENGES.length);
    setChallengeIndex(randomIndex);
    const randomChallenge = DAILY_CHALLENGES[randomIndex];
    onPathSelect(randomChallenge.path as any, randomChallenge.query);
  };
  const currentInsight =
    PLATFORM_INSIGHTS[insightIndexList % PLATFORM_INSIGHTS.length];

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key && e.key.length === 1) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const [hasSearched, setHasSearched] = useState(
    () => sessionStorage.getItem("tebyan_current_has_searched") === "true",
  );
  const [depthLevel, setDepthLevel] = useState(0);
  const [showDirectTools, setShowDirectTools] = useState(false);
  const [showInspiration, setShowInspiration] = useState(false);

  useEffect(() => {
    if (!showInspiration) return;
    const updateEphemeralTimer = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      setEphemeralTime({ m: 9 - (minutes % 10), s: 59 - seconds });
      setWisdomIndex(
        Math.floor(now.getTime() / (10 * 60 * 1000)) % EPHEMERAL_WISDOMS.length,
      );
    };
    updateEphemeralTimer();
    const interval = window.setInterval(updateEphemeralTimer, 1000);
    return () => window.clearInterval(interval);
  }, [EPHEMERAL_WISDOMS.length, showInspiration]);
  const [showGateEcho, setShowGateEcho] = useState(false);
  const [selectedMood, setSelectedMood] = useState<
    "calm" | "unsure" | "urgent" | "inspired"
  >("calm");
  const [showLivingWorldPanel, setShowLivingWorldPanel] = useState(false);
  const [showDailyDock, setShowDailyDock] = useState(false);
  const [responseMode, setResponseMode] = useState<ResponseMode>("quick");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [inputSettled, setInputSettled] = useState(false);
  const [showQuestionHelper, setShowQuestionHelper] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );

  const deferredSearchValue = React.useDeferredValue(searchValue);
  const deferredQuery = React.useDeferredValue(query);
  const {
    smartSuggestion,
    isSuggestionLoading,
    setSmartSuggestion,
    cancelSuggestion,
  } = useSmartSearch(
    searchValue,
    6,
    inputSettled && !hasSearched && searchValue.trim().length >= 6,
  );
  const instantSearch = useInstantSearch(
    inputSettled && !hasSearched ? deferredSearchValue : "",
    6,
    inputSettled && !hasSearched,
  );
  const suggestion = smartSuggestion;
  const setSuggestion = setSmartSuggestion;

  const liveQuestionOptions = useMemo(() => {
    const raw = searchValue.trim();
    if (!inputSettled || hasSearched || raw.length < 3) return [];

    const normalized = raw.replace(/[؟?!.،,]+$/g, "").trim();
    const options: string[] = [];
    const push = (value: string) => {
      const clean = value.replace(/\s+/g, " " ).trim();
      if (clean && clean !== raw && !options.includes(clean)) options.push(clean);
    };

    if (smartSuggestion && smartSuggestion.length <= 180) push(smartSuggestion);

    if (language === "ar") {
      const alreadyQuestion = /^(كيف|شنو|وش|ماذا|لماذا|ليش|هل|أبي|ابي|أريد|اريد|عندي|محتار)/.test(normalized);
      if (alreadyQuestion) {
        push(`${normalized}، وما أفضل خطوة أبدأ بها؟`);
        push(`${normalized}، اشرحها لي ببساطة مع خيارات عملية`);
        push(`${normalized}، وما الأسباب المحتملة وكيف أتعامل معها؟`);
      } else {
        push(`أريد أن أفهم ${normalized} بطريقة بسيطة وواضحة`);
        push(`ما أفضل قرار أو خطوة عملية بخصوص ${normalized}؟`);
        push(`حلّل لي ${normalized} من أكثر من زاوية`);
      }
    } else {
      const alreadyQuestion = /^(how|what|why|should|can|i want|i need|i am|i'm)/i.test(normalized);
      if (alreadyQuestion) {
        push(`${normalized}, and what is the best first step?`);
        push(`${normalized}. Explain it simply with practical options.`);
        push(`${normalized}. What are the likely causes and how should I respond?`);
      } else {
        push(`Help me understand ${normalized} simply and clearly.`);
        push(`What is the best practical step regarding ${normalized}?`);
        push(`Analyze ${normalized} from different angles.`);
      }
    }

    return options.slice(0, 3);
  }, [searchValue, inputSettled, hasSearched, smartSuggestion, language]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    setInputSettled(false);
    if (searchValue.trim().length < 4) {
      setShowQuestionHelper(false);
      return;
    }
    const timer = window.setTimeout(() => setInputSettled(true), 320);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    const revealGate = () => {
      setShowGateEcho(true);
      setTimeout(() => setShowGateEcho(false), 2800);
      try {
        sessionStorage.removeItem("tebyan_gate_to_search");
      } catch (e) {}
    };
    if (sessionStorage.getItem("tebyan_gate_to_search") === "true") {
      setTimeout(revealGate, 250);
    }
    window.addEventListener("tebyan_gate_to_search", revealGate);
    return () =>
      window.removeEventListener("tebyan_gate_to_search", revealGate);
  }, []);

  const handleSearchInputChange = (value: string) => {
    setSearchValue(value);
    latestInputRef.current = value;
    setSmartSuggestion("");
    // Keep the draft isolated from the committed query. This prevents the
    // entire analysis tree from re-running on every keystroke on mobile.
    onType();
    if (hasSearched) setHasSearched(false);
    setDepthLevel(0);
    setShowDirectTools(false);
    setShowQuestionHelper(false);
  };

  const moodOptions = useMemo(
    () => [
      {
        id: "calm" as const,
        ar: "هادئ",
        en: "Calm",
        hintAr: "دع تبيان يرتبها بروية",
        hintEn: "Let Tebyan organize it calmly",
        prefixAr: "أود فهم هذا الموضوع بهدوء: ",
        prefixEn: "I want to understand this calmly: ",
      },
      {
        id: "unsure" as const,
        ar: "محتار",
        en: "Unsure",
        hintAr: "نقرب لك الخيار الأنسب",
        hintEn: "We bring the best option closer",
        prefixAr: "أنا محتار وأحتاج وضوحاً في: ",
        prefixEn: "I am unsure and need clarity on: ",
      },
      {
        id: "urgent" as const,
        ar: "مستعجل",
        en: "Urgent",
        hintAr: "نبدأ بخطوة آمنة وواضحة",
        hintEn: "We start with one safe clear step",
        prefixAr: "أحتاج خطوة سريعة وواضحة بخصوص: ",
        prefixEn: "I need one quick clear step about: ",
      },
      {
        id: "inspired" as const,
        ar: "أريد إلهاماً",
        en: "Inspired",
        hintAr: "نفتح زاوية جديدة",
        hintEn: "We open a fresh angle",
        prefixAr: "أود الحصول على زاوية إبداعية جديدة حول: ",
        prefixEn: "I want a creative new angle on: ",
      },
    ],
    [],
  );

  const activeMoodOption =
    moodOptions.find((item) => item.id === selectedMood) || moodOptions[0];

  const [isQueryExpanded, setIsQueryExpanded] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadingPhrasesAr = [
    "نرتّب الفكرة بهدوء…",
    "نبحث عن أقرب مسار لفهم ما كتبت…",
    "نوازن بين المعنى والسياق…",
    "نخفف الضجيج ونستخرج الجوهر…",
    "نجهز لك مساراً معرفياً مرتباً…",
  ];

  const loadingPhrasesEn = [
    "Dissecting strategic dimensions...",
    "Scanning potential decision paths...",
    "Filtering behavioral contradictions...",
    "Extracting hidden negotiation essence...",
    "Constructing a comprehensive roadmap...",
  ];

  function normalizeFollowUpQuery(value: any) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    let text = raw
      .replace(/^أريد\s+فهمًا?\s+واضحًا?\s+لهذا\s+الموضوع[:：]?\s*/gi, "")
      .replace(/^اريد\s+فهمًا?\s+واضحًا?\s+لهذا\s+الموضوع[:：]?\s*/gi, "")
      .replace(/^نكمل\s+السابق[؟?]?\s*/gi, "")
      .replace(/^أكمل\s+تحليل[:：]?\s*/gi, "")
      .replace(/^اكمل\s+تحليل[:：]?\s*/gi, "")
      .replace(/^Continue\s+analyzing[:：]?\s*/gi, "")
      .replace(/[\uFE0E\uFE0F]/g, "")
      .replace(/([✨⭐🌟💫])\1+/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

    const repeatedArabicPrefix =
      /^(أريد\s+فهمًا?\s+واضحًا?\s+لهذا\s+الموضوع[:：]\s*){2,}/i;
    text = text
      .replace(repeatedArabicPrefix, "أريد فهمًا واضحًا لهذا الموضوع: ")
      .trim();

    const parts = text
      .split(/(?<=[؟?!.])\s+|\s*[|،؛]\s*/g)
      .map((part) => part.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const uniqueParts: string[] = [];
    for (const part of parts) {
      const key = part
        .replace(/["'“”«»]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueParts.push(part);
      }
    }

    return (uniqueParts.length ? uniqueParts.join(" ") : text).trim();
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isThinking) {
      setLoadingPhraseIndex(0);
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % loadingPhrasesAr.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isThinking]);
  const [lastInteraction, setLastInteraction] = useState<any>(null);
  const [tomorrowRoom, setTomorrowRoom] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("tebyan_tomorrow_room") || "null");
    } catch (e) {
      return null;
    }
  });
  const proactiveInsights = useMemo(() => {
    const hour = new Date().getHours();
    let arG, enG, arSub, enSub;
    let dynamicSuggests: { ar: string; en: string }[] = [];

    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

    if (hour < 12) {
      if (lastInteraction && lastInteraction.query) {
        arG = "صباح الوعي والتجدد";
        enG = "Good morning, visionary";
        arSub = (
          <div
            className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer"
            onClick={() => setIsQueryExpanded(!isQueryExpanded)}
          >
            <span>أهلاً بك مجدداً.. توقفنا في المرة السابقة عند</span>
            <span
              className={`text-content text-[#6E5F8E] font-bold transition-all ${isQueryExpanded ? "whitespace-normal w-full text-center mt-2 break-words" : "truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom"}`}
            >
              "{normalizeFollowUpQuery(lastInteraction.query)}"
            </span>
            <span>، هل القهوة جاهزة لنكمل؟ ☕</span>
          </div>
        );
        enSub = (
          <div
            className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer"
            onClick={() => setIsQueryExpanded(!isQueryExpanded)}
          >
            <span>Welcome back.. last time we stopped at</span>
            <span
              className={`text-content text-[#6E5F8E] font-bold transition-all ${isQueryExpanded ? "whitespace-normal w-full text-center mt-2 break-words" : "truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom"}`}
            >
              "{normalizeFollowUpQuery(lastInteraction.query)}"
            </span>
            <span>, is your coffee ready to continue? ☕</span>
          </div>
        );
        dynamicSuggests = [
          {
            ar: `أكمل تحليل: ${normalizeFollowUpQuery(lastInteraction.query)}`,
            en: `Continue analyzing: ${normalizeFollowUpQuery(lastInteraction.query)}`,
          },
          {
            ar: `كيف أتعامل مع تمرد أو عناد الموظفين؟`,
            en: `How can I deal with team rebellion?`,
          },
          {
            ar: `أفضل طريقة لإيصال أخبار سيئة للإدارة؟`,
            en: `Best way to deliver bad news to management?`,
          },
          {
            ar: `تقييم مخاطر قرار توسع استراتيجي`,
            en: `Evaluate risks of a strategic expansion`,
          },
          {
            ar: `خطوات حل نزاع حاد بين شريكين`,
            en: `Steps to resolve severe conflict between partners`,
          },
          {
            ar: `كيف أعيد تحفيز فريق أصابه الإحباط؟`,
            en: `How to remotivate a frustrated team?`,
          },
          {
            ar: `التعامل مع عميل منفعل وغاضب جداً`,
            en: `Handling a very angry and frustrated client`,
          },
          {
            ar: `مراجعة خطة تراجع المبيعات المفاجئ`,
            en: `Reviewing sudden drop in sales plan`,
          },
        ].sort(() => 0.5 - Math.random());
      } else {
        arG = "صباح الوعي والتجدد";
        enG = "Morning of awareness";
        arSub = "هل نلخص لك التحولات المعرفية لهذا الصباح؟";
        enSub = "Shall we summarize the cognitive shifts this morning?";
        dynamicSuggests = [
          {
            ar: `استعراض ملخص التطورات في سوق العمل`,
            en: `Global developments summary in labor market`,
          },
          {
            ar: `بناء خريطة تحفيز لفريق المبيعات`,
            en: `Build a daily strategic roadmap for sales`,
          },
          {
            ar: `كيف أرتب أولويات المؤسسة لتخطي الأزمة؟`,
            en: `How to prioritize organizational goals during crisis?`,
          },
          {
            ar: `تحليل فجوات الأداء الإداري والمهارات`,
            en: `Analyze management performance and skill gaps`,
          },
          {
            ar: `كيف أعالج مشكلة تسرب الكفاءات الوظيفية؟`,
            en: `How to treat employee turnover?`,
          },
          {
            ar: `تحليل آليات اتخاذ القرار في أوقات التعثر المالي`,
            en: `Analyzing decision-making under financial crisis`,
          },
          {
            ar: `كيف أدير أزمة تواصل مع شريك استراتيجي؟`,
            en: `How to handle a communication crisis with partner?`,
          },
          {
            ar: `مراجعة مؤشرات الأداء الحيوية بعد الفشل`,
            en: `Reviewing vital performance indicators after failure`,
          },
        ]
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);
      }
    } else if (hour < 18) {
      if (lastInteraction && lastInteraction.query) {
        arG = "مساء التمكين والعمق";
        enG = "Good afternoon, visionary";
        arSub = (
          <div
            className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer"
            onClick={() => setIsQueryExpanded(!isQueryExpanded)}
          >
            <span>أهلاً بك مجدداً.. توقفنا في المرة السابقة عند</span>
            <span
              className={`text-content text-[#6E5F8E] font-bold transition-all ${isQueryExpanded ? "whitespace-normal w-full text-center mt-2 break-words" : "truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom"}`}
            >
              "{normalizeFollowUpQuery(lastInteraction.query)}"
            </span>
            <span>، هل نكمل الاستكشاف؟ ☕</span>
          </div>
        );
        enSub = (
          <div
            className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer"
            onClick={() => setIsQueryExpanded(!isQueryExpanded)}
          >
            <span>Welcome back.. last time we stopped at</span>
            <span
              className={`text-content text-[#6E5F8E] font-bold transition-all ${isQueryExpanded ? "whitespace-normal w-full text-center mt-2 break-words" : "truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom"}`}
            >
              "{normalizeFollowUpQuery(lastInteraction.query)}"
            </span>
            <span>, shall we continue exploring? ☕</span>
          </div>
        );
        dynamicSuggests = [
          {
            ar: `أكمل تحليل: ${normalizeFollowUpQuery(lastInteraction.query)}`,
            en: `Continue analyzing: ${normalizeFollowUpQuery(lastInteraction.query)}`,
          },
          {
            ar: `مراجعة وتصحيح مسار القرار الأخير`,
            en: `Review and correct my path about this`,
          },
          {
            ar: `طريقة احتواء استقالة مفاجئة`,
            en: `How to contain a sudden resignation`,
          },
          {
            ar: `كيف أتعامل مع ضغط تراجع الأرباح الآن؟`,
            en: `How to handle profit drop stress now?`,
          },
          {
            ar: `توليد أفكار لتسويق منتج متعثر`,
            en: `Brainstorming marketing for struggling product`,
          },
          {
            ar: `تحليل التحديات المعقدة في الاندماج`,
            en: `Analyze complex challenges in merger`,
          },
        ]
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);
      } else {
        arG = "منتصف يوم حافل";
        enG = "A busy midday";
        arSub = "هل تحتاج لنقطة ارتكاز قبل اتخاذ قرارك القادم؟";
        enSub = "Do you need a pivot point before your next decision?";
        dynamicSuggests = [
          {
            ar: `اقتراح الموازنة بين ميزانية التسويق والتشغيل`,
            en: `Suggest balancing marketing vs operations budget`,
          },
          {
            ar: `مراجعة وتصحيح مسار مشاريع اليوم`,
            en: `Review and correct my path today`,
          },
          {
            ar: `كيف أتعامل مع تمرد العمال ومطالبهم؟`,
            en: `How to deal with worker demands?`,
          },
          {
            ar: `كيف أتعامل مع ضغط تهديدات المنافس الجديد؟`,
            en: `How to handle threat of new competitor?`,
          },
          {
            ar: `فكرة إبداعية لحل مشكلة توفر الموارد`,
            en: `Creative idea to solve resources issue`,
          },
          {
            ar: `نصيحة للخروج من تعقّد الإجراءات الروتينية`,
            en: `Tip to escape complex bureaucratic procedures`,
          },
          {
            ar: `كيف أدير اجتماعاً عاصفاً بطريقة أفضل؟`,
            en: `How to run a chaotic meeting better?`,
          },
          {
            ar: `التعامل بحكمة مع تسريب أسرار العمل`,
            en: `Handling data leak with wisdom`,
          },
          {
            ar: `توليد حلول لمشروع ديون مستعصي`,
            en: `Brainstorming ideas for debt management`,
          },
        ]
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);
      }
    } else {
      if (lastInteraction && lastInteraction.query) {
        arG = "مساء التأمل والعمق";
        enG = "Evening of reflection";
        arSub = (
          <div
            className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer"
            onClick={() => setIsQueryExpanded(!isQueryExpanded)}
          >
            <span>أهلاً بك مجدداً.. توقفنا في المرة السابقة عند</span>
            <span
              className={`text-content text-[#6E5F8E] font-bold transition-all ${isQueryExpanded ? "whitespace-normal w-full text-center mt-2 break-words" : "truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom"}`}
            >
              "{normalizeFollowUpQuery(lastInteraction.query)}"
            </span>
            <span>.. هل كان يوماً مثمراً؟ 🌟</span>
          </div>
        );
        enSub = (
          <div
            className="inline-flex flex-wrap justify-center items-center gap-1 cursor-pointer"
            onClick={() => setIsQueryExpanded(!isQueryExpanded)}
          >
            <span>Welcome back.. last time we stopped at</span>
            <span
              className={`text-content text-[#6E5F8E] font-bold transition-all ${isQueryExpanded ? "whitespace-normal w-full text-center mt-2 break-words" : "truncate max-w-[200px] md:max-w-[400px] inline-block align-bottom"}`}
            >
              "{normalizeFollowUpQuery(lastInteraction.query)}"
            </span>
            <span>, how was your day? 🌟</span>
          </div>
        );
        dynamicSuggests = [
          {
            ar: `أكمل تحليل: ${normalizeFollowUpQuery(lastInteraction.query)}`,
            en: `Continue analyzing: ${normalizeFollowUpQuery(lastInteraction.query)}`,
          },
          {
            ar: `كيف أستعد لمواجهة الخصم غداً بذكاء؟`,
            en: `How to prepare for opponent tomorrow smartly?`,
          },
          {
            ar: `حوار هادئ لحل أزمة ثقة مع فريق العمل`,
            en: `Calm dialogue to resolve team trust crisis`,
          },
          {
            ar: `تقييم خسائر اليوم وكيفية التعويض`,
            en: `Reflections on today's losses and compensation`,
          },
          {
            ar: `خطوات تأسيس بيئة عمل أكثر شفافية`,
            en: `Steps to build a more transparent work environment`,
          },
          {
            ar: `التغلب على التفكير المفرط بالخسارة`,
            en: `Overcoming overthinking of business loss`,
          },
        ]
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);
      } else {
        arG = "مساء التأمل والعمق";
        enG = "Evening of reflection";
        arSub = "ما الذي يشغل حيز وعيك في نهاية هذا اليوم؟";
        enSub = "What occupies your consciousness at the end of this day?";
        dynamicSuggests = [
          {
            ar: `تأملات استراتيجية في مخرجات الأزمة السابقة`,
            en: `Strategic reflections on today's crisis output`,
          },
          {
            ar: `التخطيط الاستباقي للأسوأ غداً`,
            en: `Proactive planning for the worst tomorrow`,
          },
          {
            ar: `تقييم الاستجابة למوقف تمرد الموظفين اليوم`,
            en: `Evaluate response to employee rebellion`,
          },
          {
            ar: `حوار منهجي لترتيب إغلاق الشراكة`,
            en: `Systematic dialogue for partnership closure`,
          },
          {
            ar: `استعراض أسباب رفض المشروع وسبل التعديل`,
            en: `Summarizing project rejection and pivoting`,
          },
          {
            ar: `تحليل استراتيجي لمنافس شرس ظهر اليوم`,
            en: `Strategic analysis of a new competitor seen today`,
          },
          {
            ar: `مراجعة أخلاقيات القرار في بيئة تسريح العمال`,
            en: `Review decision ethics in layoff environment`,
          },
          {
            ar: `كيفية بناء إرث مهني والنجاة من الإفلاس`,
            en: `How to survive bankruptcy and build a legacy`,
          },
        ]
          .sort(() => 0.5 - Math.random())
          .slice(0, 6);
      }
    }
    return { arG, enG, arSub, enSub, dynamicSuggests };
  }, [lastInteraction, isQueryExpanded]);

  // React to initialQuery prop
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      sessionStorage.setItem("tebyan_current_query", initialQuery);

      // Restore search results if they exist, rather than re-computing
      const wasSearched =
        sessionStorage.getItem("tebyan_current_has_searched") === "true";
      if (wasSearched) {
        setHasSearched(true);
      } else {
        handleSubmit(undefined, initialQuery);
      }

      if (onQueryUsed) onQueryUsed();
    }
  }, [initialQuery, onQueryUsed]);

  const [styleConfirmed, setStyleConfirmed] = useState(
    () => localStorage.getItem("tebyan_style_confirmed") === "true",
  );
  const [showStylePicker, setShowStylePicker] = useState(false);

  const confirmStyle = (style: "practical" | "analytical" | "simulation") => {
    setGlobalUserStyle(style);
    setStyleConfirmed(true);
    localStorage.setItem("tebyan_style_confirmed", "true");
    setShowStylePicker(false);
    logEvent("feature_use", language, undefined, { confirmedStyle: style });
  };

  const [selectionFeedback, setSelectionFeedback] = useState("");
  const [sageProgress, setSageProgress] = useState({
    points: 0,
    level: "seeker",
    badges: [] as string[],
    stats: { wisdom: 0, dialogue: 0, patience: 0 },
  });

  const levels = [
    { id: "seeker", ar: "باحث", en: "Seeker", min: 0 },
    { id: "awakened", ar: "متيقظ", en: "Awakened", min: 100 },
    { id: "enlightened", ar: "مستنير", en: "Enlightened", min: 300 },
    { id: "sage", ar: "حكيم", en: "Sage", min: 600 },
    { id: "transcendent", ar: "متسامي", en: "Transcendent", min: 1000 },
  ];

  const badges = [
    {
      id: "wisdom",
      icon: BrainCircuit,
      ar: "وسام الحكمة",
      en: "Wisdom Badge",
      desc: {
        ar: "تُمنح لتحليل المواقف بعمق قبل الرد",
        en: "Awarded for deep analysis before acting",
      },
    },
    {
      id: "dialogue",
      icon: MessageCircleQuestion,
      ar: "وسام الحوار",
      en: "Dialogue Badge",
      desc: {
        ar: "تُمنح للتدريب على الحوار المتزن",
        en: "Awarded for practicing balanced dialogue",
      },
    },
    {
      id: "patience",
      icon: Sparkles,
      ar: "وسام الصبر",
      en: "Patience Badge",
      desc: {
        ar: "تُمنح للمتابعة والوصول لنتائج هادئة",
        en: "Awarded for following up and reaching calm results",
      },
    },
  ];

  useEffect(() => {
    // Memory Layer & Gamification: Load from localStorage
    const savedMemory = localStorage.getItem("tebyan_memory");
    const savedProgress = localStorage.getItem("tebyan_sage_progress");

    if (savedProgress) {
      setSageProgress(JSON.parse(savedProgress));
    }

    if (savedMemory) {
      const data = JSON.parse(savedMemory);
      const currentUid = user?.uid || null;

      // Only load memory if it belongs to the current user state
      if (data.uid === currentUid) {
        const normalizedQuery = normalizeFollowUpQuery(data.query);
        const normalizedData = {
          ...data,
          query: normalizedQuery || data.query,
        };
        if (normalizedQuery && normalizedQuery !== data.query) {
          localStorage.setItem("tebyan_memory", JSON.stringify(normalizedData));
        }
        setLastInteraction(normalizedData);
        if (user) {
          const lastTime = new Date(data.timestamp).getTime();
          const now = new Date().getTime();
          if (now - lastTime > 3600000 && !data.followedUp) {
            setShowFollowUp(true);
          } else {
            setShowFollowUp(false);
          }
        } else {
          setShowFollowUp(false);
        }
      } else {
        setLastInteraction(null);
        setShowFollowUp(false);
      }
    }
  }, [user]);

  const updateSageProgress = (
    pointsToAdd: number,
    statKey?: keyof typeof sageProgress.stats,
  ) => {
    setSageProgress((prev) => {
      const newPoints = prev.points + pointsToAdd;
      const newStats = { ...prev.stats };
      if (statKey) newStats[statKey] += 1;

      // Check for level up
      const currentLevelObj =
        [...levels].reverse().find((l) => newPoints >= l.min) || levels[0];

      // Check for new badges
      const newBadges = [...prev.badges];
      if (newStats.wisdom >= 3 && !newBadges.includes("wisdom"))
        newBadges.push("wisdom");
      if (newStats.dialogue >= 3 && !newBadges.includes("dialogue"))
        newBadges.push("dialogue");
      if (newStats.patience >= 2 && !newBadges.includes("patience"))
        newBadges.push("patience");

      const next = {
        points: newPoints,
        level: currentLevelObj.id,
        badges: newBadges,
        stats: newStats,
      };

      localStorage.setItem("tebyan_sage_progress", JSON.stringify(next));
      return next;
    });
  };

  const handleFollowUpFeedback = (status: "success" | "fail") => {
    if (lastInteraction) {
      const updated = {
        ...lastInteraction,
        followedUp: true,
        feedback: status,
      };
      localStorage.setItem("tebyan_memory", JSON.stringify(updated));
      setLastInteraction(updated);

      if (status === "success") {
        updateSageProgress(20, "patience");
      }
    }
    setShowFollowUp(false);
  };

  const clearSearch = () => {
    setHasSearched(false);
    setIsThinking(false);
    setSearchValue("");
    setQuery("");
    sessionStorage.setItem("tebyan_current_query", "");
    sessionStorage.setItem("tebyan_current_has_searched", "false");
    setSmartSuggestion("");
    setDepthLevel(0);
    setResponseMode("quick");
    setShowQuestionHelper(false);
    setShowDirectTools(false);
  };

  useEffect(() => {
    if (searchValue.trim() === "") {
      setHasSearched(false);
      setIsThinking(false);
      setQuery("");
      setSmartSuggestion("");
      setDepthLevel(0);
    }
  }, [searchValue]);

  const onPathSelect = (id: any, query: string) => {
    console.log("[SmartGateway] onPathSelect called:", id, query);
    // Usage Tracking for personalization
    const usageStats = JSON.parse(
      localStorage.getItem("tebyan_usage_stats") || "{}",
    );
    usageStats[id] = (usageStats[id] || 0) + 1;
    localStorage.setItem("tebyan_usage_stats", JSON.stringify(usageStats));

    // Memory
    const cleanMemoryQuery = normalizeFollowUpQuery(query);
    const memory = {
      query: cleanMemoryQuery || query,
      path: id,
      timestamp: new Date().toISOString(),
      followedUp: false,
      uid: user?.uid || null,
    };
    localStorage.setItem("tebyan_memory", JSON.stringify(memory));

    // Gamification rewards based on behavior
    if (id === "council" || id === "concepts") updateSageProgress(15, "wisdom");
    else if (id === "simulation" || id === "lab")
      updateSageProgress(10, "dialogue");
    else updateSageProgress(5);

    handleTabChange(id, query);
  };

  const [errorMsg, setErrorMsg] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    if (hasSearched && !isThinking) {
      setTimeout(() => {
        const el = isMobileViewport
          ? document.getElementById("mobile-results")
          : document.getElementById("desktop-results");
        el?.scrollIntoView({ behavior: "auto", block: "nearest" });
      }, 100);
    }
  }, [hasSearched, isThinking, isMobileViewport]);

  const [emotion, setEmotion] = useState<"neutral" | "stress" | "creative">(
    "neutral",
  );

  useEffect(() => {
    if (emotion === "stress") {
      document.body.classList.add("emotion-stress");
      document.body.classList.remove("emotion-creative");
    } else if (emotion === "creative") {
      document.body.classList.add("emotion-creative");
      document.body.classList.remove("emotion-stress");
    } else {
      document.body.classList.remove("emotion-stress", "emotion-creative");
    }
    return () => {
      document.body.classList.remove("emotion-stress", "emotion-creative");
    };
  }, [emotion]);

  useEffect(() => {
    const history = localStorage.getItem("tebyan_search_history");
    if (history) setSearchHistory(JSON.parse(history));
  }, []);

  const addToHistory = (q: string) => {
    const newHistory = [q, ...searchHistory.filter((h) => h !== q)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem("tebyan_search_history", JSON.stringify(newHistory));
  };

  const [showResumePrompt, setShowResumePrompt] = useState(() => {
    const lastQuery = sessionStorage.getItem("tebyan_current_query");
    const lastHasSearched = sessionStorage.getItem(
      "tebyan_current_has_searched",
    );
    return !!lastQuery && lastHasSearched !== "true";
  });

  const [insightIndex, setInsightIndex] = useState(0);

  const getIntentAndEmotion = (q: string) => {
    const lowQ = q.toLowerCase();

    // Urgent / Risk / Emergency / Defense
    const urgentWords = [
      "عاجل",
      "خطر",
      "مصيبة",
      "مشكلة كبيرة",
      "كارثة",
      "طوارئ",
      "انقذني",
      "شسوي",
      "الحقوني",
      "طاحت",
      "urgent",
      "danger",
      "crisis",
      "emergency",
      "help",
      "save me",
    ];
    if (urgentWords.some((w) => lowQ.includes(w)))
      return { type: "urgent", intent: "rescue", emotion: "panic" };

    // Emotional / Psychological Conflict / Needs Safety
    const emotionalWords = [
      "كذب",
      "يخفي",
      "خوف",
      "قلق",
      "توتر",
      "مكتئب",
      "حزين",
      "ضايق خلقي",
      "مهموم",
      "مخنوق",
      "lie",
      "hide",
      "fear",
      "anxiety",
      "stress",
      "depressed",
      "sad",
    ];
    if (emotionalWords.some((w) => lowQ.includes(w)))
      return { type: "emotional", intent: "safety", emotion: "vulnerability" };

    // Behavioral / Aggression / Resistance / Expression
    const behavioralWords = [
      "غضب",
      "يصارخ",
      "عناد",
      "يرفض",
      "تحدي",
      "يضرب",
      "يعاند",
      "ما يسمع",
      "نجرة",
      "يقهر",
      "angry",
      "scream",
      "stubborn",
      "refuse",
      "challenge",
      "hit",
      "frustrated",
    ];
    if (behavioralWords.some((w) => lowQ.includes(w)))
      return {
        type: "behavioral",
        intent: "expression",
        emotion: "frustration",
      };

    // Strategic / Planning / Decision / Development
    const strategicWords = [
      "خطة",
      "هدف",
      "مشروع",
      "مستقبل",
      "قرار",
      "طموح",
      "plan",
      "goal",
      "project",
      "future",
      "decision",
      "ambition",
    ];
    if (strategicWords.some((w) => lowQ.includes(w)))
      return { type: "strategic", intent: "development", emotion: "focus" };

    // Understanding / Explanation / Logical / Curiosity
    const understandingWords = [
      "ليش",
      "شلون",
      "كيف",
      "مفاهيم",
      "شرح",
      "فهم",
      "why",
      "how",
      "concept",
      "explain",
      "understand",
    ];
    if (understandingWords.some((w) => lowQ.includes(w)))
      return {
        type: "explanation",
        intent: "understanding",
        emotion: "curiosity",
      };

    return { type: "mixed_general", intent: "observation", emotion: "neutral" };
  };

  const getDynamicInsights = () => {
    const { emotion, type, intent } = getIntentAndEmotion(query);
    const base =
      language === "ar"
        ? [
            "كل سلوك هو رسالة...دعنا نفهم ما وراء السطح.",
            "الهدوء والوعي الإدراكي هما أقوى أدوات الإدارة.",
            "الحلول الاستراتيجية تُبنى بالتدرج والملاحظة.",
            "فهم السياق يسبق اتخاذ القرار دائماً.",
            "الرؤية الشاملة تفتح أبواب الحلول المبتكرة.",
          ]
        : [
            "Every behavior is a message...let's understand what's beneath.",
            "Calmness and awareness are the strongest management tools.",
            "Strategic solutions are built gradually.",
            "Understanding context always precedes decision making.",
            "A holistic view opens the door to innovative solutions.",
          ];

    if (type === "urgent") {
      return language === "ar"
        ? [
            "في المواقف العاجلة، الخطوة الأولى هي التهدئة",
            "تجنب القرارات الانفعالية أثناء الأزمات الحادة",
            ...base,
          ]
        : [
            "In urgent situations, the first step is de-escalation",
            "Avoid impulsive decisions during acute crises",
            ...base,
          ];
    }
    if (type === "behavioral" || emotion === "frustration") {
      return language === "ar"
        ? [
            "المقاومة غالباً ما تكون وسيلة تواصل غير ناضجة",
            "افصل بين السلوك وبين الشخص نفسه",
            ...base,
          ]
        : [
            "Resistance is often an immature form of communication",
            "Separate the behavior from the person",
            ...base,
          ];
    }
    if (
      type === "emotional" ||
      emotion === "fear" ||
      emotion === "vulnerability"
    ) {
      return language === "ar"
        ? [
            "الصدق والمصارحة تُبنى بالثقة لا بالخوف",
            "الاحتواء العاطفي هو المفتاح الأول في هذه الحالة",
            ...base,
          ]
        : [
            "Honesty is built on trust, not fear",
            "Emotional containment is the first key in this state",
            ...base,
          ];
    }
    if (emotion === "frustration" || intent === "expression") {
      return language === "ar"
        ? [
            "خلف كل صرخة حاجة لم تُلبَ",
            "هدوؤك هو قدوته الأولى في استرجاع السيطرة على النفس",
            ...base,
          ]
        : [
            "Behind every scream is an unmet need",
            "Your calm is their first example of regaining self-control",
            ...base,
          ];
    }
    if (intent === "identity") {
      return language === "ar"
        ? [
            "العناد غالباً ما يكون صرخة لاستقلال الشخصية",
            "امنحه خيارات بدلاً من الأوامر المباشرة",
            ...base,
          ]
        : [
            "Stubbornness is often a cry for independent personality",
            "Give them choices instead of direct orders",
            ...base,
          ];
    }
    return base;
  };

  const dynamicInsights = useMemo(getDynamicInsights, [query, language]);

  useEffect(() => {
    let interval: any;
    if (isThinking) {
      interval = setInterval(() => {
        setInsightIndex((prev) => (prev + 1) % dynamicInsights.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isThinking, dynamicInsights]);

  const handleSubmit = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const rawQuery = overrideQuery ?? searchValue ?? query;
    const moodPrefix =
      language === "ar" ? activeMoodOption.prefixAr : activeMoodOption.prefixEn;
    const activeQuery =
      !overrideQuery &&
      selectedMood !== "calm" &&
      rawQuery.trim() &&
      !rawQuery.startsWith(moodPrefix)
        ? `${moodPrefix}${rawQuery}`
        : rawQuery;
    console.log("[SmartGateway] Search triggered. Query:", activeQuery);

    if (!activeQuery.trim()) {
      console.log("[SmartGateway] Search blocked: active query is empty");
      setErrorMsg(
        language === "ar"
          ? "لم تكتمل الفكرة بعد، أضف سطرًا واحدًا فقط"
          : "The idea is not complete yet. Add one short line.",
      );
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    if (activeQuery !== query) setQuery(activeQuery);
    if (activeQuery !== searchValue) setSearchValue(activeQuery);
    latestInputRef.current = activeQuery;
    cancelSuggestion();
    setShowResumePrompt(false);

    // Intercept fluid navigation commands
    const qLower = activeQuery.toLowerCase();
    const navMatch = tabs?.find(
      (t) =>
        (qLower.includes("افتح") && qLower.includes(t.label.toLowerCase())) ||
        (qLower.includes("open") && qLower.includes(t.label.toLowerCase())),
    );

    if (navMatch) {
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        handleTabChange(navMatch.id as any);
      }, 100); // ultra fast transition effect
      return;
    }

    // Paint the useful result first. Analytics, storage, and emotion detection
    // are deliberately moved out of the tap path so the button responds now.
    setIsThinking(false);
    setHasSearched(true);
    setShowDirectTools(false);
    setSelectionFeedback("");

    const runAfterPaint = (task: () => void) => {
      window.requestAnimationFrame(() => window.setTimeout(task, 0));
    };

    runAfterPaint(() => {
      try {
        sessionStorage.setItem("tebyan_current_query", activeQuery);
        sessionStorage.setItem("tebyan_current_has_searched", "true");
      } catch (e) {}
      logEvent("search", language, activeQuery);
      addToHistory(activeQuery);
      try {
        localStorage.setItem(
          "tebyan_last_session",
          JSON.stringify({
            query: activeQuery,
            tool: "discover",
            toolLabel: language === "ar" ? "البحث الذكي" : "Smart search",
            at: new Date().toISOString(),
          }),
        );
        const cacheKey = `tebyan_cache_v1_${activeQuery.trim().toLowerCase()}`;
        localStorage.setItem(cacheKey, "true");
      } catch (e) {}

      import("../services/gemini")
        .then(({ detectEmotion }) => detectEmotion(activeQuery))
        .then((emo) => setEmotion(emo))
        .catch(() => {});
    });
  };

  const handlePathSelect = (id: string, q: string) => {
    console.log(
      "[SmartGateway] Path selected triggered:",
      id,
      "with query:",
      q,
    );

    // Save usage stats for ranking boost
    try {
      const stats = JSON.parse(
        localStorage.getItem("tebyan_usage_stats") || "{}",
      );
      stats[id] = (stats[id] || 0) + 1;
      localStorage.setItem("tebyan_usage_stats", JSON.stringify(stats));
    } catch (e) {
      console.warn("Failed to save usage stats", e);
    }

    // Analytics: Log path selection
    logEvent("path_select", language, q, { pathId: id });

    setSelectionFeedback("");
    setSuggestion("");

    try {
      localStorage.setItem(
        "tebyan_last_session",
        JSON.stringify({
          query: q,
          tool: id,
          toolLabel: id,
          at: new Date().toISOString(),
        }),
      );
    } catch (e) {}
    onPathSelect(id, q);
  };

  const currentLevelObj = useMemo(() => {
    return (
      [...levels].reverse().find((l) => sageProgress.points >= l.min) ||
      levels[0]
    );
  }, [sageProgress.points]);

  const followUpPrompts = useMemo(() => {
    if (!query || query.length < 5) return [];
    const q = query.toLowerCase();
    if (q.includes("كذب") || q.includes("lie"))
      return [
        { ar: "كيف أبني الثقة مجدداً؟", en: "How to rebuild trust?" },
        {
          ar: "ما هي دوافع الكذب في هذا العمر؟",
          en: "Why do they lie at this age?",
        },
      ];
    if (q.includes("غضب") || q.includes("angry"))
      return [
        { ar: "تمارين هدوء فورية", en: "Immediate calming exercises" },
        { ar: "خطوات احتواء الموقف", en: "Steps to contain the situation" },
      ];
    return [
      { ar: "أقترح لي خطة عمل تفصيلية", en: "Suggest a detailed action plan" },
      { ar: "ما هي المخاطر المحتملة؟", en: "What are the potential risks?" },
    ];
  }, [query, language]);

  const ALL_CHIP_SUGGESTIONS = [
    {
      ar: "مراهق قريب مني يتصرف بعناد، شلون أتعامل بهدوء؟",
      en: "A teenager close to me is acting stubborn, how should I handle it calmly?",
    },
    {
      ar: "شخص صغير بالعمر يتكرر منه سلوك مقلق، ما التصرف الأنسب؟",
      en: "A young person keeps repeating a worrying behavior, what is the best response?",
    },
    {
      ar: "عندي تحدي تربوي في البيت وأحتاج طريقة واضحة",
      en: "I have a family guidance challenge and need a clear approach",
    },
    {
      ar: "رفيجي بالدوام وايد يذم فيني قفاي، شلون أتصرف؟",
      en: "My friend at work backbites me, how to behave?",
    },
    {
      ar: "مديري بالدوام وايد يضغطني وشايل علي، شالحل؟",
      en: "My boss pressures me and has a grudge, what is the solution?",
    },
    {
      ar: "شخص قريب مني يكذب كثيراً، شلون أبني الثقة؟",
      en: "Someone close to me lies often, how can I rebuild trust?",
    },
    {
      ar: "طالب يرفض المدرسة ويختلق الأعذار، ما أفضل تصرف؟",
      en: "A student refuses school and makes excuses, what is the best response?",
    },
    {
      ar: "استخدام الألعاب الإلكترونية صار زائد، شلون أرتبه؟",
      en: "Gaming use has become excessive, how can I organize it?",
    },
    {
      ar: "كيف أغرس الصدق والأمانة بطريقة ذكية وهادئة؟",
      en: "How can I instill honesty and integrity in a smart calm way?",
    },
    {
      ar: "توسعة النشاط التجاري المتعثر",
      en: "Expanding a struggling business",
    },
    {
      ar: "إقناع المستثمرين بتمويل المشروع",
      en: "Persuading investors to fund the project",
    },
    {
      ar: "إدارة أزمة ثقة حادة داخل الفريق",
      en: "Managing a severe trust crisis within the team",
    },
    {
      ar: "الموازنة بين العقل والعاطفة في القرار",
      en: "Balancing mind and emotion in decisions",
    },
    {
      ar: "ابتكار نموذج عمل تنافسي وجريء",
      en: "Innovating a competitive and bold business model",
    },
    {
      ar: "استراتيجيات التفاوض مع طرف عنيد",
      en: "Negotiation strategies with a stubborn party",
    },
    {
      ar: "تحليل المنافسين وتوقع خطواتهم القادمة",
      en: "Analyzing competitors and predicting their next moves",
    },
    {
      ar: "قرار مصيري بشأن تغيير المسار المهني",
      en: "Critical decision about career path change",
    },
  ];

  const chipSuggestions = useMemo(() => {
    const history = JSON.parse(
      localStorage.getItem("tebyan_search_history") || "[]",
    );
    const filtered = ALL_CHIP_SUGGESTIONS.filter(
      (s) => !history.includes(language === "ar" ? s.ar : s.en),
    );
    return [...(filtered.length > 0 ? filtered : ALL_CHIP_SUGGESTIONS)]
      .sort(() => 0.5 - Math.random())
      .slice(0, 7);
  }, [language]);

  const allPossibleQueries = useMemo(() => {
    const list = [
      ...ALL_CHIP_SUGGESTIONS.map((s) => (language === "ar" ? s.ar : s.en)),
      ...DAILY_CHALLENGES.map((c) =>
        language === "ar" ? c.titleAr : c.titleEn,
      ),
      ...proactiveInsights.dynamicSuggests.map((s) =>
        language === "ar" ? s.ar : s.en,
      ),
      ...searchHistory,
    ];
    return Array.from(new Set(list)).filter(
      (s) => typeof s === "string" && s.length > 0,
    );
  }, [language, proactiveInsights.dynamicSuggests, searchHistory]);

  const questionClarity = useMemo(() => {
    const text = searchValue.trim();
    if (text.length < 3) return null;
    let score = Math.min(100, 28 + Math.floor(text.length * 1.7));
    const hasContext =
      /(عمر|متى|وين|لماذا|ليش|سبب|مدرس|بيت|دوام|سنة|شهر|age|when|where|why|school|work)/i.test(
        text,
      );
    const hasGoal =
      /(أريد|ابي|كيف|حل|قرار|احسم|افهم|اشرح|what|how|decide|understand)/i.test(
        text,
      );
    if (hasContext) score += 18;
    if (hasGoal) score += 14;
    score = Math.max(8, Math.min(100, score));
    const level =
      score < 45
        ? language === "ar"
          ? "منخفض"
          : "low"
        : score < 75
          ? language === "ar"
            ? "متوسط"
            : "medium"
          : language === "ar"
            ? "عالٍ"
            : "high";
    const hint = hasContext
      ? language === "ar"
        ? "سؤالك واضح. إضافة الهدف النهائي قد ترفع جودة المسار."
        : "Your question is clear. Adding the desired outcome can improve the path."
      : language === "ar"
        ? "السؤال واضح جزئياً. أضف العمر أو السياق أو متى يحدث الموقف."
        : "Partly clear. Add age, context, or when this happens.";
    return { score, level, hint };
  }, [searchValue, language]);

  const cognitiveMood = useMemo(
    () => getCognitiveMood(searchValue || query, language),
    [searchValue, query, language],
  );

  const clarityRingStyle = questionClarity
    ? ({
        "--clarity-glow": cognitiveMood.glow,
        "--cognitive-accent": cognitiveMood.accent,
        "--cognitive-soft": cognitiveMood.soft,
      } as React.CSSProperties)
    : ({
        "--clarity-glow": cognitiveMood.glow,
        "--cognitive-accent": cognitiveMood.accent,
        "--cognitive-soft": cognitiveMood.soft,
      } as React.CSSProperties);

  const suggestions = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return [];
    const ranked: any[] = [];
    const { intent, emotion } = getIntentAndEmotion(deferredQuery);
    let usageStats: Record<string, number> = {};
    try {
      usageStats = JSON.parse(
        localStorage.getItem("tebyan_usage_stats") || "{}",
      );
    } catch (e) {}

    console.log("[SmartGateway] STARTING ANALYSIS FOR:", q, {
      intent,
      emotion,
    });

    // Scoring helpers with dynamic reasoning and categorization
    const addPath = (
      id: string,
      category: string,
      labelAr: string,
      labelEn: string,
      icon: any,
      descAr: string,
      descEn: string,
      reasonAr: string,
      reasonEn: string,
      score: number,
    ) => {
      // Avoid duplicates
      if (ranked.some((r) => r.id === id)) return;

      // Personalization booster
      const localUsage = usageStats[id] || 0;
      const boost = localUsage * 0.7; // Stronger local weight

      // Style Synergy Booster
      let styleBoost = 0;

      let finalScore = score + boost + styleBoost;

      // Intent/Emotion fallback boosts (gives an edge when keywords fail)
      if (intent === "defense" || emotion === "fear") {
        if (id === "council") finalScore += 3;
        if (id === "story") finalScore += 2;
        if (id === "qawlfasl") finalScore += 1;
      }
      if (intent === "expression" || emotion === "frustration") {
        if (id === "simulation") finalScore += 3;
        if (id === "qawlfasl") finalScore += 2.5;
        if (id === "council") finalScore += 1;
      }
      if (intent === "development" || emotion === "focus") {
        if (id === "roadmap") finalScore += 4;
        if (id === "quizzes") finalScore += 3;
      }
      if (intent === "understanding" || emotion === "curiosity") {
        if (id === "oracle") finalScore += 4;
        if (id === "concepts") finalScore += 3;
        if (id === "mindmap") finalScore += 2;
      }

      // Dynamic reasoning adjustment based on style/keywords
      let refinedReasonAr = reasonAr;
      let refinedReasonEn = reasonEn;

      if (id === "council") {
        refinedReasonAr = getGenderWord(
          userGender,
          "لأنك تفضل عادةً الفهم العميق المتأني لكل زوايا الموقف",
          "لأنكِ تفضلين عادةً الفهم العميق المتأني لكل زوايا الموقف",
          "لأنك تفضل عادةً الفهم العميق المتأني لكل زوايا الموقف",
        );
        refinedReasonEn =
          "Because you usually prefer a deep, careful understanding of all angles";
      }

      ranked.push({
        id,
        category,
        label: language === "ar" ? labelAr : labelEn,
        icon,
        desc: language === "ar" ? descAr : descEn,
        reason: language === "ar" ? refinedReasonAr : refinedReasonEn,
        weight: finalScore,
        isPersonalized: localUsage >= 3 || styleBoost > 0,
      });
    };

    // --- DIMENSION MAPPING ---

    // 1. Action (Solution Bank)
    const actionMatch =
      !q ||
      q.includes("حل") ||
      q.includes("سؤال") ||
      q.includes("كيف") ||
      q.includes("عاجل") ||
      q.includes("طوارئ") ||
      q.includes("قرار") ||
      q.includes("solve");
    addPath(
      "qawlfasl",
      "action",
      "قول فصل",
      "Solution Bank",
      Zap,
      "حلول وقرارات مباشرة",
      "Direct certified answer",
      "لأن الحالة تتطلب توجيهاً عملياً وقراراً واضحاً في هذه اللحظة",
      "Because you seek direct practical guidance",
      actionMatch ? 10 : 2,
    );

    // 2. Analysis (Expert Council)
    const analysisMatch =
      !q ||
      q.includes("لماذا") ||
      q.includes("سبب") ||
      q.includes("تحليل") ||
      q.includes("موقف") ||
      q.includes("حالة") ||
      q.includes("سياق") ||
      q.includes("why") ||
      q.includes("reason");
    addPath(
      "strategicarena",
      "analysis",
      "الميدان الاستراتيجي",
      "Strategic Arena",
      BrainCircuit,
      "تحليل ومحاكاة استراتيجية",
      "Analysis and simulation",
      "ميدان متكامل لتحليل المواقف، المحاكاة، واستعراض الأبعاد الزمنية للقرارات",
      "Integrated arena for situation analysis, simulation, and temporal dimensions",
      analysisMatch ? 12 : 3,
    );

    // 2b. Predictive Radar
    const analyticsMatch =
      !q ||
      q.includes("نبض") ||
      q.includes("رادار") ||
      q.includes("توقع") ||
      q.includes("سلوك") ||
      q.includes("متابعة") ||
      q.includes("تحليل") ||
      q.includes("بيانات") ||
      q.includes("pulse") ||
      q.includes("analytics") ||
      q.includes("radar") ||
      q.includes("analysis") ||
      q.includes("data");
    addPath(
      "knowledgecenter",
      "analysis",
      "مركز المعرفة",
      "Knowledge Center",
      Activity,
      "الرادار والنتائج",
      "Predictive Radar & Analytics",
      "لقياس مدى التحسن في النتائج والتنبؤ بالسلوكيات",
      "To measure performance and behavior trends",
      analyticsMatch ? 11 : 3,
    );

    // 3. Simulation (Simulator)
    const simMatch =
      !q ||
      q.includes("تدريب") ||
      q.includes("تجربة") ||
      q.includes("حوار") ||
      q.includes("مواجهة") ||
      q.includes("كذب") ||
      q.includes("عناد") ||
      q.includes("angry") ||
      q.includes("train") ||
      q.includes("practice") ||
      q.includes("تقمص") ||
      q.includes("دور") ||
      q.includes("roleplay");
    addPath(
      "strategicarena",
      "simulation",
      "الميدان الاستراتيجي",
      "Strategic Arena",
      Gamepad2,
      "تدريب واقعي ومحاكاة",
      "Realistic training and simulation",
      "لأن المواجهة تحتاج تدريب ومحاكاة لضمان أفضل نتيجة",
      "Because confrontation needs simulation and practice",
      simMatch ? 11 : 3,
    );

    // 4. Roadmap (Success Plan)
    const roadMatch =
      !q ||
      q.includes("خطة") ||
      q.includes("طريق") ||
      q.includes("خطوات") ||
      q.includes("برمجة") ||
      q.includes("عناد") ||
      q.includes("plan") ||
      q.includes("steps") ||
      q.includes("coding") ||
      q.includes("program");
    addPath(
      "knowledgecenter",
      "roadmap",
      "مركز المعرفة",
      "Knowledge Center",
      Route,
      "خارطة طريق ونتائج",
      "Roadmap and metrics",
      "لأن الموقف يحتاج خطة زمنية واضحة ومتابعة دقيقة للنتائج",
      "For clear timelines and performance metrics",
      roadMatch ? 11 : 3,
    );

    // 6. Innovation (Omni Counselor <button Concepts)
    const innovMatch =
      !q ||
      q.includes("فكرة") ||
      q.includes("جديد") ||
      q.includes("ابتكار") ||
      q.includes("تغيير") ||
      q.includes("استراتيجية") ||
      q.includes("innovation") ||
      q.includes("creative") ||
      q.includes("سؤال") ||
      q.includes("مشورة");

    // 5. Narrative (Storyteller)
    const storyMatch =
      !q ||
      q.includes("قصة") ||
      q.includes("شخص") ||
      q.includes("حكاية") ||
      q.includes("تبسيط") ||
      q.includes("كذب") ||
      q.includes("story") ||
      q.includes("tell");

    addPath(
      "oracle",
      "innovation",
      "المستشار الكلي",
      "Omni Counselor",
      Command,
      "حوار استراتيجي شامل",
      "Comprehensive cognitive dialogue",
      "للحصول على مشورة حكيمة تدمج بين علوم السلوك والاستراتيجية",
      "For wise advice integrating behavior and strategy",
      innovMatch ? 8.5 : 1.5,
    );
    addPath(
      "creativelab",
      "innovation",
      "المختبر الإبداعي",
      "Creative Lab",
      Sparkles,
      "هندسة الابتكار والأفكار",
      "Idea & Innovation Engineering",
      getGenderWord(
        userGender,
        "لأنك تحتاج إلى تفكيك الموقف وابتكار وسائل جديدة للحل",
        "لأنكِ تحتاجين إلى تفكيك الموقف وابتكار وسائل جديدة للحل",
        "لأنك تحتاج إلى تفكيك الموقف وابتكار وسائل جديدة للحل",
      ),
      "To deconstruct the situation and innovate new solutions",
      innovMatch ? 8.5 : 2,
    );
    addPath(
      "creativelab",
      "innovation",
      "المختبر الإبداعي",
      "Creative Lab",
      Zap,
      "أدوات التصميم والحلول",
      "Strategic design tools",
      "لتحليل الأدوات المتاحة للموقف وابتكار وسائل جديدة للحل",
      "To analyze available tools and innovate new ones",
      innovMatch ? 6 : 1,
    );

    // 7. Visualization/Thinking Tools
    const thinkMatch =
      !q ||
      q.includes("رسم") ||
      q.includes("توضيح") ||
      q.includes("بصري") ||
      q.includes("هيكلة") ||
      q.includes("think") ||
      q.includes("map");
    addPath(
      "knowledgecenter",
      "thinking",
      "مركز المعرفة",
      "Knowledge Center",
      Network,
      "هيكلة بصرية للأفكار",
      "Visual thought structure",
      "لتنظيم شتات الأفكار واستكشاف الروابط المعرفية",
      "To organize thoughts and explore knowledge connections",
      thinkMatch ? 8 : 2,
    );
    addPath(
      "knowledgecenter",
      "thinking",
      "مركز المعرفة",
      "Knowledge Center",
      Network,
      "روابط الأفكار المكتشفة",
      "Neural knowledge structure",
      "لاستكشاف كيف تترابط أبحاثك وأفكارك في شبكة واحدة",
      "To explore how your research and ideas interconnect",
      thinkMatch ? 8 : 2,
    );
    addPath(
      "strategicarena",
      "analysis",
      "الميدان الاستراتيجي",
      "Strategic Arena",
      Hourglass,
      "تأمل وحوار عبر الزمن",
      "Journey through time",
      "لفهم كيف تطور المفهوم عبر العصور وتوقع مستقبله",
      "To understand how the concept evolved and predict its future",
      thinkMatch ? 8 : 2,
    );

    // 8. Specialized Labs
    const specializedMatch =
      !q ||
      q.includes("قرار") ||
      q.includes("خيار") ||
      q.includes("أزمة") ||
      q.includes("تنفيذي") ||
      q.includes("استراتيجي") ||
      q.includes("decision") ||
      q.includes("strategic") ||
      q.includes("executive");
    addPath(
      "decisionroom",
      "innovation",
      "غرفة القرار",
      "Decision Room",
      Lock,
      "مختبر القرارات الاستراتيجية",
      "Strategic decision lab",
      "لتحليل الخيارات المعقدة واتخاذ قرارات مصيرية بناءً على محاور القوة والمخاطر",
      "To analyze complex choices and make critical decisions",
      specializedMatch ? 12 : 2,
    );

    addPath(
      "knowledgecenter",
      "roadmap",
      "مركز المعرفة",
      "Knowledge Center",
      ClipboardCheck,
      "قياس الفجوة",
      "Measure gap",
      "للتأكد من استيعاب السياق أو المفهوم قبل البدء في التطبيق",
      "To ensure core context is understood before applying",
      roadMatch ? 8 : 2,
    );

    // Sort by weight descending
    ranked.sort((a, b) => (b.weight || 0) - (a.weight || 0));

    console.log("[SmartGateway] RESULTS FOUND:", ranked.length);
    console.log(
      "[SmartGateway] IDS:",
      ranked.map((r) => r.id),
    );

    return ranked;
  }, [deferredQuery, language]);

  const directJourneyProfile = useMemo(
    () => pickJourneyProfile(query, undefined),
    [query],
  );

  const journeyProfile = useMemo(
    () => pickJourneyProfile(deferredQuery || query, suggestions[0]?.id),
    [deferredQuery, query, suggestions],
  );

  const directGuidance = useMemo(
    () =>
      buildDirectGuidance({
        query,
        language,
        journeyId: directJourneyProfile.id,
        mode: responseMode,
        specificInsight: smartResponse,
      }),
    [query, language, directJourneyProfile.id, responseMode, smartResponse],
  );

  const journeyDoors = useMemo(() => {
    return decorateJourneyDoors(suggestions, tabs, journeyProfile.id, language);
  }, [suggestions, tabs, journeyProfile.id, language]);

  // Split the journey into progressive doors: first door, then deeper different doors.
  const { primarySuggestion, secondarySuggestions, alternativeSuggestions } =
    useMemo(() => {
      const primary = journeyDoors[0] || suggestions[0] || null;
      const secondary = journeyDoors.slice(1, 3);
      const alternative = journeyDoors.slice(3, 8);

      return {
        primarySuggestion: primary,
        secondarySuggestions: secondary,
        alternativeSuggestions: alternative,
      };
    }, [journeyDoors, suggestions]);

  const progressiveDoors = useMemo(() => {
    return [...secondarySuggestions, ...alternativeSuggestions].slice(
      0,
      depthLevel,
    );
  }, [secondarySuggestions, alternativeSuggestions, depthLevel]);

  const visibleSecondarySuggestions = progressiveDoors.slice(0, 2);
  const visibleAlternativeSuggestions = progressiveDoors.slice(2);
  const hasMoreDepth =
    depthLevel < secondarySuggestions.length + alternativeSuggestions.length;
  const lastVisibleDoor = progressiveDoors[progressiveDoors.length - 1] || null;
  const depthMoment = useMemo(() => {
    const moments = [
      {
        ar: {
          label: "زد العمق",
          title: "افتح زاوية جديدة",
          desc: "نضيف باباً واحداً فقط، عشان تبقى الصورة هادئة.",
        },
        en: {
          label: "Go deeper",
          title: "Open a new angle",
          desc: "We add only one door so the view stays calm.",
        },
      },
      {
        ar: {
          label: "اكشف الزاوية المخفية",
          title: "ظهرت زاوية ما كانت واضحة",
          desc: "هذا الباب يفتح معنى مختلف، مو تكراراً للباب الأول.",
        },
        en: {
          label: "Reveal the hidden angle",
          title: "A hidden angle appeared",
          desc: "This door opens a different meaning, not a repeat.",
        },
      },
      {
        ar: {
          label: "اختبرها بقوة",
          title: "حان وقت اختبار الفكرة",
          desc: "نضغط الاحتمال شوي عشان نعرف قوته قبل القرار.",
        },
        en: {
          label: "Stress-test it",
          title: "Time to test the idea",
          desc: "We gently pressure the possibility before deciding.",
        },
      },
      {
        ar: {
          label: "حوّلها إلى خطوة",
          title: "الوضوح صار أقرب للتنفيذ",
          desc: "نقلل التفكير الزائد ونقربك من خطوة عملية.",
        },
        en: {
          label: "Turn it into a step",
          title: "Clarity is becoming action",
          desc: "We reduce overthinking and move toward a practical step.",
        },
      },
      {
        ar: {
          label: "افتح الأثر",
          title: "نشوف امتداد القرار أو الفكرة",
          desc: "هنا يبدأ تبيان يريك ما وراء اللحظة الحالية.",
        },
        en: {
          label: "Open the impact",
          title: "See the wider impact",
          desc: "Here Tebyan shows what lives beyond the current moment.",
        },
      },
    ];
    return moments[Math.min(depthLevel, moments.length - 1)];
  }, [depthLevel]);
  const depthCtaText = hasMoreDepth
    ? language === "ar"
      ? depthMoment.ar.label
      : depthMoment.en.label
    : language === "ar"
      ? "اكتفي بهذا الباب"
      : "Stay with this door";

  useEffect(() => {
    setDepthLevel(0);
  }, [journeyProfile.id, query]);

  const dailyDiscovery = useMemo(() => {
    const daySeed = Math.floor(Date.now() / 86400000);
    const items = [
      {
        ar: "اختبر قراراً صغيراً كأنه قرار مصيري",
        en: "Test a small decision like it matters",
        queryAr: "لدي قرار صغير وأريد اختبار أثره قبل أن أتسرع",
        queryEn:
          "I have a small decision and want to test its impact before rushing",
      },
      {
        ar: "حوّل فكرة عادية إلى شيء قابل للتنفيذ",
        en: "Turn an ordinary idea into something buildable",
        queryAr: "لدي فكرة بسيطة وأريد تحويلها إلى خطة قابلة للتنفيذ",
        queryEn:
          "I have a simple idea and want to turn it into an executable plan",
      },
      {
        ar: "افتح زاوية لم تكن تراها في موقفك",
        en: "Open an angle you were not seeing",
        queryAr: "أريد زاوية جديدة لموقف أفكر فيه كثيراً",
        queryEn: "I want a new angle on a situation I keep thinking about",
      },
      {
        ar: "درّب نفسك على حوار صعب قبل حدوثه",
        en: "Rehearse a hard conversation before it happens",
        queryAr: "لدي حوار صعب وأريد التدرب عليه قبل خوضه",
        queryEn:
          "I have a difficult conversation and want to rehearse it first",
      },
    ];
    return items[daySeed % items.length];
  }, []);

  const dailyWow = useMemo(() => {
    const daySeed = Math.floor(Date.now() / 86400000);
    const items = [
      {
        ar: "اليوم جرّب تسأل: ما الشيء الصغير الذي لو رتبته تغيّر يومي؟",
        en: "Today ask: what small thing would change my day if I organized it?",
        queryAr: "ما الشيء الصغير الذي لو رتبته الآن يغير يومي للأفضل؟",
        queryEn: "What small thing would improve my day if I organized it now?",
      },
      {
        ar: "اليوم افتح باباً لـ: فكرة مؤجلة تستحق فرصة ثانية.",
        en: "Today open: a postponed idea that deserves a second chance.",
        queryAr: "لدي فكرة مؤجلة وأريد معرفة ما إذا كانت تستحق فرصة ثانية",
        queryEn:
          "I have a postponed idea and want to know if it deserves a second chance",
      },
      {
        ar: "اليوم دع تبيان يكشف لك عن زاوية لم تكن تراها.",
        en: "Today let Tebyan reveal an angle you were not seeing.",
        queryAr: "أريد زاوية جديدة لموضوع يشغل تفكيري",
        queryEn: "I want a new angle on something taking my attention",
      },
      {
        ar: "اليوم حوّل الحيرة إلى خطوة واحدة فقط.",
        en: "Today turn hesitation into just one step.",
        queryAr: "أنا محتار وأريد خطوة واحدة واضحة أبدأ بها",
        queryEn: "I am unsure and want one clear step to start with",
      },
    ];
    return items[(daySeed + 2) % items.length];
  }, []);

  const sevenDayStep = useMemo(() => {
    const daySeed = Math.floor(Date.now() / 86400000);
    const steps = [
      {
        ar: "اليوم نفهم",
        en: "Today we understand",
        descAr: "اختر موضوعاً واحداً واجعله واضحاً.",
        descEn: "Pick one topic and make it clear.",
        queryAr: "أريد فهم موضوع يشغل تفكيري",
        queryEn: "I want to understand one topic taking my attention",
      },
      {
        ar: "اليوم نرتب",
        en: "Today we organize",
        descAr: "نحوّل التشويش إلى نقاط بسيطة.",
        descEn: "We turn noise into simple points.",
        queryAr: "أريد ترتيب أفكاري حول موضوع متداخل",
        queryEn: "I want to organize my thoughts around a tangled topic",
      },
      {
        ar: "اليوم نحسم",
        en: "Today we decide",
        descAr: "نقربك من خيار أوضح.",
        descEn: "We move you toward a clearer option.",
        queryAr: "أحتاج أحسم خياراً بين أكثر من احتمال",
        queryEn: "I need to decide between several possibilities",
      },
      {
        ar: "اليوم نختبر",
        en: "Today we test",
        descAr: "نشوف قوة الفكرة قبل اعتمادها.",
        descEn: "We test the idea before trusting it.",
        queryAr: "أريد اختبار فكرة أو قرار قبل اعتماده",
        queryEn: "I want to test an idea or decision before committing",
      },
      {
        ar: "اليوم نبني",
        en: "Today we build",
        descAr: "نحوّل الفهم إلى خطوة عملية.",
        descEn: "We turn understanding into action.",
        queryAr: "أريد تحويل فهمي إلى خطوة عملية واضحة",
        queryEn: "I want to turn my understanding into one practical step",
      },
      {
        ar: "اليوم نراجع",
        en: "Today we review",
        descAr: "نخفف الأخطاء قبل الحركة.",
        descEn: "We reduce mistakes before moving.",
        queryAr: "أريد مراجعة قراري والتأكد من مخاطره",
        queryEn: "I want to review my decision and check its risks",
      },
      {
        ar: "اليوم نفتح أثره",
        en: "Today we open its impact",
        descAr: "لنرى ما الذي سيتغير إذا بدأت.",
        descEn: "We see what changes if you start.",
        queryAr: "أريد معرفة أثر الخطوة القادمة قبل أن أبدأ",
        queryEn: "I want to know the impact of the next step before starting",
      },
    ];
    return {
      ...steps[daySeed % steps.length],
      dayNumber: (daySeed % steps.length) + 1,
    };
  }, []);

  const goldenSummary = useMemo(() => {
    const firstDoor =
      primarySuggestion?.label ||
      (language === "ar"
        ? journeyProfile.firstDoor.ar
        : journeyProfile.firstDoor.en);
    const lastDoor = lastVisibleDoor?.label || firstDoor;
    if (language === "ar") {
      return {
        truth: `الحقيقة: الموضوع بدأ من "${firstDoor}" ووصل إلى "${lastDoor}".`,
        risk: "الخطر: التشتت يزيد إذا فتحت كل الأبواب مرة واحدة.",
        choice: "الاختيار: خذ أوضح باب الآن، واترك الباقي عند الحاجة.",
        step: 'الخطوة: اكتب جملة واحدة تبدأ بـ "الآن سأفعل".',
      };
    }
    return {
      truth: `Truth: the journey started with "${firstDoor}" and reached "${lastDoor}".`,
      risk: "Risk: clutter grows when every door opens at once.",
      choice: "Choice: take the clearest door now, leave the rest for later.",
      step: 'Step: write one sentence starting with "Now I will".',
    };
  }, [
    primarySuggestion?.label,
    lastVisibleDoor?.label,
    journeyProfile.firstDoor.ar,
    journeyProfile.firstDoor.en,
    language,
  ]);

  const cleanGatewayText = (value: string) => {
    const raw = (value || "").trim();
    return raw
      .replace(/^حوّل هذا الموضوع إلى خطوة واحدة واضحة[:：]?\s*/i, "")
      .replace(/^حول هذا الموضوع إلى خطوة واحدة واضحة[:：]?\s*/i, "")
      .replace(/^Turn this topic into one clear next step[:：]?\s*/i, "")
      .replace(/^أبي\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const cleanQuery = cleanGatewayText(query);
  const shortQuery =
    cleanQuery.length > 110 ? `${cleanQuery.slice(0, 110)}…` : cleanQuery;

  const livingWorld = useMemo(() => {
    const combined = [
      query,
      ...searchHistory,
      normalizeFollowUpQuery(lastInteraction?.query) || "",
    ]
      .join(" ")
      .toLowerCase();
    const count = (words: string[]) =>
      words.reduce((sum, word) => sum + (combined.includes(word) ? 1 : 0), 0);
    const scores = {
      ideas: count([
        "فكرة",
        "إبداع",
        "ابتكار",
        "مشروع",
        "idea",
        "creative",
        "project",
      ]),
      decisions: count([
        "قرار",
        "اختيار",
        "حسم",
        "محتار",
        "decision",
        "choose",
      ]),
      steps: count(["خطة", "خطوة", "تنفيذ", "هدف", "plan", "step", "goal"]),
    };
    const dominant =
      Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "ideas";
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 5;
    const daySeed = Math.floor(Date.now() / 86400000);
    const rare =
      (searchHistory.length >= 3 || depthLevel >= 2) &&
      (daySeed + searchHistory.length + depthLevel) % 3 === 0;
    const strength = Math.min(
      100,
      28 + searchHistory.length * 9 + depthLevel * 13,
    );
    const map = [
      {
        id: "ideas",
        ar: "أفكارك",
        en: "Ideas",
        value: Math.min(100, 38 + scores.ideas * 18 + depthLevel * 5),
        color: "#8E7AAE",
      },
      {
        id: "decisions",
        ar: "قراراتك",
        en: "Decisions",
        value: Math.min(
          100,
          34 +
            scores.decisions * 18 +
            (journeyProfile.id === "decision" ? 18 : 0),
        ),
        color: "#8FA9C7",
      },
      {
        id: "steps",
        ar: "خطواتك",
        en: "Steps",
        value: Math.min(
          100,
          30 + scores.steps * 18 + (depthLevel >= 3 ? 20 : 0),
        ),
        color: "#A8C3BD",
      },
    ];

    const dominantLabel =
      language === "ar"
        ? dominant === "decisions"
          ? "الحسم"
          : dominant === "steps"
            ? "الخطوات"
            : "الأفكار"
        : dominant === "decisions"
          ? "decisions"
          : dominant === "steps"
            ? "steps"
            : "ideas";

    return {
      map,
      strength,
      isNight,
      rare,
      dominantLabel,
      message:
        language === "ar"
          ? `تبيان لاحظ أن حضور ${dominantLabel} عندك أوضح اليوم. نبدأ من هناك بهدوء؟`
          : `Tebyan noticed ${dominantLabel} are showing up today. Start there calmly?`,
      rareMessage:
        language === "ar"
          ? "تبيان لاحظ نمطاً يتكرر: أنت لا تحتاج أدوات أكثر، تحتاج الباب الأنسب في اللحظة المناسبة."
          : "Tebyan noticed a repeating pattern: you do not need more tools, you need the right door at the right moment.",
      nightTitle: language === "ar" ? "بوابة الليل" : "Night gate",
      nightDesc:
        language === "ar"
          ? "تفريغ هادئ لليوم، قرار مؤجل، أو فكرة قبل النوم."
          : "A calm day release, postponed decision, or idea before sleep.",
      tomorrow:
        language === "ar"
          ? "غداً نكمل من الباب الذي بدأ يوضح لك الصورة."
          : "Tomorrow we continue from the door that started making things clearer.",
    };
  }, [
    query,
    searchHistory,
    lastInteraction?.query,
    depthLevel,
    journeyProfile.id,
    language,
  ]);

  /* useEffect for typing indicator removed to prevent conflict with handleSubmit */

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-2 flex flex-col min-h-0">
      {/* One-screen gateway: the user sees one question, while Tebyan routes the full lab behind it. */}
      <div className="flex flex-col mt-0 md:mt-4 mb-6 md:mb-12">
        {/* Title Section always visible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="tebyan-home-hero text-center mb-3 md:mb-7"
        >
          <header
            className="text-center"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            {userName && userName !== "ضيف" && userName !== "New User" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="tebyan-home-greeting mb-2 text-xs font-black text-[#8E7AAE] md:text-sm"
              >
                {language === "ar"
                  ? `أهلاً بك يا ${userName}`
                  : `Welcome, ${userName}`}
              </motion.div>
            )}
            <h1 className="mx-auto max-w-[720px] text-[1.78rem] font-bold leading-[1.3] tracking-tight text-[#182231] md:text-5xl lg:text-[2.85rem]">
              {language === "ar"
                ? "ماذا تود أن تفهم أو تحسم اليوم؟"
                : "What do you want to understand or decide today?"}
            </h1>
            <p className="mx-auto mt-2.5 max-w-xl text-[0.92rem] font-bold leading-7 text-[#64788D] md:mt-4 md:text-lg md:leading-8">
              {language === "ar"
                ? "اكتب سؤالك بطريقتك، حتى لو كان غير مرتب."
                : "Write your question in your own words, even if it is not organized."}
            </p>
          </header>
        </motion.div>

        {false && !hasSearched && !isThinking && isHome && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-4 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            <button
              type="button"
              onClick={() => setShowDailyDock((v) => !v)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] md:text-xs font-black shadow-sm transition-all active:scale-95",
                showDailyDock
                  ? "border-[#8E7AAE]/30 bg-[#F4F0F8] text-[#6E5F8E]"
                  : "border-[#8FA9C7]/16 bg-white/64 text-[#64788D] hover:border-[#8E7AAE]/24",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {language === "ar" ? "ومضة اليوم" : "Today spark"}
            </button>
            <button
              type="button"
              onClick={() => setShowLivingWorldPanel((v) => !v)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] md:text-xs font-black shadow-sm transition-all active:scale-95",
                showLivingWorldPanel
                  ? "border-[#A8C3BD]/32 bg-[#F7FBF9] text-[#34524B]"
                  : "border-[#8FA9C7]/16 bg-white/64 text-[#64788D] hover:border-[#A8C3BD]/26",
              )}
            >
              <Network className="h-3.5 w-3.5" />
              {language === "ar" ? "عالمك" : "Your world"}
            </button>
            {livingWorld.rare && (
              <button
                type="button"
                onClick={() => setShowLivingWorldPanel(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#D8C58A]/24 bg-[#FFFDF4]/70 px-3.5 py-2 text-[11px] md:text-xs font-black text-[#9C7A28] shadow-sm transition-all active:scale-95"
              >
                <Eye className="h-3.5 w-3.5" />
                {language === "ar" ? "اكتشاف" : "Discovery"}
              </button>
            )}
          </motion.div>
        )}

        {false &&
          showLivingWorldPanel &&
          !hasSearched &&
          !isThinking &&
          isHome && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mb-5 w-full max-w-3xl rounded-[24px] border border-[#8FA9C7]/14 bg-white/72 p-3 shadow-[0_14px_42px_rgba(24,34,49,0.045)] backdrop-blur-xl"
              dir={language === "ar" ? "rtl" : "ltr"}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <p className="text-right text-xs md:text-sm font-black leading-relaxed text-[#182231]">
                  {livingWorld.message}
                </p>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {livingWorld.map.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const nextValue =
                          language === "ar"
                            ? `أريد ترتيب ${item.ar} اليوم بخطوة واضحة`
                            : `I want to organize my ${item.en.toLowerCase()} today with one clear step`;
                        setSearchValue(nextValue);
                        latestInputRef.current = nextValue;
                        setQuery(nextValue);
                        setSmartSuggestion("");
                        handleSubmit(undefined, nextValue);
                      }}
                      title={language === "ar" ? item.ar : item.en}
                      className="inline-flex items-center gap-2 rounded-full border border-[#8FA9C7]/14 bg-[#FAF9F6]/82 px-3 py-1.5 text-[11px] font-black text-[#465568] shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {language === "ar" ? item.ar : item.en}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        <AnimatePresence>
          {showStylePicker && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 bg-white border border-zinc-100 p-6 rounded-[32px] shadow-2xl space-y-6 text-right"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowStylePicker(false)}
                  className="text-[#7C8796] hover:text-[#6E5F8E]"
                >
                  <X className="w-5 h-5" />
                </button>
                <h4 className="font-black text-zinc-800">
                  {language === "ar"
                    ? "كيف تفضل أن تتعلم؟"
                    : "How do you prefer to learn?"}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: "practical",
                    labelAr: "عملي (حلول سريعة)",
                    labelEn: "Practical (Fast solutions)",
                    icon: Zap,
                  },
                  {
                    id: "analytical",
                    labelAr: "تحليلي (فهم عميق)",
                    labelEn: "Analytical (Deep insight)",
                    icon: BrainCircuit,
                  },
                  {
                    id: "simulation",
                    labelAr: "تدريبي (محاكاة)",
                    labelEn: "Simulation (Practice)",
                    icon: Gamepad2,
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => confirmStyle(s.id as any)}
                    className={cn(
                      "p-4 rounded-2xl border text-right transition-all group flex flex-col gap-3",
                      "bg-white border-zinc-100 hover:border-[#8E7AAE]/45",
                    )}
                  >
                    <s.icon
                      className={cn(
                        "w-6 h-6",
                        "text-[#7C8796] group-hover:text-[#6E5F8E]",
                      )}
                    />
                    <div>
                      <div className="font-black text-sm">
                        {language === "ar" ? s.labelAr : s.labelEn}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {showFollowUp && lastInteraction && !hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-auto mb-4 w-full max-w-3xl rounded-[22px] border border-[#A8C3BD]/18 bg-[#F7FBF9]/76 px-3 py-2.5 text-[#34524B] shadow-sm backdrop-blur-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <button
                  onClick={() => setShowFollowUp(false)}
                  className="absolute left-3 top-3 text-[#7DA39A] hover:text-[#34524B] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue(
                      normalizeFollowUpQuery(lastInteraction.query),
                    );
                    latestInputRef.current = normalizeFollowUpQuery(
                      lastInteraction.query,
                    );
                    setQuery(normalizeFollowUpQuery(lastInteraction.query));
                    setShowFollowUp(false);
                  }}
                  className="min-w-0 flex-1 text-right"
                >
                  <p className="text-[10px] font-black tracking-[0.18em] uppercase text-[#5E8B80]">
                    {language === "ar" ? "نكمل السابق؟" : "Continue previous?"}
                  </p>
                  <p className="mt-0.5 truncate text-xs md:text-sm font-black text-[#34524B]">
                    "{normalizeFollowUpQuery(lastInteraction.query)}"
                  </p>
                </button>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleFollowUpFeedback("success")}
                    className="rounded-full border border-[#A8C3BD]/22 bg-white/76 px-3 py-1.5 text-[11px] font-black text-[#4D6B63] transition-all active:scale-95"
                  >
                    {language === "ar" ? "تمام" : "Good"}
                  </button>
                  <button
                    onClick={() => {
                      handleFollowUpFeedback("fail");
                      const nextValue =
                        language === "ar"
                          ? "في موضوع المرة السابقة، واجهت مشكلة إضافية وهي: "
                          : "Regarding the previous topic, I faced another issue: ";
                      setSearchValue(nextValue);
                      latestInputRef.current = nextValue;
                      setQuery(nextValue);
                    }}
                    className="rounded-full border border-rose-200 bg-white/76 px-3 py-1.5 text-[11px] font-black text-rose-700 transition-all active:scale-95"
                  >
                    {language === "ar" ? "أحتاج دعم" : "Need support"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-20 flex flex-col items-center justify-center min-h-0">
          <MoodBackgroundEffect mood={mood || "default"} />
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-4xl flex flex-col items-center"
          >
            <div className="tebyan-search-stage w-full relative flex flex-col items-center mt-2 mb-5 group">
              {isThinking && (
                <div className="absolute inset-0 bg-mood-glow blur-[100px] rounded-full scale-150 animate-pulse pointer-events-none transition-colors duration-1000" />
              )}

              {!hasSearched && !isThinking && (
                <div
                  className="mb-4 w-full max-w-3xl space-y-3"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {lastInteraction?.query && !showFollowUp && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        const nextValue = normalizeFollowUpQuery(
                          lastInteraction.query,
                        );
                        setSearchValue(nextValue);
                        latestInputRef.current = nextValue;
                        setQuery(nextValue);
                        setSmartSuggestion("");
                      }}
                      className="mx-auto block w-full max-w-xl rounded-[26px] sm:rounded-full border border-[#A8C3BD]/22 bg-[#F7FBF9]/78 px-3 py-2 text-right shadow-sm backdrop-blur-xl transition-all hover:border-[#A8C3BD]/38 active:scale-[0.99] overflow-hidden"
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#5E8B80]">
                            {language === "ar" ? "نكمل السابق" : "Continue"}
                          </p>
                          <p className="mt-0.5 line-clamp-2 max-w-full break-words text-[11px] sm:text-xs font-black leading-relaxed text-[#34524B]">
                            "{normalizeFollowUpQuery(lastInteraction.query)}"
                          </p>
                        </div>
                        <ArrowLeft
                          className={cn(
                            "h-4 w-4 shrink-0 text-[#5E8B80]",
                            language === "ar" ? "" : "rotate-180",
                          )}
                        />
                      </div>
                    </motion.button>
                  )}
                  {tomorrowRoom?.query && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        const nextValue = tomorrowRoom.query;
                        setSearchValue(nextValue);
                        latestInputRef.current = nextValue;
                        setQuery(nextValue);
                        setSmartSuggestion("");
                      }}
                      className="mx-auto block w-full max-w-xl rounded-[26px] sm:rounded-full border border-[#8FA9C7]/18 bg-white/72 px-3 py-2 text-right shadow-sm backdrop-blur-xl transition-all hover:border-[#8E7AAE]/30 active:scale-[0.99] overflow-hidden"
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#64788D]">
                            {language === "ar" ? "باب باجر" : "Tomorrow"}
                          </p>
                          <p className="mt-0.5 line-clamp-2 max-w-full break-words text-[11px] sm:text-xs font-black leading-relaxed text-[#182231]">
                            "{tomorrowRoom.query}"
                          </p>
                        </div>
                        <ArrowLeft
                          className={cn(
                            "h-4 w-4 shrink-0 text-[#64788D]",
                            language === "ar" ? "" : "rotate-180",
                          )}
                        />
                      </div>
                    </motion.button>
                  )}
                </div>
              )}

              <div
                className={cn(
                  "tour-search-input tebyan-gateway-ring tebyan-cognitive-mood flex items-center w-full max-w-3xl rounded-[28px] md:rounded-[32px] p-2.5 md:p-3 transition-all duration-700 border backdrop-blur-xl tebyan-soft-card relative overflow-visible",
                  `tebyan-cognitive-${cognitiveMood.id}`,
                  searchValue.trim().length > 0 && "tebyan-understanding-pulse",
                  showGateEcho && "tebyan-gate-arrival",
                  isFocused
                    ? "ring-4 ring-[#8E7AAE]/10 shadow-[0_18px_60px_rgba(142,122,174,0.14)] bg-[#FAF9F6]/95"
                    : "bg-[#FAF9F6]/80",
                  getFluidStyles(),
                  getFluidAmbient(),
                )}
                style={clarityRingStyle}
              >
                {searchValue.trim().length >= 3 && (
                  <div className="pointer-events-none absolute -top-9 right-5 z-20 hidden md:flex items-center gap-2 rounded-full border border-[#8E7AAE]/12 bg-white/82 px-3 py-1.5 shadow-sm backdrop-blur-xl">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: cognitiveMood.accent,
                        boxShadow: `0 0 14px ${cognitiveMood.glow}`,
                      }}
                    />
                    <span className="text-[10px] font-black text-[#465568]">
                      {cognitiveMood.label}
                    </span>
                  </div>
                )}
                {showGateEcho && (
                  <div className="pointer-events-none absolute -inset-10 z-0 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 1.22, opacity: 0.0 }}
                      animate={{
                        scale: [1.22, 1.02, 1.08],
                        opacity: [0, 0.58, 0],
                      }}
                      transition={{ duration: 2.65, ease: "easeInOut" }}
                      className="h-40 w-40 rounded-full border border-[#8E7AAE]/22 bg-[#F4F0FA]/30 blur-[1px]"
                    />
                  </div>
                )}
                <div className="flex-1 relative flex overflow-hidden flex-col justify-center">
                  <TextareaAutosize
                    ref={inputRef as any}
                    value={searchValue}
                    minRows={1}
                    maxRows={4}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    placeholder={
                      language === "ar"
                        ? "اكتب سؤالك هنا… حتى لو كان غير مرتب"
                        : "Write your question here, even if it is not organized"
                    }
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Tab" ||
                          (e.key === "Enter" && !e.shiftKey)) &&
                        smartSuggestion
                      ) {
                        e.preventDefault();
                        setSearchValue(smartSuggestion);
                        latestInputRef.current = smartSuggestion;
                        setSmartSuggestion("");
                      } else if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(undefined, searchValue);
                      } else if (
                        (e.key === "ArrowRight" || e.key === "ArrowLeft") &&
                        smartSuggestion
                      ) {
                        if (
                          e.currentTarget.selectionStart === searchValue.length
                        ) {
                          e.preventDefault();
                          setSearchValue(smartSuggestion);
                          latestInputRef.current = smartSuggestion;
                          setQuery(smartSuggestion);
                          setSmartSuggestion("");
                        }
                      }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full bg-transparent border-none outline-none px-3 md:px-6 py-2.5 md:py-4 text-[15px] sm:text-base md:text-xl lg:text-2xl font-medium tracking-[-0.015em] text-[#182231] placeholder:text-[#7C8796]/45 z-10 relative resize-none leading-relaxed"
                    dir={language === "ar" ? "rtl" : "ltr"}
                    aria-label={
                      language === "ar" ? "اكتب سؤالك" : "Write your question"
                    }
                  />

                  {smartSuggestion &&
                    smartSuggestion.startsWith(searchValue) && (
                      <div
                        className="pointer-events-none absolute inset-0 px-3 md:px-6 py-2.5 md:py-4 text-[15px] sm:text-base md:text-xl lg:text-2xl font-bold tracking-tight z-0 whitespace-pre-wrap break-words leading-relaxed overflow-hidden"
                        dir={language === "ar" ? "rtl" : "ltr"}
                      >
                        <span className="invisible">{searchValue}</span>
                        <span className="text-[#8E7AAE]/28">
                          {smartSuggestion.slice(searchValue.length)}
                        </span>
                      </div>
                    )}
                </div>

                <button
                  type="submit"
                  title={
                    language === "ar" ? "البحث أو التحليل" : "Search / Analyze"
                  }
                  className={cn(
                    "bg-[#8E7AAE] text-white w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[20px] transition-colors duration-75 active:scale-[0.98] flex items-center justify-center shrink-0",
                    searchValue.trim().length > 0
                      ? "opacity-100 shadow-[0_16px_38px_rgba(142,122,174,0.20)]"
                      : "opacity-35 pointer-events-none",
                  )}
                >
                  <span className="relative inline-flex items-center justify-center">
                    {searchValue.trim().length > 0 && (
                      <span
                        aria-hidden
                        className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-white/90"
                      />
                    )}
                    <TebyanGlyph
                      kind="gateway"
                      className="w-7 h-7 md:w-8 md:h-8"
                    />
                  </span>
                </button>
                {searchValue.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    title={language === "ar" ? "مسح السؤال" : "Clear question"}
                    aria-label={
                      language === "ar" ? "مسح السؤال" : "Clear question"
                    }
                    className="bg-white/90 text-[#64788D] border border-[#8FA9C7]/20 w-11 h-11 md:w-14 md:h-14 rounded-[16px] md:rounded-[18px] transition-all hover:scale-[1.03] hover:border-[#8E7AAE]/35 hover:text-[#6E5F8E] active:scale-[0.98] flex items-center justify-center shrink-0 shadow-sm"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                )}
              </div>

              {!hasSearched &&
                !isThinking &&
                liveQuestionOptions.length > 0 && (
                  <div
                    className="tebyan-live-suggestions mx-auto mt-3 w-full max-w-3xl"
                    dir={language === "ar" ? "rtl" : "ltr"}
                    aria-live="polite"
                  >
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <Sparkles className="h-3.5 w-3.5 text-[#8E7AAE]" />
                      <span className="text-[11px] font-semibold text-[#7C8796]">
                        {language === "ar" ? "يمكن أن تقصد…" : "You may mean…"}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {liveQuestionOptions.map((option, index) => (
                        <button
                          key={`${option}-${index}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setSearchValue(option);
                            latestInputRef.current = option;
                            setSmartSuggestion("");
                            setInputSettled(false);
                            window.requestAnimationFrame(() => inputRef.current?.focus());
                          }}
                          className="tebyan-live-suggestion-option group flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-[#8FA9C7]/14 bg-white/78 px-4 py-2.5 text-start text-[13px] font-medium leading-6 text-[#465568] shadow-[0_7px_22px_rgba(24,34,49,0.035)] transition-colors duration-100 hover:border-[#8E7AAE]/28 hover:bg-white hover:text-[#182231] active:bg-[#F6F3FA]"
                        >
                          <span>{option}</span>
                          <ArrowLeft className="h-4 w-4 shrink-0 text-[#8E7AAE]/60 transition-transform duration-100 group-hover:-translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {!hasSearched &&
                !isThinking &&
                inputSettled &&
                instantSearch.results.length > 0 && (
                  <details
                    className="mt-4 w-full max-w-3xl mx-auto rounded-2xl border border-[#8FA9C7]/14 bg-white/70 px-4 py-3 text-right shadow-sm"
                    dir={language === "ar" ? "rtl" : "ltr"}
                  >
                    <summary className="cursor-pointer list-none text-xs md:text-sm font-black text-[#64788D] flex items-center justify-between gap-3">
                      <span>
                        {language === "ar"
                          ? "وجدت نتائج جاهزة قريبة من سؤالك"
                          : "I found ready results close to your question"}
                      </span>
                      <Search className="h-4 w-4 text-[#8E7AAE]" />
                    </summary>
                    <div className="mt-3 border-t border-[#8FA9C7]/10 pt-3">
                      <InstantResults
                        results={instantSearch.results}
                        query={searchValue}
                        language={language}
                        corpusSize={instantSearch.corpusSize}
                        onPick={(q) => handlePathSelect("qawlfasl", q)}
                      />
                    </div>
                  </details>
                )}

              {!hasSearched &&
                !isThinking &&
                inputSettled &&
                searchValue.trim().length >= 8 && (
                  <div
                    className="mt-3 w-full max-w-3xl mx-auto text-right"
                    dir={language === "ar" ? "rtl" : "ltr"}
                  >
                    <button
                      type="button"
                      onClick={() => setShowQuestionHelper((value) => !value)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#8E7AAE]/14 bg-white/72 px-4 py-2 text-xs font-black text-[#6E5F8E] transition-all hover:bg-[#F7F3FA] active:scale-[0.98]"
                    >
                      <Sparkles className="h-4 w-4" />
                      {showQuestionHelper
                        ? language === "ar"
                          ? "إخفاء مساعد الصياغة"
                          : "Hide question helper"
                        : language === "ar"
                          ? "ساعدني أصيغ السؤال"
                          : "Help me phrase the question"}
                    </button>
                  </div>
                )}

              {!hasSearched &&
                !isThinking &&
                showQuestionHelper &&
                searchValue.trim().length >= 3 && (
                  <div className="mt-4 w-full max-w-3xl mx-auto">
                    <SmartIntentEngine
                      language={language}
                      value={searchValue}
                      onApply={(nextValue) => {
                        setSearchValue(nextValue);
                        latestInputRef.current = nextValue;
                        setQuery(nextValue);
                        setSmartSuggestion("");
                        inputRef.current?.focus();
                      }}
                      onSubmit={(nextValue) =>
                        handleSubmit(undefined, nextValue)
                      }
                      onQawlFasl={(nextValue) =>
                        handlePathSelect("qawlfasl", nextValue)
                      }
                      onOpenPath={(path, nextValue) =>
                        handlePathSelect(path, nextValue)
                      }
                    />
                  </div>
                )}

              {questionClarity &&
                !hasSearched &&
                !isThinking &&
                inputSettled &&
                questionClarity.score < 60 && (
                  <div
                    className="mt-3 w-full max-w-3xl mx-auto rounded-2xl border border-[#D8C58A]/22 bg-[#FFFDF4]/78 px-4 py-3 tebyan-focus-keep text-right"
                    dir={language === "ar" ? "rtl" : "ltr"}
                  >
                    <p className="text-xs font-black text-[#9C7A28]">
                      {language === "ar"
                        ? "اقتراح بسيط ليكون الجواب أدق"
                        : "A small suggestion for a more precise answer"}
                    </p>
                    <p className="mt-1 text-sm font-bold leading-relaxed text-[#64788D]">
                      {questionClarity.hint}
                    </p>
                  </div>
                )}
            </div>

            <AnimatePresence>
              {selectionFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 bg-mood-primary text-white px-8 py-3 rounded-full text-sm font-black shadow-2xl z-50 whitespace-nowrap transition-colors duration-700"
                >
                  {selectionFeedback}
                </motion.div>
              )}

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-6 py-2 rounded-full text-xs font-black shadow-xl"
                >
                  {errorMsg}
                </motion.div>
              )}

              {(isThinking || hasSearched) && !isMobileViewport && (
                <motion.div
                  id="desktop-results"
                  key="desktop-suggestions"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-zinc-100 mt-2 p-4 hidden md:block space-y-4"
                >
                  <div className="flex justify-center mb-4">
                    {/* Instead of a confusing "return" message, present a clear restart call-to-action */}
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="px-6 py-2 bg-[#8E7AAE]/12 hover:bg-mood-primary/20 text-[#6E5F8E] rounded-full font-bold text-sm transition-all duration-500"
                    >
                      {language === "ar" ? "سؤال جديد" : "New question"}
                    </button>
                  </div>
                  {isThinking ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-6">
                      <div className="relative w-full max-w-sm h-20 flex flex-col items-center justify-center overflow-hidden gap-4">
                        <AIHeartbeat className="opacity-50" />
                        <AnimatePresence mode="popLayout">
                          <TypographicAcoustic
                            key={loadingPhraseIndex}
                            type="snap"
                            className="text-[#182231] font-black text-xl text-center w-full"
                          >
                            {language === "ar"
                              ? loadingPhrasesAr[loadingPhraseIndex]
                              : loadingPhrasesEn[loadingPhraseIndex]}
                          </TypographicAcoustic>
                        </AnimatePresence>
                      </div>

                      <div className="text-center space-y-4 max-w-sm mx-auto px-4">
                        <AnimatePresence mode="wait">
                          {smartResponse && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-4 bg-mood-secondary/5 border border-mood-secondary/10 rounded-2xl mb-4"
                            >
                              <div className="flex items-center gap-2 mb-2 justify-center">
                                <Sparkles className="w-4 h-4 text-[#6E5F8E]" />
                                <span className="text-[11px] leading-[1.6] font-black text-[#6E5F8E] uppercase tracking-widest">
                                  {language === "ar"
                                    ? "استنتاج أولي"
                                    : "Initial Insight"}
                                </span>
                              </div>
                              <p className="text-[#6E5F8E] font-bold text-sm leading-relaxed">
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
                      <DirectAnswerCard
                        language={language}
                        query={shortQuery || query}
                        summary={directGuidance.summary}
                        action={directGuidance.action}
                        context={directGuidance.context}
                        responseMode={responseMode}
                        accent={directJourneyProfile.accent}
                        showOptions={showDirectTools}
                        onContinue={() =>
                          handlePathSelect(
                            primarySuggestion?.id || "qawlfasl",
                            query,
                          )
                        }
                        onShowOptions={() =>
                          setShowDirectTools((value) => !value)
                        }
                        onExplain={() => {
                          setShowDirectTools(true);
                          setResponseMode("simple");
                          setDepthLevel((level) => Math.max(level, 1));
                        }}
                        onPlan={() => handlePathSelect("roadmap", query)}
                        onDeepen={() => {
                          setShowDirectTools(true);
                          setResponseMode("deep");
                          setDepthLevel((level) => Math.max(level, 3));
                        }}
                      />

                      {showDirectTools && (
                        <>
                          {/* Account status stays quiet; saving is handled once in the knowledge seal below. */}
                          <div className="border border-[#8FA9C7]/12 bg-white/70 rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 mt-2">
                            <div className="flex items-start gap-3 text-right">
                              <div className="w-9 h-9 rounded-xl bg-[#F4F8F7] flex items-center justify-center text-[#5C8B7E] shrink-0 mt-0.5 border border-[#DDEDEA]">
                                {user ? (
                                  <CheckCircle2 className="w-4.5 h-4.5 text-[#0F9F6E]" />
                                ) : (
                                  <Lock className="w-4.5 h-4.5 text-[#7C8796]" />
                                )}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="font-black text-xs md:text-sm text-[#182231] leading-relaxed">
                                  {user
                                    ? language === "ar"
                                      ? `مرتبط بحسابك: ${userName}`
                                      : `Linked to your account: ${userName}`
                                    : language === "ar"
                                      ? "هذه النتيجة متاحة لك الآن"
                                      : "This result is available to you now"}
                                </h4>
                                <p className="text-[11px] text-[#64788D] font-bold leading-normal">
                                  {user
                                    ? language === "ar"
                                      ? "جاهز للحفظ في نهاية المسار بدون أزرار مكررة."
                                      : "Ready to save below without repeated buttons."
                                    : language === "ar"
                                      ? "سجّل فقط إذا تبي تحفظها وتكمل عليها لاحقاً."
                                      : "Sign in only if you want to save it and continue later."}
                                </p>
                              </div>
                            </div>
                            {!user && (
                              <div className="shrink-0 flex w-full md:w-auto self-end md:self-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => onShowLogin?.()}
                                  className="bg-[#182231] text-white hover:bg-black font-black text-xs px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  {language === "ar"
                                    ? "حفظ ومتابعة"
                                    : "Save and continue"}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-8">
                            <div className="md:grid grid-cols-12 gap-8 mt-8">
                              <div
                                className={cn(
                                  "col-span-12",
                                  depthLevel > 2
                                    ? "md:col-span-8"
                                    : "md:col-span-12",
                                )}
                              >
                                {/* Focus Layer: Primary Suggestion */}
                                {primarySuggestion && (
                                  <div className="space-y-4">
                                    <div className="px-4 py-2 text-[11px] font-black text-[#6E5F8E] uppercase tracking-widest border-b border-zinc-100 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {language === "ar"
                                            ? "التعمق المقترح"
                                            : "RECOMMENDED DEEPER PATH"}
                                        </span>
                                        <Zap className="w-3 h-3" />
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePathSelect(
                                          primarySuggestion.id,
                                          query,
                                        )
                                      }
                                      className="tebyan-primary-route-card w-full flex-col md:flex-row flex md:items-center justify-between p-6 md:p-10 rounded-[32px] md:rounded-[48px] transition-all group text-right border active:scale-[0.98] bg-white text-[#182231] hover:opacity-100 border-[#DED6EA] shadow-[0_22px_60px_rgba(24,34,49,0.08)] relative overflow-hidden"
                                    >
                                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 relative z-10 w-full md:w-auto">
                                        <div className="w-14 h-14 md:w-20 md:h-20 rounded-[20px] md:rounded-[32px] bg-white/76 border border-[#DED6EA] text-[#6E5F8E] flex items-center justify-center transition-all group-hover:scale-110 shrink-0 self-end md:self-auto shadow-sm">
                                          {(() => {
                                            const Icon = journeyProfile.icon;
                                            return (
                                              <Icon className="w-7 h-7 md:w-10 md:h-10" />
                                            );
                                          })()}
                                        </div>
                                        <div className="text-right w-full">
                                          <div className="flex items-center gap-2 mb-1 md:mb-2 justify-end md:justify-start">
                                            <h3 className="text-2xl md:text-3xl font-black">
                                              {language === "ar"
                                                ? journeyProfile.firstDoor.ar
                                                : journeyProfile.firstDoor.en}
                                            </h3>
                                          </div>
                                          <p className="text-sm md:text-base font-semibold text-[#5E6B7A] max-w-md leading-relaxed">
                                            {language === "ar"
                                              ? journeyProfile.deepen.ar
                                              : journeyProfile.deepen.en}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="mt-6 md:mt-0 relative z-10 w-full md:w-auto text-center md:text-right shrink-0">
                                        <div className="w-full md:w-auto inline-flex justify-center items-center gap-3 md:gap-4 bg-[#F4F0F8] text-[#6E5F8E] border border-[#DED6EA] px-6 py-3 rounded-full md:group-hover:bg-white transition-all shadow-sm shrink-0 whitespace-nowrap min-w-[110px] md:min-w-[130px]">
                                          <span className="font-bold text-sm whitespace-nowrap shrink-0">
                                            {language === "ar"
                                              ? "البدء"
                                              : "Start"}
                                          </span>
                                          <ArrowLeft
                                            className={cn(
                                              "w-4 h-4 md:w-5 md:h-5 shrink-0",
                                              language === "ar"
                                                ? "group-hover:-translate-x-2"
                                                : "rotate-180 group-hover:translate-x-2",
                                            )}
                                          />
                                        </div>
                                      </div>
                                    </button>
                                  </div>
                                )}

                                {/* Progressive disclosure layer: keep all tools available without crowding first view */}
                                {(secondarySuggestions.length > 0 ||
                                  alternativeSuggestions.length > 0) && (
                                  <div className="mt-4 rounded-[22px] border border-[#8FA9C7]/12 bg-white/62 p-3.5 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="text-right">
                                      <h4 className="text-sm md:text-base font-black text-zinc-900">
                                        {language === "ar"
                                          ? "خيارات أخرى عند الحاجة"
                                          : "Other options if needed"}
                                      </h4>
                                      <p className="mt-1 text-xs md:text-sm font-bold text-zinc-500">
                                        {language === "ar"
                                          ? "ابدأ بالباب الأول. افتح خياراً إضافياً فقط إذا ما كان مناسباً."
                                          : "Start with the first door. Open another option only if needed."}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDepthLevel((level) =>
                                          hasMoreDepth ? level + 1 : 0,
                                        )
                                      }
                                      className="shrink-0 px-5 py-2.5 rounded-full bg-white border border-[#8FA9C7]/16 text-[#465568] font-black text-xs shadow-sm hover:border-[#8E7AAE]/24 active:scale-95 transition-all"
                                    >
                                      {depthCtaText}
                                    </button>
                                  </div>
                                )}

                                {depthLevel > 0 && lastVisibleDoor && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 rounded-[24px] border border-[#8E7AAE]/14 bg-[#FAF9F6]/88 p-4 md:p-5 shadow-[0_14px_44px_rgba(24,34,49,0.05)]"
                                    dir={language === "ar" ? "rtl" : "ltr"}
                                  >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                      <div className="text-right">
                                        <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#8E7AAE]">
                                          {language === "ar"
                                            ? `العمق ${depthLevel}`
                                            : `Depth ${depthLevel}`}
                                        </p>
                                        <h4 className="mt-1 text-base md:text-lg font-black text-[#182231]">
                                          {language === "ar"
                                            ? depthMoment.ar.title
                                            : depthMoment.en.title}
                                        </h4>
                                        <p className="mt-1 text-xs md:text-sm font-bold leading-relaxed text-[#64788D]">
                                          {lastVisibleDoor.desc ||
                                            (language === "ar"
                                              ? depthMoment.ar.desc
                                              : depthMoment.en.desc)}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1.5 justify-end">
                                        {[0, 1, 2, 3, 4].map((step) => (
                                          <span
                                            key={`depth-dot-${step}`}
                                            className={cn(
                                              "h-2 rounded-full transition-all",
                                              step < depthLevel
                                                ? "w-6 bg-[#8E7AAE]"
                                                : "w-2 bg-[#D9DEE5]",
                                            )}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}

                                {/* Focus Layer: Secondary Options */}
                                {visibleSecondarySuggestions.length > 0 && (
                                  <div className="mt-8 pt-8 border-t border-zinc-100">
                                    <h4 className="text-[11px] leading-[1.6] font-black text-[#7C8796] uppercase tracking-widest mb-4 px-2">
                                      {language === "ar"
                                        ? "أبواب أعمق"
                                        : "DEEPER DOORS"}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {visibleSecondarySuggestions.map((s) => {
                                        const Icon = s.icon;
                                        return (
                                          <button
                                            key={`sec-${s.id}`}
                                            type="button"
                                            onClick={() =>
                                              handlePathSelect(s.id, query)
                                            }
                                            className="flex items-center justify-between p-5 rounded-[24px] transition-all duration-300 group text-right border bg-white border-zinc-100 hover:border-zinc-300 active:scale-95 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-0.5"
                                          >
                                            <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 rounded-[16px] bg-zinc-50 border border-zinc-100 text-[#7C8796] group-hover:bg-zinc-900 group-hover:border-zinc-800 group-hover:text-white transition-all duration-300 flex items-center justify-center">
                                                <Icon className="w-5 h-5" />
                                              </div>
                                              <div className="text-right">
                                                <h4 className="text-sm font-black text-zinc-900">
                                                  {s.label}
                                                </h4>
                                                <p className="text-xs leading-relaxed text-zinc-500 font-bold mt-1 line-clamp-1">
                                                  {s.desc}
                                                </p>
                                              </div>
                                            </div>
                                            <ArrowLeft
                                              className={cn(
                                                "w-4 h-4 text-[#6E5F8E] group-hover:text-zinc-900 transition-colors",
                                                language === "ar"
                                                  ? ""
                                                  : "rotate-180",
                                              )}
                                            />
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* NEW: DEEP COGNITIVE ANALYSIS */}
                              </div>

                              {/* Alternative Paths */}
                              {visibleAlternativeSuggestions.length > 0 && (
                                <div className="col-span-12 md:col-span-4 space-y-4">
                                  <h4 className="text-[11px] leading-[1.6] font-black text-[#7C8796] uppercase tracking-widest px-2">
                                    {language === "ar"
                                      ? "إذا تبي أكثر"
                                      : "MORE IF NEEDED"}
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                                    {visibleAlternativeSuggestions.map(
                                      (s: any) => {
                                        const Icon = s.icon;
                                        return (
                                          <button
                                            key={`alt-${s.id}`}
                                            type="button"
                                            title={s.tooltip}
                                            onClick={() =>
                                              handlePathSelect(s.id, query)
                                            }
                                            className="w-full flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300 group text-right bg-zinc-50 border border-[#8FA9C7]/15 hover:bg-white hover:border-zinc-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95"
                                          >
                                            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 text-[#7C8796] flex items-center justify-center shadow-sm group-hover:text-[#6E5F8E] group-hover:border-zinc-300 transition-colors shrink-0">
                                              <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="text-right flex-1 min-w-0 break-words w-full">
                                              <div className="font-black text-sm text-zinc-800 truncate mb-0.5">
                                                {s.label}
                                              </div>
                                              <p className="text-[11px] leading-relaxed text-zinc-500 font-medium line-clamp-2 w-full">
                                                {s.desc}
                                              </p>
                                            </div>
                                          </button>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            {depthLevel >= 3 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-[28px] border border-[#D8C58A]/30 bg-[#FFFDF4]/86 p-5 md:p-6 shadow-[0_18px_55px_rgba(168,137,48,0.08)]"
                                dir={language === "ar" ? "rtl" : "ltr"}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="text-right">
                                    <p className="text-[10px] font-black tracking-[0.24em] uppercase text-[#9C7A28]">
                                      {language === "ar"
                                        ? "الخلاصة الذهبية"
                                        : "Golden summary"}
                                    </p>
                                    <h4 className="mt-1 text-lg md:text-xl font-black text-[#182231]">
                                      {language === "ar"
                                        ? "الصورة صارت أوضح"
                                        : "The picture is clearer now"}
                                    </h4>
                                  </div>
                                  <Sparkles className="h-5 w-5 shrink-0 text-[#9C7A28]" />
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {[
                                    goldenSummary.truth,
                                    goldenSummary.risk,
                                    goldenSummary.choice,
                                    goldenSummary.step,
                                  ].map((item, index) => (
                                    <div
                                      key={`golden-${index}`}
                                      className="rounded-2xl border border-[#D8C58A]/18 bg-white/72 p-3 text-sm font-bold leading-relaxed text-[#465568]"
                                    >
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </>
                      )}
                      {hasSearched && showDirectTools && (
                        <KnowledgeSignature
                          language={language}
                          query={query}
                          kind="مسار فهم"
                          onSave={handleSaveToLibrary}
                          onLink={() => handleTabChange("knowledgegraph")}
                        />
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* Mobile simplified results */}
              {(isThinking || hasSearched) && isMobileViewport && (
                <motion.div
                  id="mobile-results"
                  key="mobile-suggestions"
                  className="md:hidden border-t border-[#8FA9C7]/10 px-1 sm:px-4 py-6 space-y-6 bg-transparent"
                >
                  <div className="flex justify-center mb-2">
                    {/* Mobile: provide a simple restart option instead of returning to home */}
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="px-6 py-2 bg-zinc-100 hover:bg-zinc-200 text-[#465568] rounded-full font-bold text-sm transition-all"
                    >
                      {language === "ar" ? "سؤال جديد" : "New question"}
                    </button>
                  </div>
                  {isThinking ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-6">
                      <div className="relative w-full max-w-sm h-20 flex flex-col items-center justify-center overflow-hidden gap-4">
                        <AIHeartbeat className="opacity-50" />
                        <AnimatePresence mode="popLayout">
                          <motion.p
                            key={loadingPhraseIndex}
                            initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                            exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.4 }}
                            className="text-[#182231] font-black text-lg text-center w-full"
                          >
                            {language === "ar"
                              ? loadingPhrasesAr[loadingPhraseIndex]
                              : loadingPhrasesEn[loadingPhraseIndex]}
                          </motion.p>
                        </AnimatePresence>
                      </div>

                      <div className="text-center space-y-3 px-4">
                        <AnimatePresence mode="wait">
                          {smartResponse && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-4 bg-[#EEF4F1] border border-[#A8C3BD]/25 rounded-2xl mb-2"
                            >
                              <p className="text-[#34524B] font-bold text-xs leading-relaxed">
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
                            <p className="text-[#7C8796] font-bold italic text-sm leading-relaxed px-6">
                              "{dynamicInsights[insightIndex]}"
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <DirectAnswerCard
                        language={language}
                        query={shortQuery || query}
                        summary={directGuidance.summary}
                        action={directGuidance.action}
                        context={directGuidance.context}
                        responseMode={responseMode}
                        accent={directJourneyProfile.accent}
                        showOptions={showDirectTools}
                        onContinue={() =>
                          handlePathSelect(
                            primarySuggestion?.id || "qawlfasl",
                            query,
                          )
                        }
                        onShowOptions={() =>
                          setShowDirectTools((value) => !value)
                        }
                        onExplain={() => {
                          setShowDirectTools(true);
                          setResponseMode("simple");
                          setDepthLevel((level) => Math.max(level, 1));
                        }}
                        onPlan={() => handlePathSelect("roadmap", query)}
                        onDeepen={() => {
                          setShowDirectTools(true);
                          setResponseMode("deep");
                          setDepthLevel((level) => Math.max(level, 3));
                        }}
                      />

                      {showDirectTools && (
                        <>
                          {/* Mobile account status */}
                          <div className="border border-[#8FA9C7]/12 bg-white rounded-2xl p-3 flex flex-col gap-3 text-right">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#F4F8F7] flex items-center justify-center text-[#5C8B7E] shrink-0 border border-[#DDEDEA]">
                                {user ? (
                                  <CheckCircle2 className="w-4.5 h-4.5 text-[#0F9F6E]" />
                                ) : (
                                  <Lock className="w-4.5 h-4.5 text-[#7C8796]" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-black text-xs text-[#182231]">
                                  {user
                                    ? language === "ar"
                                      ? `مرتبط بحسابك: ${userName}`
                                      : `Linked to account: ${userName}`
                                    : language === "ar"
                                      ? "هذه النتيجة متاحة لك الآن"
                                      : "This result is available now"}
                                </h4>
                                <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                                  {user
                                    ? language === "ar"
                                      ? "الحفظ صار في زر واحد فقط بالأسفل."
                                      : "Saving now lives in one button below."
                                    : language === "ar"
                                      ? "سجّل فقط إذا تبي تحفظها وتكمل عليها لاحقاً."
                                      : "Sign in only to save it and continue later."}
                                </p>
                              </div>
                            </div>
                            {!user && (
                              <div className="flex justify-end mt-1">
                                <button
                                  type="button"
                                  onClick={() => onShowLogin?.()}
                                  className="w-full bg-[#182231] text-white hover:bg-black font-black text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Lock className="w-3 h-3" />
                                  {language === "ar"
                                    ? "حفظ ومتابعة"
                                    : "Save and continue"}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Mobile Primary */}
                          {primarySuggestion && (
                            <div className="space-y-3">
                              <span className="font-black text-[10px] text-[#7C8796] uppercase tracking-widest px-2">
                                {language === "ar"
                                  ? "التعمق المقترح"
                                  : "RECOMMENDED PATH"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePathSelect(primarySuggestion.id, query)
                                }
                                className="tebyan-primary-route-card w-full flex items-center justify-between p-6 bg-white text-[#182231] rounded-[32px] shadow-[0_18px_52px_rgba(24,34,49,0.08)] border border-[#DED6EA] active:scale-95 transition-all"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-[#F4F0F8] border border-[#DED6EA] text-[#6E5F8E] flex items-center justify-center">
                                    {(() => {
                                      const Icon = journeyProfile.icon;
                                      return <Icon className="w-6 h-6" />;
                                    })()}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-black text-lg tracking-tight">
                                      {language === "ar"
                                        ? journeyProfile.firstDoor.ar
                                        : journeyProfile.firstDoor.en}
                                    </div>
                                    <div className="text-[11px] leading-[1.6] text-[#64788D] font-semibold">
                                      {language === "ar"
                                        ? "مسار إضافي بعد حصولك على الخلاصة"
                                        : "An optional path after your summary"}
                                    </div>
                                  </div>
                                </div>
                                <ArrowLeft
                                  className={cn(
                                    "w-6 h-6",
                                    language === "ar" ? "" : "rotate-180",
                                  )}
                                />
                              </button>
                            </div>
                          )}

                          {/* Mobile Secondary */}
                          {(secondarySuggestions.length > 0 ||
                            alternativeSuggestions.length > 0) && (
                            <div className="rounded-[24px] md:rounded-[28px] border border-zinc-100 bg-zinc-50 p-4 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-right">
                                  <div className="font-black text-sm text-zinc-900">
                                    {language === "ar"
                                      ? "باب أعمق إذا احتجت"
                                      : "A deeper door if needed"}
                                  </div>
                                  <p className="mt-1 text-[11px] font-bold text-zinc-500">
                                    {language === "ar"
                                      ? "نفتح زاوية ثانية، مو نفس الباب."
                                      : "We open a second angle, not the same door."}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDepthLevel((level) =>
                                      hasMoreDepth ? level + 1 : 0,
                                    )
                                  }
                                  className="shrink-0 px-4 py-2 rounded-full bg-white border border-zinc-100 text-zinc-800 font-black text-[11px] shadow-sm active:scale-95 transition-all"
                                >
                                  {depthCtaText}
                                </button>
                              </div>
                            </div>
                          )}

                          {depthLevel > 0 && lastVisibleDoor && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-[24px] border border-[#8E7AAE]/14 bg-[#FAF9F6]/88 p-4 shadow-[0_14px_42px_rgba(24,34,49,0.05)]"
                              dir={language === "ar" ? "rtl" : "ltr"}
                            >
                              <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#8E7AAE]">
                                {language === "ar"
                                  ? `العمق ${depthLevel}`
                                  : `Depth ${depthLevel}`}
                              </p>
                              <h4 className="mt-1 text-base font-black text-[#182231]">
                                {language === "ar"
                                  ? depthMoment.ar.title
                                  : depthMoment.en.title}
                              </h4>
                              <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#64788D]">
                                {lastVisibleDoor.desc ||
                                  (language === "ar"
                                    ? depthMoment.ar.desc
                                    : depthMoment.en.desc)}
                              </p>
                            </motion.div>
                          )}

                          {visibleSecondarySuggestions.length > 0 && (
                            <div className="space-y-3">
                              <span className="font-black text-[10px] text-[#7C8796] uppercase tracking-widest px-2">
                                {language === "ar"
                                  ? "أبواب أعمق"
                                  : "DEEPER DOORS"}
                              </span>
                              <div className="grid grid-cols-1 gap-2">
                                {visibleSecondarySuggestions.map((s) => {
                                  const Icon = s.icon;
                                  return (
                                    <button
                                      key={`mob-sec-${s.id}`}
                                      type="button"
                                      onClick={() =>
                                        handlePathSelect(s.id, query)
                                      }
                                      className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-[24px] border border-zinc-100 active:scale-95 transition-all"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#7C8796] shadow-sm">
                                          <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="text-right">
                                          <div className="font-bold text-sm text-zinc-900">
                                            {s.label}
                                          </div>
                                          <p className="text-[11px] leading-[1.6] text-zinc-500 font-bold mt-1 line-clamp-1">
                                            {s.desc}
                                          </p>
                                        </div>
                                      </div>
                                      <ArrowLeft
                                        className={cn(
                                          "w-4 h-4 text-[#6E5F8E]",
                                          language === "ar" ? "" : "rotate-180",
                                        )}
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="h-px bg-zinc-100 mx-4" />

                          {/* Mobile Alternative Paths */}
                          {visibleAlternativeSuggestions.length > 0 && (
                            <div className="space-y-3">
                              <span className="font-black text-[10px] text-[#7C8796] uppercase tracking-widest px-2">
                                {language === "ar"
                                  ? "إذا تبي أكثر"
                                  : "MORE IF NEEDED"}
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {visibleAlternativeSuggestions.map((s: any) => {
                                  const Icon = s.icon;
                                  return (
                                    <div
                                      key={`mob-rest-${s.id}`}
                                      onClick={() =>
                                        handlePathSelect(s.id, query)
                                      }
                                      className="flex flex-col items-start gap-4 p-5 bg-white rounded-[24px] border border-zinc-100/80 hover:border-zinc-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 transition-all group cursor-pointer"
                                    >
                                      <div className="w-10 h-10 rounded-[14px] bg-zinc-50 border border-zinc-100 text-[#7C8796] group-hover:bg-zinc-900 group-hover:border-zinc-800 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <div className="text-right">
                                        <div className="font-black text-[13px] text-zinc-900 mb-1">
                                          {s.label}
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-zinc-500 font-medium line-clamp-2">
                                          {s.desc}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {depthLevel >= 3 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-[24px] border border-[#D8C58A]/30 bg-[#FFFDF4]/88 p-4 shadow-[0_14px_44px_rgba(168,137,48,0.08)]"
                              dir={language === "ar" ? "rtl" : "ltr"}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-right">
                                  <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#9C7A28]">
                                    {language === "ar"
                                      ? "الخلاصة الذهبية"
                                      : "Golden summary"}
                                  </p>
                                  <h4 className="mt-1 text-base font-black text-[#182231]">
                                    {language === "ar"
                                      ? "الصورة صارت أوضح"
                                      : "The picture is clearer now"}
                                  </h4>
                                </div>
                                <Sparkles className="h-5 w-5 shrink-0 text-[#9C7A28]" />
                              </div>
                              <div className="mt-3 space-y-2">
                                {[
                                  goldenSummary.truth,
                                  goldenSummary.risk,
                                  goldenSummary.choice,
                                  goldenSummary.step,
                                ].map((item, index) => (
                                  <div
                                    key={`mob-golden-${index}`}
                                    className="rounded-2xl border border-[#D8C58A]/18 bg-white/74 p-3 text-[11px] font-bold leading-relaxed text-[#465568]"
                                  >
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* NEW: DEEP COGNITIVE ANALYSIS MOBILE */}
                          <div className="px-1"></div>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
              {hasSearched && !isThinking && showDirectTools && (
                <motion.details
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-3xl group rounded-2xl border border-[#8FA9C7]/10 bg-white/70 px-4 py-3 text-right shadow-[0_10px_28px_rgba(24,34,49,0.035)]"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-xs md:text-sm font-black text-[#64788D]">
                    <span>
                      {language === "ar"
                        ? "لاحقاً إذا احتجت"
                        : "Later if needed"}
                    </span>
                    <span className="text-[11px] font-bold text-[#8E7AAE]">
                      {language === "ar" ? "غرفة الغد" : "Tomorrow room"}
                    </span>
                  </summary>
                  <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-[#8FA9C7]/10 pt-3">
                    <p className="text-sm md:text-base font-black text-[#182231] leading-relaxed">
                      {livingWorld.tomorrow}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const nextValue =
                          language === "ar"
                            ? `غداً نكمل من هنا: ${query}`
                            : `Tomorrow continue from here: ${query}`;
                        const savedDoor = {
                          query: nextValue,
                          at: new Date().toISOString(),
                        };
                        try {
                          localStorage.setItem(
                            "tebyan_tomorrow_room",
                            JSON.stringify(savedDoor),
                          );
                        } catch (e) {}
                        setTomorrowRoom(savedDoor);
                        setSelectionFeedback(
                          language === "ar"
                            ? "تم تجهيز باب الغد"
                            : "Tomorrow door is ready",
                        );
                        setTimeout(() => setSelectionFeedback(""), 2200);
                      }}
                      className="shrink-0 rounded-full bg-[#F4F1F8] px-4 py-2 text-xs font-black text-[#6E5F8E] border border-[#DED6EA] transition-all hover:bg-[#EEE8F7] active:scale-95"
                    >
                      {language === "ar" ? "ذكرني باجر" : "Remind me tomorrow"}
                    </button>
                  </div>
                </motion.details>
              )}
            </AnimatePresence>
          </form>

          {/* Simple entry layer: only inspiration toggle stays on demand */}
          {!hasSearched && !isThinking && (
            <div
              className="mt-4 md:mt-6 w-full max-w-3xl mx-auto flex flex-col items-center gap-3 md:gap-4"
              dir={language === "ar" ? "rtl" : "ltr"}
            >
              <div className="w-full space-y-3 text-center">
                {(() => {
                  const examples =
                    language === "ar"
                      ? [
                          "ولدي ما يحب المدرسة، شلون أتعامل معاه؟",
                          "محتار بين وظيفتين، شلون أقرر؟",
                          "اشرح لي هذا الموضوع ببساطة",
                        ]
                      : [
                          "My child dislikes school. How should I respond?",
                          "I am choosing between two jobs. How do I decide?",
                          "Explain this topic to me simply",
                        ];
                  const example = examples[exampleIndex % examples.length];
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchValue(example);
                          latestInputRef.current = example;
                          setQuery(example);
                          setSmartSuggestion("");
                          inputRef.current?.focus();
                        }}
                        className="min-h-11 max-w-full rounded-full border border-[#8FA9C7]/16 bg-white/80 px-4 py-2 text-[13px] font-black leading-6 text-[#465568] shadow-sm transition-colors hover:border-[#8E7AAE]/30 hover:text-[#6E5F8E] active:scale-[0.98]"
                      >
                        <span className="text-[#8E7AAE]">
                          {language === "ar" ? "مثال: " : "Example: "}
                        </span>
                        {example}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExampleIndex(
                            (value) => (value + 1) % examples.length,
                          )
                        }
                        className="min-h-9 px-3 text-xs font-black text-[#7C8796] hover:text-[#6E5F8E]"
                      >
                        {language === "ar" ? "مثال آخر" : "Another example"}
                      </button>
                    </div>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setShowInspiration((value) => !value)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#C9BEDF]/34 bg-white/60 px-4 py-2 text-xs font-black text-[#7C8796] shadow-sm transition-all hover:bg-white hover:text-[#6E5F8E] active:scale-[0.98]"
                  aria-expanded={showInspiration}
                >
                  <Sparkles className="h-4 w-4" />
                  {showInspiration
                    ? language === "ar"
                      ? "إخفاء مساحة الاستكشاف"
                      : "Hide discovery space"
                    : language === "ar"
                      ? "استكشف شيئاً جديداً اليوم"
                      : "Discover something new today"}
                </button>
              </div>

              {false && !searchValue.trim() && isHome && showDailyDock && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full rounded-[22px] border border-[#8FA9C7]/14 bg-white/72 p-3 shadow-[0_12px_36px_rgba(24,34,49,0.04)] backdrop-blur-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#64788D]">
                        {livingWorld.isNight
                          ? livingWorld.nightTitle
                          : language === "ar"
                            ? "باب اليوم"
                            : "Today"}
                      </p>
                      <h3 className="text-sm md:text-base font-black text-[#182231]">
                        {livingWorld.isNight
                          ? livingWorld.nightDesc
                          : language === "ar"
                            ? dailyWow.ar
                            : dailyWow.en}
                      </h3>
                      <p className="mt-0.5 text-[11px] md:text-xs font-bold text-[#7C8796]">
                        {language === "ar"
                          ? `رحلة ٧ أيام · اليوم ${sevenDayStep.dayNumber}: ${sevenDayStep.ar}`
                          : `7-day journey · day ${sevenDayStep.dayNumber}: ${sevenDayStep.en}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const nextValue = livingWorld.isNight
                            ? language === "ar"
                              ? "أريد تفريغ أفكار اليوم بهدوء والخروج بخطوة واحدة"
                              : "I want to calmly release today’s thoughts and leave with one step"
                            : language === "ar"
                              ? dailyWow.queryAr
                              : dailyWow.queryEn;
                          setSearchValue(nextValue);
                          latestInputRef.current = nextValue;
                          setQuery(nextValue);
                          setSmartSuggestion("");
                          handleSubmit(undefined, nextValue);
                        }}
                        className="rounded-full bg-[#182231] px-4 py-2 text-[11px] font-black text-white shadow-sm transition-all active:scale-95"
                      >
                        {language === "ar" ? "افتح" : "Open"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextValue =
                            language === "ar"
                              ? sevenDayStep.queryAr
                              : sevenDayStep.queryEn;
                          setSearchValue(nextValue);
                          latestInputRef.current = nextValue;
                          setQuery(nextValue);
                          setSmartSuggestion("");
                          handleSubmit(undefined, nextValue);
                        }}
                        className="rounded-full border border-[#8FA9C7]/18 bg-white px-4 py-2 text-[11px] font-black text-[#465568] shadow-sm transition-all active:scale-95"
                      >
                        {language === "ar" ? "رحلة اليوم" : "Journey"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {false && !searchValue.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full rounded-[24px] border border-[#8E7AAE]/12 bg-white/68 p-3 md:p-4 shadow-[0_14px_45px_rgba(24,34,49,0.05)] backdrop-blur-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-right">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F0F8] text-[#6E5F8E] border border-[#DED6EA] shrink-0">
                        <Compass className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#8E7AAE]">
                          {language === "ar" ? "باب اليوم" : "Today’s doorway"}
                        </p>
                        <h3 className="text-sm md:text-base font-black text-[#182231]">
                          {language === "ar"
                            ? dailyDiscovery.ar
                            : dailyDiscovery.en}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextValue =
                          language === "ar"
                            ? dailyDiscovery.queryAr
                            : dailyDiscovery.queryEn;
                        setSearchValue(nextValue);
                        latestInputRef.current = nextValue;
                        setQuery(nextValue);
                        setSmartSuggestion("");
                        handleSubmit(undefined, nextValue);
                      }}
                      className="shrink-0 rounded-2xl bg-[#182231] px-5 py-3 text-xs md:text-sm font-black text-white shadow-[0_14px_30px_rgba(24,34,49,0.18)] transition-all hover:bg-black active:scale-[0.98]"
                    >
                      {language === "ar" ? "ادخل" : "Enter"}
                    </button>
                  </div>
                </motion.div>
              )}

              {false && !searchValue.trim() && isHome && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="w-full rounded-[24px] border border-[#8FA9C7]/14 bg-[#FAF9F6]/72 p-3 md:p-4 shadow-[0_14px_45px_rgba(24,34,49,0.045)] backdrop-blur-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-right">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF2F6] text-[#64788D] border border-[#8FA9C7]/18 shrink-0">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#64788D]">
                          {language === "ar" ? "شيء جديد اليوم" : "New today"}
                        </p>
                        <h3 className="text-sm md:text-base font-black text-[#182231]">
                          {language === "ar" ? dailyWow.ar : dailyWow.en}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextValue =
                          language === "ar"
                            ? dailyWow.queryAr
                            : dailyWow.queryEn;
                        setSearchValue(nextValue);
                        latestInputRef.current = nextValue;
                        setQuery(nextValue);
                        setSmartSuggestion("");
                        handleSubmit(undefined, nextValue);
                      }}
                      className="shrink-0 rounded-2xl bg-white px-5 py-3 text-xs md:text-sm font-black text-[#465568] border border-[#8FA9C7]/18 shadow-sm transition-all hover:border-[#8E7AAE]/30 active:scale-[0.98]"
                    >
                      {language === "ar" ? "افتحها" : "Open it"}
                    </button>
                  </div>
                </motion.div>
              )}

              {false && !searchValue.trim() && isHome && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="w-full rounded-[24px] border border-[#A8C3BD]/18 bg-[#F7FBF9]/72 p-3 md:p-4 shadow-[0_14px_45px_rgba(24,34,49,0.045)] backdrop-blur-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-right">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#5E8B80] border border-[#A8C3BD]/20 shrink-0">
                        <Route className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#5E8B80]">
                          {language === "ar"
                            ? `رحلة ٧ أيام · اليوم ${sevenDayStep.dayNumber}`
                            : `7-day journey · day ${sevenDayStep.dayNumber}`}
                        </p>
                        <h3 className="text-sm md:text-base font-black text-[#182231]">
                          {language === "ar"
                            ? sevenDayStep.ar
                            : sevenDayStep.en}
                        </h3>
                        <p className="mt-0.5 text-[11px] md:text-xs font-bold text-[#64788D]">
                          {language === "ar"
                            ? sevenDayStep.descAr
                            : sevenDayStep.descEn}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextValue =
                          language === "ar"
                            ? sevenDayStep.queryAr
                            : sevenDayStep.queryEn;
                        setSearchValue(nextValue);
                        latestInputRef.current = nextValue;
                        setQuery(nextValue);
                        setSmartSuggestion("");
                        handleSubmit(undefined, nextValue);
                      }}
                      className="shrink-0 rounded-2xl bg-white px-5 py-3 text-xs md:text-sm font-black text-[#34524B] border border-[#A8C3BD]/22 shadow-sm transition-all hover:border-[#A8C3BD]/38 active:scale-[0.98]"
                    >
                      {language === "ar" ? "ابدأ اليوم" : "Start today"}
                    </button>
                  </div>
                </motion.div>
              )}

              {false &&
                !searchValue.trim() &&
                isHome &&
                livingWorld.isNight && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.11 }}
                    className="w-full rounded-[24px] border border-[#8E7AAE]/14 bg-[#F6F3FA]/70 p-3 md:p-4 shadow-[0_14px_45px_rgba(24,34,49,0.045)] backdrop-blur-xl"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-right">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#6E5F8E] border border-[#8E7AAE]/18 shrink-0">
                          <Moon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#6E5F8E]">
                            {livingWorld.nightTitle}
                          </p>
                          <h3 className="text-sm md:text-base font-black text-[#182231]">
                            {livingWorld.nightDesc}
                          </h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextValue =
                            language === "ar"
                              ? "أريد تفريغ أفكار اليوم بهدوء والخروج بخطوة واحدة"
                              : "I want to calmly release today’s thoughts and leave with one step";
                          setSearchValue(nextValue);
                          latestInputRef.current = nextValue;
                          setQuery(nextValue);
                          setSmartSuggestion("");
                          handleSubmit(undefined, nextValue);
                        }}
                        className="shrink-0 rounded-2xl bg-white px-5 py-3 text-xs md:text-sm font-black text-[#6E5F8E] border border-[#8E7AAE]/18 shadow-sm transition-all hover:border-[#8E7AAE]/35 active:scale-[0.98]"
                      >
                        {language === "ar" ? "هدّي اليوم" : "Close the day"}
                      </button>
                    </div>
                  </motion.div>
                )}

              {false && !searchValue.trim() && isHome && livingWorld.rare && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 }}
                  className="w-full rounded-[24px] border border-[#D8C58A]/24 bg-[#FFFDF4]/76 p-3 md:p-4 shadow-[0_14px_45px_rgba(168,137,48,0.06)] backdrop-blur-xl"
                >
                  <div className="flex items-start gap-3 text-right">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#9C7A28] border border-[#D8C58A]/24 shrink-0">
                      <Eye className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#9C7A28]">
                        {language === "ar" ? "اكتشاف نادر" : "Rare discovery"}
                      </p>
                      <h3 className="text-sm md:text-base font-black leading-relaxed text-[#182231]">
                        {livingWorld.rareMessage}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Dynamic Suggestion Chips - hidden until requested */}
          {showInspiration && !hasSearched && !isThinking && (
            <div className="mt-4 flex overflow-x-auto pb-3 gap-2 snap-x snap-mandatory no-scrollbar w-full max-w-full px-1">
              {proactiveInsights.dynamicSuggests.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const val = language === "ar" ? chip.ar : chip.en;
                    setSearchValue(val);
                    latestInputRef.current = val;
                    setQuery(val);
                    handleSubmit(undefined, val);
                    setIsFocused(true);
                  }}
                  className={cn(
                    "px-3.5 md:px-5 py-2 md:py-2.5 rounded-full border border-zinc-200 transition-all active:scale-95 shadow-sm whitespace-nowrap snap-center shrink-0 cursor-pointer overflow-hidden group relative",
                    "bg-white text-zinc-500 hover:border-mood-primary hover:text-[#6E5F8E]",
                    mood
                      ? getMoodTypography(mood)
                      : "font-bold text-xs md:text-sm",
                  )}
                >
                  <span className="relative z-10">
                    {language === "ar" ? chip.ar : chip.en}
                  </span>
                  {mood === "revolutionary" && (
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-mood-primary/10 to-transparent skew-x-[-20deg]"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasSearched && showInspiration && (
        <>
          {/* Ephemeral Wisdom Feature (FOMO) — compact whisper */}
          <div className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-white/58 backdrop-blur-xl border border-[#8FA9C7]/12 rounded-full px-3.5 py-2 flex items-center justify-between gap-3 shadow-[0_8px_24px_rgba(24,34,49,0.035)] relative overflow-hidden"
              dir={language === "ar" ? "rtl" : "ltr"}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles
                  className="w-3.5 h-3.5 text-[#8E7AAE] shrink-0 opacity-70"
                  strokeWidth={1.7}
                />
                <span className="text-[10px] md:text-[11px] font-black text-[#8E7AAE] whitespace-nowrap">
                  {language === "ar" ? "همسة عابرة" : "Passing whisper"}
                </span>
                <p className="text-xs md:text-sm font-bold text-[#465568] leading-relaxed truncate">
                  {language === "ar" ? currentWisdom.ar : currentWisdom.en}
                </p>
              </div>
              <span className="shrink-0 text-[10px] md:text-xs font-mono font-black text-[#7C8796] bg-white/70 px-2.5 py-1 rounded-full border border-[#8FA9C7]/12">
                {String(ephemeralTime.m).padStart(2, "0")}:
                {String(ephemeralTime.s).padStart(2, "0")}
              </span>
            </motion.div>
          </div>

          {/* Daily Challenge & Insights Section */}
          <div className="emotion-hide mt-5 md:mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-start">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white/72 backdrop-blur-xl rounded-[18px] md:rounded-[22px] p-3 md:p-3.5 text-[#182231] relative overflow-hidden group border border-[#8E7AAE]/10 shadow-[0_8px_22px_rgba(24,34,49,0.035)] self-start"
            >
              <div className="relative z-10">
                <h3 className="flex items-start gap-2.5 text-base md:text-lg font-black mb-3 leading-tight tracking-tight">
                  <span className="mt-0.5 inline-flex w-5 h-5 items-center justify-center shrink-0 rounded-full bg-[#8E7AAE]/10 text-[#6E5F8E]">
                    <Gamepad2 className="w-3 h-3" />
                  </span>
                  <span>
                    {language === "ar"
                      ? currentChallenge.titleAr
                      : currentChallenge.titleEn}
                  </span>
                </h3>
                <button
                  onClick={() =>
                    onPathSelect(
                      currentChallenge.path as any,
                      currentChallenge.query,
                    )
                  }
                  className="w-full py-2.5 md:py-2.5 bg-[#F3EFF9] text-[#4F4369] border border-[#8E7AAE]/16 rounded-2xl font-black text-sm md:text-sm hover:bg-[#EDE6F6] hover:-translate-y-0.5 transition-all active:scale-95 shadow-sm"
                >
                  {language === "ar" ? "ابدأ التحدي" : "Start Challenge"}
                </button>
              </div>
              {/* Abstract background element */}
              <div className="absolute -bottom-14 -right-14 w-44 h-44 bg-[#8FA9C7]/10 rounded-full blur-[54px] group-hover:scale-105 transition-transform duration-1000 pointer-events-none" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -1 }}
              className="relative bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-2xl rounded-[18px] md:rounded-[22px] border border-white/60 p-4 md:p-5 shadow-[0_12px_32px_rgba(100,120,141,0.05)] overflow-hidden self-start group"
              dir={language === "ar" ? "rtl" : "ltr"}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#8FA9C7]/15 via-transparent to-transparent opacity-60 rounded-bl-full pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2 border-b border-[#8FA9C7]/15 pb-3.5">
                  <div className="flex items-center gap-2 font-black text-[#506376]">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#8FA9C7]/20 to-[#8FA9C7]/5 shadow-sm border border-[#8FA9C7]/10">
                      <BrainCircuit className="h-3.5 w-3.5 text-[#64788D]" />
                    </div>
                    <span className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-[#465568]">
                      {language === "ar" ? "رؤية المنصة" : "Platform insight"}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-[#64788D] tracking-widest uppercase bg-[#8FA9C7]/10 px-2.5 py-1 rounded-full border border-[#8FA9C7]/10 shadow-inner">
                    {language === "ar"
                      ? "البيانات: 2000+ حالة"
                      : "Data: 2000+ cases"}
                  </span>
                </div>

                <h4 className="text-sm md:text-base font-black text-[#182231] leading-snug">
                  {language === "ar"
                    ? currentInsight.titleAr
                    : currentInsight.titleEn}
                </h4>

                <div className="space-y-3.5 mt-1">
                  {currentInsight.items.map((item, idx) => (
                    <div key={idx} className="group/item">
                      <div className="flex justify-between items-end mb-1.5 px-0.5">
                        <span className="text-[11px] font-bold text-[#64788D] transition-colors group-hover/item:text-[#182231]">
                          {language === "ar" ? item.labelAr : item.labelEn}
                        </span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[12px] font-black text-[#182231]">
                            {item.pct.replace("%", "")}
                          </span>
                          <span className="text-[9px] font-bold text-[#8FA9C7]">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#E5ECEF]/60 rounded-full overflow-hidden shadow-inner flex p-0.5">
                        <motion.div
                          className={`h-full ${item.color} rounded-full relative`}
                          initial={{ width: 0 }}
                          whileInView={{ width: item.pct }}
                          transition={{
                            duration: 1.2,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.1 * idx,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 rounded-full" />
                        </motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Signature Gate: Idea Fabric — keep it special and remove duplicate Knowledge Graph from dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="emotion-hide mt-4 md:mt-5 mb-9"
          >
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.995 }}
              className="w-full p-3 sm:p-3.5 md:p-4 tebyan-fabric-hero-card rounded-[20px] md:rounded-[24px] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 transition-all duration-500 group cursor-pointer relative overflow-hidden text-right"
              onClick={() => handleTabChange("ripple")}
            >
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#D8CEE9]/22 rounded-full blur-[68px] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#DCEAF4]/26 rounded-full blur-[68px] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none opacity-24">
                {[...Array(5)].map((_, i) => (
                  <motion.span
                    key={`fabric-shadow-${i}`}
                    animate={{
                      y: [0, i % 2 ? 4 : -4, 0],
                      opacity: [0.25, 0.72, 0.25],
                    }}
                    transition={{
                      duration: 4.6 + (i % 3),
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.14,
                    }}
                    className="absolute h-1.5 w-1.5 rounded-full bg-[#8E7AAE]/45 shadow-[0_0_16px_rgba(142,122,174,0.28)]"
                    style={{
                      right: `${8 + ((i * 7) % 82)}%`,
                      top: `${18 + ((i * 11) % 66)}%`,
                    }}
                  />
                ))}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 900 260"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M70 82 C 200 35, 300 185, 440 105 S 620 45, 830 168"
                    fill="none"
                    stroke="rgba(142,122,174,0.15)"
                    strokeWidth="2"
                    strokeDasharray="8 13"
                  />
                  <path
                    d="M95 185 C 250 120, 345 220, 500 145 S 650 84, 840 72"
                    fill="none"
                    stroke="rgba(143,169,199,0.16)"
                    strokeWidth="2"
                    strokeDasharray="5 14"
                  />
                </svg>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 justify-end flex-1">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-[#182231] mb-1 tracking-tight leading-[1.12]">
                    {language === "ar" ? "نسيج الأفكار" : "Idea Fabric"}
                  </h3>
                  <p className="text-[#566276] font-bold text-xs md:text-sm leading-relaxed max-w-xl">
                    {language === "ar"
                      ? "اربط أفكارك وشوف كيف تتقاطع."
                      : "Connect your ideas and see how they intersect."}
                  </p>
                </div>
                <div className="tebyan-fabric-orb w-10 h-10 md:w-11 md:h-11 rounded-[16px] bg-white/82 flex items-center justify-center text-[#6E5F8E] border border-[#8E7AAE]/12 shadow-sm transform group-hover:rotate-1 group-hover:scale-[1.02] transition-transform shrink-0">
                  <Waves className="w-5 h-5 md:w-6 md:h-6 opacity-80" />
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-center gap-2 md:min-w-[110px] bg-white/72 border border-[#8E7AAE]/12 rounded-[16px] md:rounded-[18px] px-3 py-2.5 shadow-sm backdrop-blur-xl">
                <span className="text-[10px] md:text-[11px] text-[#7C8796] font-black uppercase tracking-widest">
                  {language === "ar" ? "افتح النسيج" : "Open fabric"}
                </span>
                <ArrowLeft
                  className={cn(
                    "w-4 h-4 text-[#6E5F8E]",
                    language === "ar"
                      ? "group-hover:-translate-x-1"
                      : "rotate-180 group-hover:translate-x-1",
                    "transition-transform",
                  )}
                />
              </div>
            </motion.button>
          </motion.div>
        </>
      )}
      {/* Gravity of Intent Demonstration */}
    </div>
  );
};
