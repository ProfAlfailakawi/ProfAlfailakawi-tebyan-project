import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const quotesAr = [
  "في السكون.. تتضح الرؤية",
  "أعمق الأفكار تولد في الصمت",
  "ما تبحث عنه، يبحث عنك",
  "توقف لتنطلق",
  "الوضوح ثمرة التأمل",
  "الفراغ ليس عدمًا.. بل مساحة للاحتمالات",
  "كل عظيم بدأ بلحظة سكون"
];

const quotesEn = [
  "In stillness, vision clears",
  "Deepest thoughts are born in silence",
  "What you seek is seeking you",
  "Pause to accelerate",
  "Clarity is the fruit of contemplation",
  "Void is not nothingness.. it is a space of possibilities",
  "Every greatness began with a moment of stillness"
];

export const WhispersOfTheVoid = ({ isZen, language }: { isZen: boolean, language: 'ar' | 'en' }) => {
  const [quoteIndices, setQuoteIndices] = useState<number[]>([]);
  
  useEffect(() => {
    if (isZen) {
      // Pick 2 random unique quotes
      const quotes = language === 'ar' ? quotesAr : quotesEn;
      const idx1 = Math.floor(Math.random() * quotes.length);
      let idx2 = Math.floor(Math.random() * quotes.length);
      while (idx2 === idx1) idx2 = Math.floor(Math.random() * quotes.length);
      setQuoteIndices([idx1, idx2]);
    } else {
      setQuoteIndices([]);
    }
  }, [isZen, language]);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <AnimatePresence>
        {quoteIndices.map((idx, index) => {
          const quotes = language === 'ar' ? quotesAr : quotesEn;
          // Position them strategically in expected empty spaces
          // Top left/right or bottom left/right
          const isTop = index === 0;
          const isLeft = Math.random() > 0.5;
          const top = isTop ? `${15 + Math.random() * 10}%` : `${75 + Math.random() * 10}%`;
          const left = isLeft ? `${10 + Math.random() * 10}%` : `${70 + Math.random() * 10}%`;

          return (
            <motion.div
              key={`${idx}-${index}`}
              initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
              animate={{ opacity: 0.15, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 1.5 } }}
              transition={{ duration: 4, ease: "easeOut", delay: index * 1.5 }}
              className="absolute font-serif text-2xl md:text-4xl text-zinc-600 tracking-widest text-center"
              style={{ top, left, transform: 'translate(-50%, -50%)', writingMode: isLeft ? 'horizontal-tb' : 'horizontal-tb' }}
            >
              {quotes[idx]}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
