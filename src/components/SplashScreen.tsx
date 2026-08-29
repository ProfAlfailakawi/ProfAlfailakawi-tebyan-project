import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Globe, Sparkles } from "lucide-react";

export const SplashScreen = ({
  onFinish,
  language,
}: {
  onFinish: () => void;
  language: "ar" | "en";
}) => {
  const quotes =
    language === "ar"
      ? [
          "نفتح بوابة الفهم…",
          "نرتّب الفكرة بهدوء…",
          "تبيان يهيّئ مساحة القرار…",
          "كل سؤال جيد يبدأ من هدوء صغير…",
        ]
      : [
          "Opening the gate of understanding…",
          "Arranging the idea calmly…",
          "Tebyan is preparing your decision space…",
          "Every good question begins with a quiet moment…",
        ];

  const [randomQuote] = useState(
    () => quotes[Math.floor(Math.random() * quotes.length)],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem("tebyan_gate_to_search", "true");
        window.dispatchEvent(new CustomEvent("tebyan_gate_to_search"));
      } catch (e) {}
      onFinish();
    }, 550);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        filter: "blur(12px)",
        transition: { duration: 0.75, ease: "easeInOut" },
      }}
      className="fixed inset-0 z-[99999] bg-[#F8F5EF] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.13, 1], opacity: [0.18, 0.3, 0.18] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[14%] w-[520px] h-[520px] bg-[#C9BEDF] rounded-full blur-[145px]"
        />
        <motion.div
          animate={{ scale: [1, 1.17, 1], opacity: [0.14, 0.24, 0.14] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.7,
          }}
          className="absolute bottom-[6%] left-[10%] w-[430px] h-[430px] bg-[#B9D0E7] rounded-full blur-[135px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(142,122,174,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(143,169,199,0.055)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(circle_at_center,#000_0%,transparent_72%)]" />
      </div>

      <div className="relative flex flex-col items-center gap-7 px-6 text-center">
        <motion.div
          initial={{ scale: 0.88, opacity: 0, rotate: -2 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative h-36 w-36 md:h-44 md:w-44 flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-[#8E7AAE]/28"
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-28 w-28 md:h-36 md:w-36 rounded-full bg-white/72 border border-white shadow-[0_28px_80px_rgba(103,88,132,0.18)]"
          />
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-[2rem] bg-[#FBFAF7] border border-[#E8E0F0] text-[#8E7AAE] shadow-inner"
          >
            <Globe className="w-10 h-10 md:w-12 md:h-12" />
            <Sparkles className="absolute -top-1 -left-1 h-4 w-4 text-[#A68F58]" />
          </motion.div>
        </motion.div>

        <div className="space-y-3">
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-[11px] font-black tracking-[0.35em] text-[#8E7AAE]/70 uppercase"
          >
            {language === "ar" ? "مختبر فكر هادئ" : "Quiet thinking lab"}
          </motion.p>
          <motion.h1
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.75 }}
            className="text-4xl md:text-5xl font-black text-[#182231] tracking-tighter"
          >
            تبيان
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.75 }}
            className="text-[#7C8796] font-black flex items-center justify-center gap-2 leading-relaxed"
          >
            {randomQuote}
          </motion.p>
        </div>

        <div
          className="mt-5 flex items-center gap-2"
          aria-label={language === "ar" ? "جاري التحميل" : "Loading"}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.22, 1, 0.22], scale: [0.86, 1.08, 0.86] }}
              transition={{
                duration: 1.45,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="h-2.5 w-2.5 rounded-full bg-[#8E7AAE]/70"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
