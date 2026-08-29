import React from "react";
import { motion } from "motion/react";
import { WifiOff, ShieldCheck } from "lucide-react";

export const OfflineNotice = ({ language }: { language: "ar" | "en" }) => (
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
