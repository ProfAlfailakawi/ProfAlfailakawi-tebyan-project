import React from 'react';
import { IS_DEMO_MODE } from '../../lib/demoMode';

/**
 * أمثلة جاهزة للضغط — تظهر في وضع العرض فقط.
 *
 * شاشات الذكاء الاصطناعي تبدأ نموذجًا فارغًا، ومن يُعرض عليه المنتج لا يعرف ماذا
 * يكتب. هذه الشرائح تملأ الحقل بسؤالٍ من قصة الأسرة النموذجية (سعود ونورة) بضغطة
 * واحدة، فيرى النتيجة فورًا. خارج العرض لا تُرسَم شيئًا.
 */
export type DemoStartersTab = 'oracle' | 'concepts' | 'mindmap' | 'quiz' | 'council' | 'roadmap' | 'simulation';

const AR: Record<DemoStartersTab, string[]> = {
  oracle: ['كيف أقلل وقت الشاشة لسعود دون صراخ؟', 'كيف أنظم وقت الدراسة لنورة بعد العصر؟', 'ابني يغضب بسرعة عند الخسارة'],
  concepts: ['التعزيز الإيجابي', 'الذكاء العاطفي عند الأطفال', 'الحدود الصحية في التربية'],
  mindmap: ['العناد عند الأطفال', 'تنظيم وقت الدراسة', 'تعزيز الثقة بالنفس'],
  quiz: ['التعامل مع نوبات الغضب', 'بناء روتين يومي هادئ', 'وقت الشاشة'],
  council: ['سعود يرفض إغلاق الجهاز كل مساء', 'نورة تؤجل واجباتها حتى الليل'],
  roadmap: ['تنظيم وقت الشاشات في الأسرة خلال ستة أسابيع', 'بناء عادة قراءة مسائية مع نورة'],
  simulation: ['سعود يرفض ترك اللعبة وقت العشاء', 'نورة تبكي قبل الاختبار'],
};
const EN: Record<DemoStartersTab, string[]> = {
  oracle: ['How can I reduce Saud\'s screen time without shouting?', 'How do I organise Noura\'s study time after school?', 'My son gets angry quickly when he loses'],
  concepts: ['Positive reinforcement', 'Emotional intelligence in children', 'Healthy boundaries in parenting'],
  mindmap: ['Stubbornness in children', 'Organising study time', 'Building self-confidence'],
  quiz: ['Handling tantrums', 'Building a calm daily routine', 'Screen time'],
  council: ['Saud refuses to turn off the device every evening', 'Noura postpones homework until night'],
  roadmap: ['Organise family screen time over six weeks', 'Build an evening reading habit with Noura'],
  simulation: ['Saud refuses to leave the game at dinner', 'Noura cries before the exam'],
};

export function DemoStarters({ tab, language, onPick, className = '' }: { tab: DemoStartersTab; language: 'ar' | 'en' | string; onPick: (text: string) => void; className?: string }) {
  if (!IS_DEMO_MODE) return null;
  const ar = language === 'ar';
  const items = (ar ? AR : EN)[tab];
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} data-demo-starters>
      <span className="text-xs font-bold text-ink-mute shrink-0">{ar ? 'جرّب مثالًا:' : 'Try an example:'}</span>
      {items.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onPick(text)}
          className="max-w-full rounded-full border border-lilac/20 bg-ivory px-3.5 py-1.5 text-start text-[13px] font-semibold leading-snug text-[#4B3F6B] transition-colors hover:border-lilac/45 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-lilac/40"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
