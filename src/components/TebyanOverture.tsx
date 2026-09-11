import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { consumeHeroEntrancePlay } from "./TebyanHeroEntrance";

/**
 * الافتتاحية الكاملة — «الظلمة والنور».
 * تبدأ الشاشة معتمة بالكامل، فتولد نقطة نور ذهبية في المركز ترسم
 * علامة تبيان كبيرةً مهيبة في العتمة، ثم يتسع النور كالفجر فتنحلّ
 * الظلمة وتنكشف الصفحة من خلاله، وتنساب العلامة إلى موضعها الطبيعي
 * في صدر الواجهة.
 *
 * - تعمل مرة واحدة لكل جلسة متصفح (sessionStorage) — لا تُعاد عند
 *   التنقل داخل الجلسة نفسها.
 * - تحترم prefers-reduced-motion: لا تُركَّب إطلاقاً.
 * - كل الحركة عبر transform/opacity ورسم المسارات (pathLength) فقط.
 * - حين تعمل فهي تحل محل مدخل الواجهة الداخلي (لا تشغيل للمشهدين معاً).
 */

const SESSION_KEY = "tebyan_overture_played";

/**
 * يُستهلك مرة واحدة لكل جلسة: يرجع true إذا كان يجب تشغيل الافتتاحية
 * الآن. حين يرجع true فإنه يستهلك أيضاً مدخل الواجهة الداخلي حتى لا
 * يُعرض المشهدان متتاليين في التحميل نفسه.
 */
export const consumeOverturePlay = (): boolean => {
  if (typeof window === "undefined") return false;
  const reduce =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return false;
  let played = true;
  try {
    played = window.sessionStorage.getItem(SESSION_KEY) === "1";
    if (!played) window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    played = true;
  }
  if (played) return false;
  // الافتتاحية تتضمن ولادة العلامة كاملة — نستهلك مدخل الواجهة الداخلي.
  consumeHeroEntrancePlay();
  return true;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const STROKE = "#8E7AAE";
const GOLD = "#A68F58";
const DARK = "#0B0E15";

type Glide = { x: number; y: number; scale: number } | null;

export const TebyanOverture = ({ onDone }: { onDone: () => void }) => {
  const [dawn, setDawn] = useState(false);
  const [glide, setGlide] = useState<Glide>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    timersRef.current.forEach((t) => window.clearTimeout(t));
    onDone();
  };

  useEffect(() => {
    timersRef.current.push(
      window.setTimeout(() => {
        setDawn(true);
        // نقيس موضع علامة الواجهة الساكنة لتنساب علامتنا الكبيرة إليه.
        const self = markRef.current?.getBoundingClientRect();
        const target = document
          .querySelector(".tebyan-home-hero svg")
          ?.getBoundingClientRect();
        if (self && target && self.width > 0 && target.width > 0) {
          setGlide({
            x: target.left + target.width / 2 - (self.left + self.width / 2),
            y: target.top + target.height / 2 - (self.top + self.height / 2),
            scale: target.width / self.width,
          });
        } else {
          setGlide({ x: 0, y: 0, scale: 0.42 });
        }
      }, 1600),
      window.setTimeout(finish, 3000),
    );
    return () => timersRef.current.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = (delay: number, dur: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: dur, delay, ease: EASE },
  });

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="presentation"
      aria-hidden={false}
    >
      {/* الظلمة: عتمة شبه سوداء عميقة تنحلّ عند بزوغ الفجر */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: DARK }}
        initial={{ opacity: 1 }}
        animate={{ opacity: dawn ? 0 : 1 }}
        transition={{ duration: 1.0, ease: EASE }}
      />
      {/* فجرٌ رصين: تدرّج ذهبي ناعم يتسع من موضع العلامة فيبدد العتمة */}
      <motion.div
        className="absolute left-1/2 top-[42%] pointer-events-none"
        style={{
          width: "160vmax",
          height: "160vmax",
          marginLeft: "-80vmax",
          marginTop: "-80vmax",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(166,143,88,0.30), rgba(166,143,88,0.10) 42%, rgba(166,143,88,0) 70%)",
        }}
        initial={{ scale: 0.06, opacity: 0 }}
        animate={
          dawn
            ? { scale: 1, opacity: [0, 0.55, 0] }
            : { scale: 0.06, opacity: 0 }
        }
        transition={{ duration: 1.25, ease: "easeOut", times: [0, 0.4, 1] }}
      />
      {/* موضع العلامة الكبيرة في قلب العتمة */}
      <div
        className="absolute left-1/2 top-[42%]"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <motion.div
          ref={markRef}
          className="w-[min(52vw,232px)]"
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={
            glide
              ? {
                  x: glide.x,
                  y: glide.y,
                  scale: glide.scale,
                  opacity: glide.scale < 0.05 ? 0 : 1,
                }
              : { x: 0, y: 0, scale: 1, opacity: 1 }
          }
          transition={{ duration: 1.05, delay: 0.15, ease: EASE }}
        >
          <svg
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label="تبيان — نور في مشكاة"
          >
            {/* هالة خافتة تولد مع نقطة النور — سقفها إشراقة فجرٍ ناعمة */}
            <motion.circle
              cx={48}
              cy={48}
              r={26}
              fill={GOLD}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 0.2, 0.08], scale: [0.3, 1.05, 1.2] }}
              transition={{ duration: 1.8, ease: "easeOut", times: [0, 0.45, 1] }}
              style={{ filter: "blur(16px)", transformOrigin: "48px 48px" }}
            />
            {/* قوس المشكاة يُرسم من النور */}
            <motion.path
              d="M24 78 V46 C24 30 34 20 48 14 C62 20 72 30 72 46 V78"
              stroke={STROKE}
              strokeWidth={4.5}
              strokeLinecap="round"
              {...draw(0.5, 0.95)}
            />
            {/* عتبة المشكاة */}
            <motion.path
              d="M18 78 H78"
              stroke={STROKE}
              strokeWidth={4.5}
              strokeLinecap="round"
              {...draw(1.05, 0.5)}
            />
            {/* ألف البيان — خيط النور الصاعد */}
            <motion.path
              d="M48 66 V40"
              stroke={GOLD}
              strokeWidth={4}
              strokeLinecap="round"
              {...draw(1.2, 0.5)}
            />
            {/* نقطة النور: تولد في مركز العتمة ثم تستقر في موضعها */}
            <motion.circle
              cx={48}
              cy={31}
              r={5}
              fill={GOLD}
              initial={{ y: 17, scale: 0.2, opacity: 0 }}
              animate={{
                y: [17, 17, 17, 0],
                scale: [0.2, 0.75, 0.75, 1],
                opacity: [0, 1, 1, 1],
              }}
              transition={{
                duration: 1.7,
                times: [0, 0.18, 0.74, 1],
                ease: "easeInOut",
              }}
            />
          </svg>
        </motion.div>
      </div>
      {/* زر التخطي — أنيق وخافت، يُكمل المشهد فوراً */}
      <motion.button
        type="button"
        onClick={finish}
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: dawn ? 0 : 0.75 }}
        transition={{ duration: 0.5, delay: dawn ? 0 : 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-white/20 px-5 py-1.5 text-[13px] font-bold tracking-wide text-white/80 hover:text-white hover:border-white/40 transition-colors"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
        aria-label="تخطي الافتتاحية"
      >
        تخطي
      </motion.button>
    </div>
  );
};

export default TebyanOverture;
