import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Fingerprint, Landmark, AudioLines, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  query: string;
  language: 'ar' | 'en';
}

export const AdvancedCognitiveAnalysis: React.FC<Props> = ({ query, language }) => {
  const q = query.trim().toLowerCase();

  const subtext = useMemo(() => {
    if (q.includes('مدير') || q.includes('زميل') || q.includes('موظف') || q.includes('شخص') || q.includes('عنيد')) {
      return language === 'ar' 
        ? "في كلماتك نبرة 'فقدان سيطرة' وليست مجرد مشكلة أداء.. هل تشعر أن سلطتك أو صورتك مهددة؟"
        : "There is an undertone of 'loss of control' in your words, not just a performance issue. Do you feel your authority is threatened?";
    }
    if (q.includes('خسارة') || q.includes('فلوس') || q.includes('فشل') || q.includes('يأس') || q.includes('مشكلة كبيرة')) {
      return language === 'ar'
        ? "تتردد كلمات الخسارة واليأس.. قد يكون الخوف الحقيقي ليس من خسارة الموقف ذاته، بل من اهتزاز استقرارك الداخلي وتطلعاتك."
        : "Words of loss and despair echo here. The real fear might not be the loss itself, but the shaking of your internal stability.";
    }
    if (q.includes('حيرة') || q.includes('تعبت') || q.includes('قرار') || q.includes('خيارين')) {
      return language === 'ar'
        ? "هناك إرهاق ذهني مسكوت عنه، ربما أنت تبحث عن 'إذن' للراحة أو الانسحاب المؤقت، وليس قراراً جديداً تنفذه الآن."
        : "There is an unspoken mental exhaustion. Perhaps you are looking for 'permission' to rest, rather than a new decision to execute.";
    }
    return language === 'ar' 
      ? "تتركيزك ينصب حول الأعراض السطحية، بينما الجذر الخفي يتعلق غالباً بتوقع عميق لم تحسن إدارته بعد."
      : "You are focusing on surface symptoms, while the hidden root is likely an unmanaged deep expectation.";
  }, [q, language]);


  const masterclass = useMemo(() => {
    if (q.includes('عمل') || q.includes('مشروع') || q.includes('مؤسسة')) {
      return {
        figure: language === 'ar' ? "ابن خلدون" : "Ibn Khaldun",
        role: language === 'ar' ? "فيلسوف وعالم اجتماع" : "Philosopher & Sociologist",
        quote: language === 'ar' 
          ? `لو كنت مكانك، وفي ضوء نظريتي في العمران، سأرى أن مشكلتك هي نتيجة طبيعية لمرور كيانك بمرحلة "الهرم". لا تقاوم التغيير، بل أسس دورة حياة جديدة.`
          : `If I were in your place, this is a natural phase of your institution's life cycle. Do not resist, but prepare for a new dawn.`
      };
    }
    if (q.includes('خصم') || q.includes('منافس') || q.includes('صراع') || q.includes('عدو')) {
      return {
        figure: language === 'ar' ? "صن تزو" : "Sun Tzu",
        role: language === 'ar' ? "استراتيجي عسكري" : "Military Strategist",
        quote: language === 'ar'
          ? "الانتصار الأعظم لك في هذا الموقف هو أن لا تضطر للقتال أبداً. أعد ترتيب ساحتك بحيث يفقد خصمك مبرر الهجوم."
          : "The supreme art of war is to subdue the enemy without fighting. Rearrange your battlefield."
      };
    }
    if (q.includes('قرار') || q.includes('حيرة') || q.includes('استقالة') || q.includes('طريق')) {
      return {
        figure: language === 'ar' ? "سقراط" : "Socrates",
        role: language === 'ar' ? "فيلسوف" : "Philosopher",
        quote: language === 'ar'
          ? "سأسألك يا صديقي: إذا اخترت الخيار الأسهل ونجح، ماذا ستفقد؟ الجواب المخبأ هناك هو بالضبط ما يخيفك ويشل تفكيرك الآن."
          : "Let me ask you: if you take the easy path and it works, what will you lose? The hidden answer is what paralyzes you."
      };
    }
    return {
      figure: language === 'ar' ? "ستيف جوبز" : "Steve Jobs",
      role: language === 'ar' ? "مبتكر ورائد أعمال" : "Innovator & Entrepreneur",
      quote: language === 'ar'
        ? "لو افترضنا أن هذه الضوضاء اختفت، ما هو أول شيء ستبنيه بشغف؟ ابدأ به الآن ودع الباقي يتساقط من تلقاء نفسه."
        : "If this noise just disappeared, what is the first thing you would build? Start doing that now, and let the rest fall away."
    };
  }, [q, language]);


  const isDissonant = q.includes('لكن') || q.includes('بس') || q.includes('تعب') || q.includes('صعب') || q.length > 50;

  return (
    <div className="space-y-4 md:space-y-6 mt-12 w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2 px-2">
         <Sparkles className="w-4 h-4 text-amber-500" />
         <span className="font-black text-xs text-zinc-400 uppercase tracking-widest">
           {language === 'ar' ? 'التحليل الاستراتيجي العميق (Beta)' : 'DEEP COGNITIVE ANALYSIS (Beta)'}
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Subtext Microscope */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-[28px] p-6 text-right relative overflow-hidden group shadow-lg"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bgGradient opacity-10 blur-2xl rounded-full" />
          <div className="flex items-center gap-3 mb-4 justify-end">
            <h4 className="text-white font-black text-sm">{language === 'ar' ? 'مجهر النوايا الخفية' : 'Subtext Microscope'}</h4>
            <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <p className="text-zinc-400 font-bold text-xs md:text-sm leading-[1.8] relative z-10">
            {subtext}
          </p>
        </motion.div>

        {/* 2. Cognitive Symphony */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-black border border-zinc-800 rounded-[28px] p-6 text-right relative overflow-hidden group shadow-lg flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-end gap-1 px-4 h-6 opacity-80" dir="ltr">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: isDissonant ? ['20%', '100%', '10%', '80%', '20%'] : ['40%', '60%', '40%']
                    }}
                    transition={{
                      duration: isDissonant ? 0.5 + Math.random() : 1.5,
                      repeat: Infinity,
                      ease: isDissonant ? "circInOut" : "easeInOut",
                    }}
                    className={cn(
                      "w-1 md:w-1.5 rounded-full content-center",
                      isDissonant ? "bg-orange-500" : "bg-emerald-500"
                    )}
                  />
                ))}
             </div>
             <div className="flex items-center gap-3 justify-end">
                <h4 className="text-white font-black text-sm">{language === 'ar' ? 'الإيقاع الذهني' : 'Cognitive Symphony'}</h4>
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700">
                  <AudioLines className="w-4 h-4" />
                </div>
            </div>
          </div>
          
          <p className="text-zinc-400 font-bold text-xs md:text-sm leading-[1.8]">
            {isDissonant 
              ? (language === 'ar' ? "إيقاع أفكارك متناقض وعالٍ؛ أنت تقاتل في عدة جبهات في نفس الوقت. نحتاج لتوحيد التركيز." : "Dissonant thought rhythm. You are fighting multiple battles. Needs unification.")
              : (language === 'ar' ? "إيقاع أفكارك متناغم ومنطقي. تفكيرك يسير بخطى تصاعدية ثابتة نحو الحل." : "Harmonious rhythm. Your thoughts are converging steadily toward a solution.")}
          </p>
        </motion.div>
      </div>

      {/* 3. The Personalized Masterclass */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="w-full bg-gradient-to-br from-zinc-50 to-white border border-zinc-200 rounded-[28px] p-6 text-right relative overflow-hidden shadow-sm"
      >
         <div className="flex flex-col md:flex-row items-center md:items-start justify-end md:justify-between gap-4 md:gap-0">
           <div className="md:w-2/3 text-center md:text-right order-2 md:order-1">
             <div className="w-10 h-10 mx-auto md:ml-auto md:mr-0 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 mb-3">
                <Landmark className="w-5 h-5" />
             </div>
             <p className="text-zinc-700 font-black text-sm md:text-base leading-[1.8] italic mb-3">
               "{masterclass.quote}"
             </p>
             <h4 className="text-black font-black text-xs md:text-sm">{masterclass.figure}</h4>
             <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest">{masterclass.role}</span>
           </div>
           
           <div className="border border-zinc-100 bg-white rounded-[20px] px-4 py-2 flex items-center justify-center order-1 md:order-2 shadow-sm">
             <span className="font-black text-xs text-zinc-400 tracking-widest uppercase">{language === 'ar' ? 'حوار العظماء' : 'MASTERCLASS'}</span>
           </div>
         </div>
      </motion.div>

      {/* 4. Wisdom Constellation */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-[28px] p-6 text-right relative overflow-hidden text-white"
      >
         <div className="absolute inset-0 opacity-20 pointer-events-none">
            {/* Simple abstract stars */}
            <div className="absolute top-4 left-10 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_2px_#fff]" />
            <div className="absolute top-12 left-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_10px_2px_#60a5fa]" />
            <div className="absolute bottom-6 left-1/3 w-1 h-1 bg-white rounded-full" />
            <div className="absolute top-8 right-20 w-1 h-1 bg-amber-300 rounded-full shadow-[0_0_8px_#fcd34d]" />
            <div className="absolute bottom-10 right-1/4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_#fff]" />
            <svg className="absolute inset-0 w-full h-full stroke-white/10" fill="none">
              <path d="M 40,16 L 25%,48 L 33%,80" />
              <path d="M 25%,48 L 75%,90 L 80%,32" />
            </svg>
         </div>
         
         <div className="relative z-10">
           <div className="flex items-center gap-3 justify-end mb-4">
              <h4 className="font-black text-sm">{language === 'ar' ? 'كوكب الوعي الجمعي' : 'Wisdom Constellation'}</h4>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
           </div>
           <p className="text-zinc-300 font-bold text-xs md:text-sm leading-[1.8] max-w-2xl ml-auto">
             {language === 'ar' 
               ? "تضيء مساراتنا الذكية اتصالاً خفياً بينك وبين 124 قائداً واجهوا هذا النمط الذهني ذاته. الخلاصة الجمعية لهم: الانسحاب التكتيكي الآن أذكى بكثير من استنزاف الخيارات العشوائية."
               : "Our paths highlight a connection between you and 124 leaders who faced this exact cognitive pattern. Their collective wisdom: A tactical retreat now is much smarter than exhausting random options."}
           </p>
         </div>
      </motion.div>
    </div>
  );
};
