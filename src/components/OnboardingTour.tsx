import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { cn } from "../lib/utils";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * دليل البداية — «ثلاث ومضات»
 * علامة تبيان تُبنى أمام الزائر خطوة خطوة:
 * القوس (مكان واحد لكل شيء) ← الألِف (الجواب يصعد أولاً) ← النور (يبقى محفوظاً).
 * عند آخر خطوة تكتمل العلامة — واكتمالها هو نهاية الجولة.
 */
const ProgressiveMark = ({ stage }: { stage: number }) => {
  const stroke = "#8E7AAE";
  const gold = "#A68F58";
  const reduce = prefersReducedMotion();
  const drawn = { pathLength: 1, opacity: 1 };
  const hidden = { pathLength: 0, opacity: 0 };
  // Respect prefers-reduced-motion: draw the mark instantly instead of tracing it.
  const draw = (delay: number, duration: number, ease: any) =>
    reduce ? { duration: 0 } : { duration, delay, ease };
  return (
    <svg width={120} height={120} viewBox="0 0 96 96" fill="none" aria-hidden>
      <motion.path
        d="M24 78 V46 C24 30 34 20 48 14 C62 20 72 30 72 46 V78"
        stroke={stroke}
        strokeWidth="4.5"
        strokeLinecap="round"
        initial={hidden}
        animate={stage >= 0 ? drawn : hidden}
        transition={draw(0, 0.8, [0.65, 0, 0.35, 1])}
      />
      <motion.path
        d="M18 78 H78"
        stroke={stroke}
        strokeWidth="4.5"
        strokeLinecap="round"
        initial={hidden}
        animate={stage >= 0 ? drawn : hidden}
        transition={draw(0.5, 0.5, "easeOut")}
      />
      <motion.path
        d="M48 66 V40"
        stroke={gold}
        strokeWidth="4"
        strokeLinecap="round"
        initial={hidden}
        animate={stage >= 1 ? drawn : hidden}
        transition={draw(0, 0.6, "easeOut")}
      />
      <motion.circle
        cx="48"
        cy="31"
        r="5"
        fill={gold}
        initial={{ scale: 0, opacity: 0 }}
        animate={stage >= 2 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
      />
    </svg>
  );
};

export const OnboardingTour = ({ language }: { language: "ar" | "en" }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  const tourKey = user
    ? `tebyan_onboarding_seen_v3_${user.uid}`
    : "tebyan_onboarding_seen_v3_guest";

  const openTour = () => {
    setStep(0);
    setIsOpen(true);
  };

  const markSeen = () => {
    try {
      localStorage.setItem(tourKey, "true");
      localStorage.setItem("tebyan_onboarding_seen_v3", "true");
    } catch {
      /* storage unavailable — ignore */
    }
  };

  const closeTour = () => {
    markSeen();
    setIsOpen(false);
  };

  // Auto-open the guide once for first-time visitors. It fires only when the
  // "seen" key for the current identity (uid or guest) is absent, and never
  // stacks on top of the splash: if the splash is still on screen it waits for
  // the `tebyan_gate_to_search` handover, then lets the interface settle for a
  // beat before the modal arrives. The menu item replays it on demand via the
  // `tebyan_open_onboarding` event.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(tourKey) === "true";
    } catch {
      seen = true; // if storage is blocked, don't nag on every visit
    }
    if (seen) return;

    let timer: number | undefined;
    const schedule = () => {
      if (timer !== undefined) return;
      timer = window.setTimeout(() => openTour(), 900);
    };

    let splashDone = true;
    try {
      splashDone = sessionStorage.getItem("tebyan_splash_seen") === "true";
    } catch {
      /* storage unavailable — assume the splash is not blocking */
    }

    if (splashDone) {
      schedule();
      return () => {
        if (timer !== undefined) window.clearTimeout(timer);
      };
    }

    window.addEventListener("tebyan_gate_to_search", schedule);
    return () => {
      window.removeEventListener("tebyan_gate_to_search", schedule);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [tourKey]);

  useEffect(() => {
    const handler = () => openTour();
    window.addEventListener("tebyan_open_onboarding", handler);
    return () => window.removeEventListener("tebyan_open_onboarding", handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTour();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, tourKey]);

  const steps =
    language === "ar"
      ? [
          {
            title: "مكانٌ واحد لكل ما يشغل بالك",
            body: "اكتب موقفك بكلماتك — سؤال، حيرة، هدف — وتبيان يفتح لك الباب الأنسب. لا تحتاج أن تعرف أسماء الأدوات؛ كلماتك تكفي.",
            hint: "القوس: مشكاة تتسع لكل أسئلتك",
            action: "التالي",
          },
          {
            title: "الجواب يصعد إليك أولاً",
            body: "قبل أي تفاصيل، تصلك خلاصة واضحة وخطوة عملية واحدة. وبعدها — إن أردت — تتعمق في التحليل أو الخطة على راحتك.",
            hint: "الألِف: خيط الجواب الصاعد",
            action: "التالي",
          },
          {
            title: "وكل فهمٍ يبقى نوراً محفوظاً",
            body: "ما تفهمه لا يضيع: يُحفظ في مكتبتك، يترابط مع أفكارك، وتعود إليه متى شئت. تبيان ذاكرة تفكير، لا إجابة عابرة.",
            hint: "النور: اكتملت العلامة — وابتدأت رحلتك",
            action: "ابدأ الآن",
          },
        ]
      : [
          {
            title: "One place for whatever is on your mind",
            body: "Write your situation in your own words — a question, a dilemma, a goal — and Tebyan opens the right door. You never need to know tool names.",
            hint: "The arch: a niche wide enough for every question",
            action: "Next",
          },
          {
            title: "The answer rises to you first",
            body: "Before any detail, you get a clear takeaway and one practical step. Then — only if you want — you go deeper.",
            hint: "The alif: the rising thread of the answer",
            action: "Next",
          },
          {
            title: "And every understanding stays as light",
            body: "What you understand is never lost: it is saved to your library, linked to your ideas, waiting for your return.",
            hint: "The light: the mark is complete — and your journey begins",
            action: "Start now",
          },
        ];

  const current = steps[step];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center bg-[#F7F3EE]/75 backdrop-blur-xl p-4"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-[#8E7AAE]/12 bg-white shadow-[0_30px_90px_rgba(103,88,132,0.16)]"
          >
            <button
              type="button"
              onClick={closeTour}
              className="absolute left-5 top-5 z-10 rounded-full bg-[#F7F3EE] p-2 text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8E7AAE]/30"
              aria-label={language === "ar" ? "إغلاق الدليل" : "Close guide"}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-[5] px-7 pt-10 pb-7 md:px-10 text-center">
              <div className="mb-2 flex justify-center">
                <ProgressiveMark stage={step} />
              </div>
              <p className="mb-6 text-[11px] font-bold tracking-wide text-[#A68F58]">
                {current.hint}
              </p>

              <h2 className="font-serif mb-3 text-2xl md:text-[1.7rem] font-bold leading-snug text-slate-900">
                {current.title}
              </h2>
              <p className="mx-auto max-w-md text-[15px] font-medium leading-8 text-slate-500">
                {current.body}
              </p>

              <div className="mt-8 flex items-center justify-center gap-2">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      i === step ? "w-7 bg-[#8E7AAE]" : "w-2 bg-slate-200",
                    )}
                  />
                ))}
              </div>

              <div className="mt-7 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-center gap-3">
                <button
                  onClick={closeTour}
                  className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  {language === "ar" ? "تخطي" : "Skip"}
                </button>
                <button
                  onClick={() =>
                    step < steps.length - 1 ? setStep(step + 1) : closeTour()
                  }
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#8E7AAE] px-8 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(142,122,174,0.25)] transition hover:bg-[#806D9F] active:scale-[0.98]"
                >
                  {current.action}
                  <ArrowLeft
                    className={cn("h-4 w-4", language !== "ar" && "rotate-180")}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
