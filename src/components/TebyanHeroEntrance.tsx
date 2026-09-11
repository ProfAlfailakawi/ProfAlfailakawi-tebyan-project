import React from "react";
import { motion } from "motion/react";

/**
 * مدخل سينمائي داخل واجهة الصفحة الرئيسية — «نور في مشكاة».
 * تبدأ نقطة نور صغيرة في المركز، ثم تتحرك حولها نقاط وخيوط دقيقة
 * بانسيابية وتلتئم تدريجياً حتى تكتمل علامة تبيان، فيظهر الاسم،
 * ثم ينكشف صندوق «اسأل تبيان» تحته بهدوء.
 *
 * - يعمل مرة واحدة لكل دخول للصفحة (بلا تكرار أو دوران مستمر).
 * - يحترم prefers-reduced-motion: تُعرض الحالة النهائية مباشرة.
 * - كل الحركة عبر transform/opacity ورسم المسارات (pathLength).
 */

let playedThisPageLoad = false;

/**
 * يُستهلك مرة واحدة لكل تحميل صفحة: يرجع true إذا كان يجب تشغيل
 * المدخل السينمائي الآن، و false عند تكرار الدخول أو تقليل الحركة.
 */
export const consumeHeroEntrancePlay = (): boolean => {
  if (playedThisPageLoad) return false;
  playedThisPageLoad = true;
  const reduce =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return !reduce;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const STROKE = "#8E7AAE";
const GOLD = "#A68F58";

// نقاط تلتئم على هندسة العلامة نفسها (قوس المشكاة، العتبة، الألف).
// إزاحات البداية ثابتة ومحسوبة مسبقاً كي تبقى الحركة هادئة ومتكررة الطابع.
const PARTICLES: Array<{
  x: number;
  y: number;
  dx: number;
  dy: number;
  d: number;
  gold?: boolean;
}> = [
  { x: 24, y: 70, dx: -20, dy: 12, d: 0.22 },
  { x: 24, y: 48, dx: -24, dy: -5, d: 0.3 },
  { x: 30, y: 27, dx: -16, dy: -18, d: 0.38 },
  { x: 48, y: 14, dx: 0, dy: -22, d: 0.44, gold: true },
  { x: 66, y: 27, dx: 16, dy: -18, d: 0.36 },
  { x: 72, y: 48, dx: 24, dy: -5, d: 0.28 },
  { x: 72, y: 70, dx: 20, dy: 12, d: 0.24 },
  { x: 30, y: 78, dx: -12, dy: 18, d: 0.48 },
  { x: 66, y: 78, dx: 12, dy: 18, d: 0.5 },
  { x: 48, y: 58, dx: -7, dy: 16, d: 0.56, gold: true },
  { x: 48, y: 44, dx: 7, dy: -12, d: 0.6, gold: true },
];

export const TebyanHeroEntrance = ({
  play,
  veiled = false,
  className = "",
}: {
  play: boolean;
  /**
   * أثناء الافتتاحية الكاملة «الظلمة والنور» تبقى العلامة والاسم هنا
   * محجوبين؛ فإذا انتهت (أو تُخطّيت) ظهرت العلامة في موضعها فوراً
   * وانبثق الاسم بهدوء — وهو الإيقاع الختامي للافتتاحية.
   */
  veiled?: boolean;
  className?: string;
}) => {
  const draw = (delay: number, dur: number) =>
    play
      ? {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration: dur, delay, ease: EASE },
        }
      : {};

  return (
    <div
      className={
        "flex flex-col items-center gap-3 md:gap-4 mb-4 md:mb-6 " + className
      }
    >
      <svg
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[84px] h-[84px] md:w-[108px] md:h-[108px] overflow-visible"
        style={{ visibility: veiled ? "hidden" : "visible" }}
        role="img"
        aria-label="تبيان — نور في مشكاة"
      >
        {play && (
          <>
            {/* هالة نور خافتة تولد مع النقطة ثم تخفت — لمعان رصين لا أكثر */}
            <g transform="translate(48 48)">
              <motion.circle
                cx={0}
                cy={0}
                r={24}
                fill={GOLD}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 0.12, 0], scale: [0.4, 1.1, 1.28] }}
                transition={{ duration: 1.7, ease: "easeOut" }}
                style={{ filter: "blur(14px)" }}
              />
              {/* خيوط دقيقة تدور بهدوء حول النقطة ثم تتلاشى */}
              {[
                { r: 27, from: -18, c: STROKE },
                { r: 36, from: 14, c: "#8FA9C7" },
              ].map((ring, i) => (
                <motion.circle
                  key={ring.r}
                  cx={0}
                  cy={0}
                  r={ring.r}
                  stroke={ring.c}
                  strokeWidth={0.8}
                  strokeLinecap="round"
                  strokeDasharray="0.5 10.5"
                  initial={{ rotate: ring.from, opacity: 0 }}
                  animate={{ rotate: 0, opacity: [0, 0.4, 0] }}
                  transition={{
                    duration: 1.35,
                    delay: 0.12 + i * 0.1,
                    ease: EASE,
                  }}
                />
              ))}
            </g>
            {/* نقاط دقيقة تنجذب وتلتئم على جسد العلامة قبل أن يكتمل رسمها */}
            {PARTICLES.map((p, i) => (
              <motion.circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={1.5}
                fill={p.gold ? GOLD : STROKE}
                initial={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.5 }}
                animate={{
                  x: [p.dx, 0, 0, 0],
                  y: [p.dy, 0, 0, 0],
                  opacity: [0, 0.85, 0.85, 0],
                  scale: [0.5, 1, 1, 0.4],
                }}
                transition={{
                  duration: 1.15,
                  delay: p.d,
                  times: [0, 0.55, 0.82, 1],
                  ease: EASE,
                }}
              />
            ))}
          </>
        )}
        {/* قوس المشكاة */}
        <motion.path
          d="M24 78 V46 C24 30 34 20 48 14 C62 20 72 30 72 46 V78"
          stroke={STROKE}
          strokeWidth={4.5}
          strokeLinecap="round"
          {...draw(0.7, 0.95)}
        />
        {/* عتبة المشكاة */}
        <motion.path
          d="M18 78 H78"
          stroke={STROKE}
          strokeWidth={4.5}
          strokeLinecap="round"
          {...draw(1.25, 0.5)}
        />
        {/* ألف البيان — خيط النور الصاعد */}
        <motion.path
          d="M48 66 V40"
          stroke={GOLD}
          strokeWidth={4}
          strokeLinecap="round"
          {...draw(1.4, 0.5)}
        />
        {/* نقطة النور: تولد في مركز المشهد ثم تنساب لتستقر في موضعها من العلامة */}
        <motion.circle
          cx={48}
          cy={31}
          r={5}
          fill={GOLD}
          initial={play ? { y: 17, scale: 0.3, opacity: 0 } : undefined}
          animate={
            play
              ? {
                  y: [17, 17, 17, 0],
                  scale: [0.3, 0.72, 0.72, 1],
                  opacity: [0, 1, 1, 1],
                }
              : undefined
          }
          transition={
            play
              ? { duration: 1.95, times: [0, 0.16, 0.76, 1], ease: "easeInOut" }
              : undefined
          }
        />
      </svg>
      {/* الاسم يظهر بعد اكتمال العلامة */}
      <motion.h2
        initial={play ? { opacity: 0, y: 10 } : false}
        animate={veiled ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
        transition={
          play
            ? { delay: 1.85, duration: 0.55, ease: EASE }
            : { duration: 0.55, ease: EASE }
        }
        className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-[#182231]"
        dir="rtl"
      >
        تبيان
      </motion.h2>
    </div>
  );
};

export default TebyanHeroEntrance;
