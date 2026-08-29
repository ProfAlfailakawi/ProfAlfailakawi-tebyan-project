import React from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export const SessionRestoreLoader = ({
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
