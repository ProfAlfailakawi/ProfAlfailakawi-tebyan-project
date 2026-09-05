import React from "react";
import { motion } from "motion/react";

/**
 * علامة تبيان — «نور في مشكاة»
 * قوس مشكاة يحتضن نقطة نور يصعد منها خيط ضوء (ألِف البيان).
 * تُرسم بخط واحد هادئ؛ بنفسجي تبيان للقوس، وذهب هادئ للنور.
 */
export const TebyanMark = ({
  size = 96,
  animated = false,
  className = "",
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) => {
  const stroke = "#8E7AAE";
  const gold = "#A68F58";
  // Under prefers-reduced-motion, render the completed mark statically —
  // never a blank or half-drawn glyph.
  const reduce =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const active = animated && !reduce;
  const draw = active
    ? {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
      }
    : {};
  const drawTransition = (delay: number) =>
    active
      ? { duration: 0.9, delay, ease: [0.65, 0, 0.35, 1] as const }
      : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="تبيان"
    >
      {/* قوس المشكاة */}
      <motion.path
        d="M24 78 V46 C24 30 34 20 48 14 C62 20 72 30 72 46 V78"
        stroke={stroke}
        strokeWidth="4.5"
        strokeLinecap="round"
        {...draw}
        transition={drawTransition(0)}
      />
      {/* عتبة المشكاة */}
      <motion.path
        d="M18 78 H78"
        stroke={stroke}
        strokeWidth="4.5"
        strokeLinecap="round"
        {...draw}
        transition={drawTransition(0.55)}
      />
      {/* ألِف البيان — خيط النور الصاعد */}
      <motion.path
        d="M48 66 V40"
        stroke={gold}
        strokeWidth="4"
        strokeLinecap="round"
        {...draw}
        transition={drawTransition(0.8)}
      />
      {/* نقطة النور */}
      <motion.circle
        cx="48"
        cy="31"
        r="5"
        fill={gold}
        initial={active ? { scale: 0, opacity: 0 } : undefined}
        animate={active ? { scale: 1, opacity: 1 } : undefined}
        transition={
          active
            ? { duration: 0.45, delay: 1.15, ease: "easeOut" }
            : undefined
        }
      />
    </svg>
  );
};

export default TebyanMark;
