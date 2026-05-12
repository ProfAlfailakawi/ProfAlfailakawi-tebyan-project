import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Landmark, AudioLines, Sparkles, TrendingUp, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { proxyGenerateContent } from '../lib/aiProxy';

interface Props {
  query: string;
  language: 'ar' | 'en';
}

const SectionBox = ({ 
  titleAr, titleEn, descAr, descEn, 
  icon: Icon, language, query, 
  systemPromptAr, systemPromptEn, colorClass
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset if query changes drastically or to reset state
  useEffect(() => {
    setIsOpen(false);
    setContent(null);
  }, [query]);

  const handleToggle = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    
    if (nextOpen && !content && !loading) {
       setLoading(true);
       try {
         const prompt = language === 'ar' ? systemPromptAr : systemPromptEn;
         const res = await proxyGenerateContent({
           model: "gemini-3-flash-preview",
           contents: [{ role: 'user', parts: [{ text: `المشكلة/السؤال: ${query}` }] }],
           config: { systemInstruction: prompt, temperature: 0.7 }
         });
         setContent(res.text);
       } catch (e) {
         setContent(language === 'ar' ? 'فشل التحليل، يرجى المحاولة لاحقاً.' : 'Analysis failed, try again later.');
       } finally {
         setLoading(false);
       }
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-[24px] overflow-hidden transition-all shadow-sm">
       <button type="button" onClick={handleToggle} className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors text-right">
          <div className="flex items-center gap-4">
             <div className={cn("w-10 h-10 shrink-0 mx-auto rounded-xl flex items-center justify-center border", colorClass)}>
                <Icon className="w-5 h-5" />
             </div>
             <div>
                <h4 className="font-black text-zinc-900 text-sm md:text-base">{language === 'ar' ? titleAr : titleEn}</h4>
                <p className="text-zinc-500 text-xs mt-0.5">{language === 'ar' ? descAr : descEn}</p>
             </div>
          </div>
          <div className="shrink-0 p-2">
            <ChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform duration-300", isOpen && "rotate-180")} />
          </div>
       </button>
       <AnimatePresence>
          {isOpen && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }} 
               animate={{ height: 'auto', opacity: 1 }} 
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden border-t border-zinc-100"
             >
                <div className="p-5 md:p-6 bg-zinc-50/50">
                   {loading ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-3 text-zinc-400">
                         <Loader2 className="w-6 h-6 animate-spin text-mood-primary" />
                         <span className="text-xs font-bold tracking-widest">{language === 'ar' ? 'جاري التحليل العميق...' : 'ANALYZING DEEPLY...'}</span>
                      </div>
                   ) : (
                      <div className="text-sm text-zinc-700 leading-[1.8] font-medium md:text-base whitespace-pre-wrap" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                         {content}
                      </div>
                   )}
                </div>
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export const AdvancedCognitiveAnalysis: React.FC<Props> = ({ query, language }) => {
  if (!query || query.length < 10) return null; // Avoid showing on empty/short queries

  return (
    <div className="space-y-4 md:space-y-4 mt-8 w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2 px-2">
         <Sparkles className="w-4 h-4 text-amber-500" />
         <span className="font-black text-xs text-zinc-400 uppercase tracking-widest">
           {language === 'ar' ? 'التحليل الاستراتيجي العميق' : 'DEEP COGNITIVE ANALYSIS'}
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <SectionBox
          titleAr="مجهر النوايا الخفية"
          titleEn="Subtext Microscope"
          descAr="يحلل ما وراء الكلمات والمعنى غير المباشر"
          descEn="Analyzes hidden meanings and subtext"
          icon={Fingerprint}
          colorClass="bg-red-50 text-red-500 border-red-100"
          language={language}
          query={query}
          systemPromptAr="أنت محلل نفسي ودافعي. اقرأ هذا السؤال وحلل 'النية الخفية' والمشاعر غير المعلنة وما وراء الكلمات التي لم يقلها المستخدم بصراحة، بناءً على سياق المشكلة. اكتب فقرة واحدة وملهمة ومباشرة بدون مقدمات، ركز بأسلوب المخاطب."
          systemPromptEn="You are a psychoanalyst. Read the question and analyze the 'hidden intent', unspoken feelings, and what lies beneath the surface. Write one clear, inspiring paragraph addressing the user."
        />

        <SectionBox
          titleAr="الإيقاع الذهني"
          titleEn="Cognitive Symphony"
          descAr="يكشف نمط التفكير الداخلي خلف السؤال"
          descEn="Reveals your internal thinking pattern"
          icon={AudioLines}
          colorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
          language={language}
          query={query}
          systemPromptAr="أنت خبير في الأنماط المعرفية. استنتج النمط الذهني الذي يمر به صاحب السؤال (مثلا: يغلب عليه التردد، الاندفاع، قلق التفاصيل، أو التفكير الدائري المفرط) وكيف يؤثر هذا النمط على اتخاذه للقرار في هذه المشكلة. فقرة واحدة عميقة ومختصرة بأسلوب المخاطب."
          systemPromptEn="You are a cognitive expert. Deduce the mental pattern of the questioner (e.g., hesitation, impulsivity, circular thinking) and explain how it affects their decision. One short, deep paragraph addressing the user."
        />

        <SectionBox
          titleAr="حوار العظماء"
          titleEn="Masterclass"
          descAr="يعرض الفكرة كحوار أو اقتباس من عقول مختلفة"
          descEn="Presents the idea through the minds of great thinkers"
          icon={Landmark}
          colorClass="bg-amber-50 text-amber-600 border-amber-100"
          language={language}
          query={query}
          systemPromptAr="اختر شخصية تاريخية أو مفكراً عظيماً (مثل سقراط، ابن خلدون، ستيف جوبز، صن تزو، الخ) يكون موقفه متناسباً مع هذا التحدي. اكتب اقتباساً عميقاً جداً على لسانه يخاطب فيه المستخدم بخصوص هذه المشكلة، وضع اسم الشخصية ووظيفتها في السطر الأول المنسق بوضوح، ثم الاقتباس تحته."
          systemPromptEn="Choose a great historical figure whose philosophy suits this challenge. Write a profound quote as if they are advising the user. Put their name and role on the first line, and the quote below it."
        />

        <SectionBox
          titleAr="كوكب الوعي الجمعي"
          titleEn="Wisdom Constellation"
          descAr="يرى الفكرة من منظور المجتمع والناس"
          descEn="Views the challenge from a social perspective"
          icon={TrendingUp}
          colorClass="bg-blue-50 text-blue-500 border-blue-100"
          language={language}
          query={query}
          systemPromptAr="أنت عالم اجتماع تحلل المشاكل من زاوية الديناميات الجماعية. كيف ستؤثر هذه المشكلة أو القرار على محيط المستخدم (عائلته، فريقه، مجتمعه)؟ وما هي النظرة الاجتماعية الأوسع لهذا التحدي؟ اكتب فقرة واحدة واضحة وبناءة تفتح آفاق تفكيره لعواقب قرارته اجتماعياً."
          systemPromptEn="You are a sociologist analyzing from a group dynamics perspective. How will this problem/decision affect the user's surroundings? Provide a concise, insightful paragraph opening their mind to social consequences."
        />
      </div>
    </div>
  );
};
