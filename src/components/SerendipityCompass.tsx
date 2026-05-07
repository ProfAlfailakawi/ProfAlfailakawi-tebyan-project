import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Sparkles, X, Shuffle } from 'lucide-react';
import { universalOracle } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

export const SerendipityCompass = ({ language = 'ar', contextTopic }: { language?: string, contextTopic?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serendipityPath, setSerendipityPath] = useState('');

  const exploreTheUnknown = async () => {
    setIsLoading(true);
    setSerendipityPath('');
    try {
        const topic = contextTopic || "المعرفة العامة";
        const prompt = language === 'ar' 
        ? `أنت بوصلة التيه. المستخدم يقرأ أو يفكر في "${topic}". 
           مهمتك هي البحث عن أبعد نقطة ممكنة ومستحيلة عن هذا الموضوع في شبكة المعرفة والوجود الإنساني، ثم كتابة مقال قصير جداً (3-4 فقرات) يربط بين الموضوعين بطريقة فلسفية وعلمية مدهشة تقشعر لها الأبدان! 
           لا تستخدم أي مقدمات، فقط ابدأ بالصدمة والربط المباشر المذهل.`
        : `You are the Serendipity Compass. The user is currently reading about "${topic}".
           Your task is to find the absolute furthest and most impossibly unrelated topic in human knowledge, and write a very short piece (3-4 paragraphs) that bridges them together in a mind-blowing, philosophical and scientific way! No intros, just pure shock and awe.`;

        const response = await universalOracle(prompt, 'Serendipity Explorer', language);
        setSerendipityPath(response);
    } catch (e) {
        setSerendipityPath(
            language === 'ar' 
            ? "ضعت في الفراغ. يرجى الضغط مرة أخرى للمحاولة." 
            : "Lost in the void. Please click again to retry."
        );
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => {
            setIsOpen(true);
            if (!serendipityPath && !isLoading) exploreTheUnknown();
        }}
        className="fixed bottom-40 left-4 md:left-6 z-40 bg-zinc-900 border border-zinc-700 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all group overflow-hidden"
        title={language === 'ar' ? 'بوصلة التيه (الصدفة)' : 'Serendipity Compass'}
      >
        <div className="absolute inset-0 bg-blue-500/20 blur-md group-hover:bg-purple-500/40 transition-colors"></div>
        <Compass className="w-6 h-6 text-blue-100 relative z-10 group-hover:rotate-180 transition-transform duration-1000" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/40">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
               animate={{ opacity: 1, scale: 1, rotate: 0 }}
               exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
               className="bg-zinc-900 text-zinc-100 w-full max-w-2xl max-h-[85vh] rounded-[32px] p-1 border border-zinc-700 shadow-2xl overflow-hidden relative flex flex-col"
            >
               {/* Background cosmic effect */}
               <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none"></div>
               <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.15),transparent_50%)] pointer-events-none"></div>
               
               <div className="p-6 md:p-8 flex-1 overflow-y-auto min-h-0 relative z-10 no-scrollbar">
                   <div className="flex justify-between items-center mb-8">
                       <h3 className="font-bold text-xl md:text-2xl text-white flex items-center gap-3">
                           <Compass className="text-blue-400 w-8 h-8 animate-[spin_10s_linear_infinite]" />
                           {language === 'ar' ? 'بوصلة التيه' : 'Serendipity Compass'}
                       </h3>
                       <button onClick={() => setIsOpen(false)} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-800 border border-zinc-800">
                           <X className="w-5 h-5" />
                       </button>
                   </div>

                   {isLoading ? (
                       <div className="flex flex-col items-center justify-center py-20">
                           <div className="relative">
                               <div className="w-24 h-24 border-4 border-zinc-800 rounded-full"></div>
                               <Compass className="w-24 h-24 text-blue-500 absolute top-0 left-0 animate-[spin_2s_ease-in-out_infinite]" />
                           </div>
                           <p className="mt-8 text-lg font-bold text-zinc-400 animate-pulse text-center leading-relaxed">
                               {language === 'ar' ? 'نبحث عن أبعد نقطة ممكنة في الكون المعرفي...' : 'Seeking the furthest possible point in the cognitive universe...'}
                           </p>
                       </div>
                   ) : (
                       <div className="space-y-8 animate-in fade-in duration-1000">
                           <div className="text-sm font-bold text-blue-400/80 tracking-widest uppercase mb-4 flex items-center gap-2">
                               <Sparkles className="w-4 h-4" /> 
                               {language === 'ar' ? 'نقطة الانطلاق:' : 'Starting Point:'} <span className="text-white">{contextTopic}</span>
                           </div>
                           <div className="font-serif rtl:font-sans leading-loose text-lg md:text-xl text-zinc-100 [&_p]:text-zinc-100 [&_strong]:text-white [&_strong]:font-bold [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h3]:font-black [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:text-zinc-100 [&_li]:mb-2">
                               <ReactMarkdown>{serendipityPath}</ReactMarkdown>
                           </div>
                       </div>
                   )}
               </div>

               <div className="p-4 border-t border-zinc-800 backdrop-blur-md relative z-10 flex justify-center">
                   <button 
                     onClick={exploreTheUnknown} 
                     disabled={isLoading}
                     className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-colors border border-white/10"
                   >
                       <Shuffle className="w-5 h-5" />
                       {language === 'ar' ? 'ته معي مرة أخرى' : 'Wander Again'}
                   </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
