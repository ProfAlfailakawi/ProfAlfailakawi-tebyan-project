import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { ElementType } from "react";
import { DnaStepper } from "../dna/DnaKit";

/**
 * غلاف الأبواب — إطار موحد لأبواب تبيان المدمجة.
 * باب واحد، عنوان واحد بخط أميري، وأنماط تُختار بشرائح هادئة.
 * الخدمات القديمة تعيش داخله كما هي، بلا أي تعديل عليها.
 */
export type DoorMode = {
  id: string;
  labelAr: string;
  labelEn: string;
  hintAr: string;
  hintEn: string;
  icon?: ElementType;
};

export const DoorShell = ({
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  modes,
  activeMode,
  onModeChange,
  language,
  emphasis,
  stations,
  children,
}: {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  modes: DoorMode[];
  activeMode: string;
  onModeChange: (id: string) => void;
  language: "ar" | "en";
  /** Slightly larger step chips and hint: for doors whose chips read as a numbered journey. */
  emphasis?: boolean;
  /**
   * Draw the numbered modes as stations above the hint. The modes are tabs, not progress:
   * the selected one is "current", the others stay neutral (never "done").
   */
  stations?: boolean;
  children: React.ReactNode;
}) => {
  const ar = language === "ar";
  const current = modes.find((m) => m.id === activeMode) ?? modes[0];

  // الصف قابل للتمرير الأفقي: يظهر تلاشٍ عند الحافة التي يوجد خلفها مزيد من الشرائح.
  const tabsRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ start: false, end: false });
  const measure = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 2) {
      setFade((f) => (f.start || f.end ? { start: false, end: false } : f));
      return;
    }
    const rtl = getComputedStyle(el).direction === "rtl";
    const pos = rtl ? -el.scrollLeft : el.scrollLeft; // المسافة المقطوعة من بداية الصف
    const next = { start: pos > 2, end: pos < max - 2 };
    setFade((f) => (f.start === next.start && f.end === next.end ? f : next));
  }, []);
  useEffect(() => {
    measure();
    const el = tabsRef.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure, modes.length, language]);
  const FADE = "28px";
  const rtlDir = ar;
  // "start" هو الجهة التي يبدأ منها الصف (يمين في العربية)
  const left = rtlDir ? fade.end : fade.start;
  const right = rtlDir ? fade.start : fade.end;
  const mask =
    left || right
      ? `linear-gradient(to right, ${left ? `transparent 0, #000 ${FADE}` : "#000 0"}, ${right ? `#000 calc(100% - ${FADE}), transparent 100%` : "#000 100%"})`
      : undefined;

  return (
    <div className="w-full" dir={ar ? "rtl" : "ltr"}>
      <header className="max-w-3xl mx-auto px-4 pt-2 pb-1 text-center">
        <h1 className="font-serif text-[1.6rem] md:text-3xl font-bold text-navy tracking-tight">
          {ar ? titleAr : titleEn}
        </h1>
        <p className="mt-1 text-sm md:text-base text-ink-soft font-medium">
          {ar ? subtitleAr : subtitleEn}
        </p>
      </header>

      {modes.length > 1 && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div
            ref={tabsRef}
            style={mask ? { WebkitMaskImage: mask, maskImage: mask } : undefined}
            className={"flex gap-2 overflow-x-auto pb-1 justify-start md:justify-center" + (modes.length <= 3 ? " tebyan-door-tabs max-sm:-mx-3 max-sm:!w-[calc(100%+1.5rem)] max-sm:!max-w-none" : "")}
            role="tablist"
            aria-label={ar ? "اختر الأسلوب" : "Choose a style"}
          >
            {modes.map((m) => {
              const Icon = m.icon;
              const on = m.id === current.id;
              return (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => onModeChange(m.id)}
                  className={
                    (emphasis
                      ? "shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold transition-all border "
                      : "shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-all border ") +
                    (modes.length <= 3 ? "max-md:grow max-md:justify-center max-md:whitespace-nowrap " : "") +
                    (on
                      ? "bg-[#8E7AAE] border-[#8E7AAE] text-white shadow-[0_8px_20px_rgba(142,122,174,0.28)]"
                      : "bg-white/80 border-[#E5DFD4] text-ink-soft hover:border-[#8E7AAE]/50 hover:text-[#5E4D7A]")
                  }
                >
                  {Icon && <Icon className={emphasis ? "w-4 h-4" : "w-3.5 h-3.5"} />}
                  {ar ? m.labelAr : m.labelEn}
                </button>
              );
            })}
          </div>
          {stations && modes.length > 1 && modes.length <= 6 && (
            // decorative echo of the tabs above (they stay the accessible control)
            <div aria-hidden="true" className="mx-auto mt-3 max-w-sm">
              <DnaStepper
                size="sm"
                journey
                steps={modes.map((m) => ({
                  key: m.id,
                  label: (ar ? m.labelAr : m.labelEn).replace(/^\s*\d+\s*[·.\-]\s*/, ""),
                  state: m.id === current.id ? "current" : "pending",
                }))}
              />
            </div>
          )}
          <p className={"mt-3 text-center text-lilac font-semibold " + (emphasis ? "text-[14px]" : "text-[13px]")}>
            {ar ? current.hintAr : current.hintEn}
          </p>
        </div>
      )}

      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mt-2"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default DoorShell;
