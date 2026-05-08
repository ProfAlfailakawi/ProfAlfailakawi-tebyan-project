import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, Bookmark, BookmarkCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '../../contexts/UserContext';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';

interface ConceptsTabProps {
  input: string;
  setInput: (val: string) => void;
  output: string;
  isLoading: boolean;
  handleSimplify: () => void;
  language: 'ar' | 'en';
}

export const ConceptsTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const { preferences, addToLibrary, removeFromLibrary } = useUser();
  const [input, setInput] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [isBrutalMode, setIsBrutalMode] = React.useState(false);

  const handleSimplify = async (overrideInput?: string, brutalMode = false) => {
    const activeInput = overrideInput || input;
    if (!activeInput.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setIsBrutalMode(brutalMode);
    try {
      if (brutalMode) {
        const { universalOracle } = await import('../../services/gemini');
        const prompt = language === 'ar' 
          ? `أنت الآن "المحامي الشيطاني المتوحش". قاسي، مجرد من العواطف، ومنطقي لأبعد حد. مهمتك هي: 1. إيجاد الثغرات المنطقية. 2. تدمير الخطة وإظهار نقاط ضعفها. 3. لا تجامل أبداً. حلل هذه الفكرة وحطمها: ${activeInput}`
          : `You are now "The Brutal Devil's Advocate". Harsh, emotionless, and purely logical. Your mission: 1. Find logical loopholes. 2. Destroy this plan and show its weaknesses. 3. NEVER sugarcoat. Analyze and destroy this idea: ${activeInput}`;
        
        const content = await universalOracle(prompt, 'Brutal Advocate', language);
        setOutput(content);
      } else {
        const { simplifyConcept } = await import('../../services/gemini');
        const res = await simplifyConcept(activeInput);
        setOutput(res);
      }
    } catch (err: any) {
      setError("يبدو أن الفكرة تحتاج لحظة إضافية… جرّب مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialValue && !output && !isLoading) {
      setInput(initialValue);
      // Auto-run simplify
      handleSimplify(initialValue, false);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue, output, isLoading, onValueUsed]);

  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2">
    <TabHeader 
      icon={Sparkles}
      title={{ ar: 'هندسة الأفكار', en: 'Idea Engineering' }}
      description={{ 
          ar: 'تبسيط المفاهيم المعقدة واختزالها في أفكار واضحة وممنهجة يسهل فهمها ونقلها.', 
          en: 'Simplify complex concepts and condense them into clear, structured ideas that are easy to understand and share.' 
      }}
      language={language}
      onBack={() => handleTabChange('discover', '')}
      onClose={() => handleTabChange('discover', '', true)}
    />
    <div className={cn("rounded-[32px] p-8 border shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-6 transition-all duration-700", isBrutalMode ? "bg-black border-red-900/50" : "bg-white border-zinc-200/80")}>
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 mb-4">
        <h2 className={cn("text-xl font-black tracking-tight", isBrutalMode ? "text-red-500" : "text-black")}>{language === 'ar' ? 'المدخلات' : 'Input'}</h2>
      </div>
      <textarea 
        value={input} onChange={(e) => setInput(e.target.value)}
        className={cn("w-full p-6 h-40 rounded-[16px] border focus:ring-4 outline-none font-medium transition-all resize-none", isBrutalMode ? "bg-zinc-900 border-red-900/40 text-red-100 placeholder:text-red-900 focus:border-red-600 focus:ring-red-900/50" : "bg-zinc-50 border-zinc-200/80 text-black focus:border-black focus:ring-zinc-100 placeholder:text-zinc-400")}
        placeholder={language === 'ar' ? "أدخل المفهوم المعقد هنا..." : "Enter complex concept here..."}
      />
      <div className="flex gap-4">
        <button 
          onClick={() => handleSimplify()} 
          disabled={isLoading}
          className={cn(
            "flex-1 py-4 rounded-xl font-semibold text-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all flex items-center justify-center gap-3",
            isLoading ? "bg-zinc-200 text-zinc-500 cursor-not-allowed" : "bg-black text-white hover:bg-zinc-900 cursor-pointer"
          )}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{language === 'ar' ? 'جاري التبسيط...' : 'Simplifying...'}</span>
            </>
          ) : (
            <span>{language === 'ar' ? 'بسط المفهوم الآن' : 'Simplify Now'}</span>
          )}
        </button>
        <button 
          onClick={() => handleSimplify(undefined, true)} 
          disabled={isLoading}
          className={cn(
            "flex-1 py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3",
            isLoading ? "bg-red-950 text-red-800 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)] cursor-pointer"
          )}
        >
          {isLoading && isBrutalMode ? (
             <RefreshCw className="w-5 h-5 animate-spin" />
          ) : null}
          <span>{language === 'ar' ? 'حطّم فكرتي 🩸' : 'Destroy My Idea 🩸'}</span>
        </button>
      </div>
      {error && <div className="text-rose-500 font-semibold">{error}</div>}
      <div className="relative min-h-[100px]">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-zinc-50 rounded-[16px] flex flex-col items-center justify-center space-y-6 py-20 border border-zinc-200/80"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-200/80 rounded-full"></div>
              <RefreshCw className="w-16 h-16 text-black animate-spin absolute top-0 left-0" />
            </div>
            <div className="text-xl font-semibold text-zinc-600">
              {language === 'ar' ? 'جاري اختزال المفهوم وتبسيطه...' : 'Simplifying logic...'}
            </div>
          </motion.div>
        ) : output && (
          <div className="space-y-4">
            <div className={cn("prose md:prose-lg p-8 rounded-[16px] overflow-hidden border shadow-[0_2px_8px_rgba(0,0,0,0.04)]", isBrutalMode ? "bg-zinc-950 border-red-900/30 text-zinc-300 prose-invert prose-headings:text-rose-400 prose-strong:text-rose-200 prose-ol:text-zinc-600 prose-ul:text-zinc-600 prose-li:marker:text-rose-600 prose-a:text-red-400 leading-relaxed font-serif rtl:font-sans py-8" : "bg-white border-zinc-200/80 prose-zinc font-serif rtl:font-sans py-8 leading-relaxed text-zinc-800")}>
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
            <button 
              onClick={() => {
                const isSaved = preferences.savedLibrary.some((s: any) => s.type === 'concept' && s.content === output);
                if (isSaved) {
                  const itemToRemove = preferences.savedLibrary.find((s: any) => s.type === 'concept' && s.content === output);
                  if (itemToRemove) removeFromLibrary(itemToRemove);
                } else {
                  addToLibrary({
                    id: `concept-${Date.now()}`,
                    type: 'concept',
                    question: input,
                    content: output,
                    timestamp: new Date().toISOString()
                  }, 'concept');
                }
              }}
              className={cn(
                "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                preferences.savedLibrary.some((s: any) => s.type === 'concept' && s.content === output)
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {preferences.savedLibrary.some((s: any) => s.type === 'concept' && s.content === output) ? (
                <><BookmarkCheck className="w-5 h-5" /> {language === 'ar' ? 'محفوظ في المكتبة' : 'Saved to Library'}</>
              ) : (
                <><Bookmark className="w-5 h-5" /> {language === 'ar' ? 'حفظ في المكتبة' : 'Save to Library'}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  </motion.div>
)});
