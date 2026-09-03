import React from "react";
import { motion } from "motion/react";
import type { ElementType } from "react";

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
  children: React.ReactNode;
}) => {
  const ar = language === "ar";
  const current = modes.find((m) => m.id === activeMode) ?? modes[0];

  return (
    <div className="w-full" dir={ar ? "rtl" : "ltr"}>
      <header className="max-w-3xl mx-auto px-4 pt-2 pb-1 text-center">
        <h1 className="font-serif text-[1.6rem] md:text-3xl font-bold text-[#182231] tracking-tight">
          {ar ? titleAr : titleEn}
        </h1>
        <p className="mt-1 text-[13px] md:text-sm text-[#64788D] font-medium">
          {ar ? subtitleAr : subtitleEn}
        </p>
      </header>

      {modes.length > 1 && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div
            className="flex gap-2 overflow-x-auto pb-1 justify-start md:justify-center"
            role="tablist"
            aria-label={ar ? "أنماط الباب" : "Door modes"}
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
                    "shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all border " +
                    (on
                      ? "bg-[#8E7AAE] border-[#8E7AAE] text-white shadow-[0_8px_20px_rgba(142,122,174,0.28)]"
                      : "bg-white/80 border-[#E5DFD4] text-[#64788D] hover:border-[#8E7AAE]/50 hover:text-[#5E4D7A]")
                  }
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {ar ? m.labelAr : m.labelEn}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11.5px] text-[#8E7AAE] font-medium">
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
