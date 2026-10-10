import React from 'react';
import { DemoStarters } from '../../components/ui/DemoStarters';
import { motion } from 'motion/react';
import { Command, RefreshCw, Bookmark, BookmarkCheck, History, FlaskConical, Network } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../AuthProvider';
import { getGenderWord } from '../../utils/genderHelper';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { TebyanLoader, TebyanButtonLoader } from '../ui/TebyanLoader';
import { KnowledgeMemoryService } from '../../services/knowledgeMemoryService';
import { proxyGenerateContent } from '../../lib/aiProxy';
import { ToolEmptyHint } from '../common/ToolEmptyHint';
import { ResultCard } from '../common/ResultCard';

const personas = [
  { id: 'parent', ar: 'الوالد/الوالدة', en: 'Parent/Guardian' },
  { id: 'expert', ar: 'مستشار/ة', en: 'Counselor' },
  { id: 'child', ar: 'طفل/ة', en: 'Child' },
  { id: 'student', ar: 'طالب/ة', en: 'Student' },
  { id: 'senior', ar: 'كبير/ة سن', en: 'Senior' },
  { id: 'government', ar: 'قائد/ة', en: 'Leader' }
];

export const OracleTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const { preferences, addToLibrary, removeFromLibrary } = useUser();
  const { userGender } = useAuth();
  const [input, setInput] = React.useState('');
  const [oraclePersona, setOraclePersona] = React.useState('student');
  const [oracleResult, setOracleResult] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      // Auto-run if prompted from another tab
      setTimeout(() => {
        if (runOracleRef.current) runOracleRef.current();
      }, 300);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue]);

  const runOracleRef = React.useRef<() => void>();

  const handleRunOracle = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const promptInstructed = `${input}\n\nيرجى تقديم الإجابة في نقاط قصيرة ومباشرة وفقرات صغيرة جداً لتسهيل القراءة على الهاتف.`;
      
      const res = await KnowledgeMemoryService.processUnderstanding(
          promptInstructed,
          `أنت مستشار خبير (شخصية: ${oraclePersona}). قدم استشارة شاملة وعميقة ومباشرة.`,
          { temperature: 0.7 },
          async (prompt, instruction, cfg) => {
              const { universalOracle } = await import('../../services/gemini');
              return await universalOracle(prompt, oraclePersona, language) || '';
          }
      );
      
      setOracleResult(res.text || '');
    } catch (err: any) {
      setError(language === 'ar' 
        ? getGenderWord(userGender, "المستشار يتأمل بعمق في سؤالك.. عاود الضغط ليصيغ لك حكمة.", "المستشارة تتأمل بعمق في سؤالكِ.. عاودي الضغط لتصيغ لكِ حكمة.", "المستشار يتأمل بعمق في سؤالك.. عاود الضغط ليصيغ لك حكمة.") 
        : "The counselor is deeply reflecting.. please click again for wisdom.");
    } finally {
      setIsLoading(false);
    }
  };
  
  runOracleRef.current = handleRunOracle;

  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (oracleResult && input.trim() && runOracleRef.current) {
      runOracleRef.current();
    }
  }, [oraclePersona]);

  const handlePersonaChange = (id: string) => {
    setOraclePersona(id);
    setOracleResult('');
    setIsLoading(false);
    setError(null);
  };

  React.useEffect(() => {
    if (!isLoading && oracleResult) {
       setTimeout(() => {
           document.getElementById('oracle-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
    }
  }, [isLoading, oracleResult]);

  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2">
    <TabHeader 
      icon={Command}
      title={{ ar: 'المستشار الكلي', en: 'Omni Counselor' }}
      description={{ 
          ar: 'استشارة شاملة وتحليل استباقي لمنظورك الشخصي.', 
          en: 'Total guidance and predictive analysis for your personal perspective.' 
      }}
      language={language}
      onBack={() => handleTabChange('discover', '')}
      onClose={() => handleTabChange('discover', '', true)}
    />
    <div className="tebyan-tab-surface bg-white rounded-[32px] p-8 border border-[#8FA9C7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-8">
      <div className="flex flex-wrap gap-3 items-center justify-center">
        {personas.map(p => (
          <button
            key={p.id} onClick={() => handlePersonaChange(p.id)}
            title={language === 'ar' ? `تغيير المنظور إلى ${p.ar}` : `Change perspective to ${p.en}`}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer border",
              oraclePersona === p.id 
                ? "bg-[#8E7AAE] text-white border-[#8E7AAE] shadow-[0_8px_30px_rgb(0,0,0,0.04)]" 
                : "bg-white text-ink-soft border-[#8FA9C7]/40 hover:border-zinc-300 hover:text-navy"
            )}
          >
            {language === 'ar' ? p.ar : p.en}
          </button>
        ))}
      </div>
<DemoStarters tab="oracle" language={language} onPick={setInput} className="mb-3" />
      <div className="relative">
        <input 
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          className={cn(
            "w-full p-6 text-xl font-medium bg-[#F7F5F2] placeholder:text-ink-mute rounded-[16px] border border-[#8FA9C7]/40 focus:border-[#8E7AAE] focus:ring-4 focus:ring-[#6e5f8e]/10 outline-none transition-all",
            language === 'ar' ? "pl-32 max-md:!pl-[6.75rem]" : "pr-32 max-md:!pr-[6.75rem]"
          )}
          placeholder={language === 'ar' ? "اسأل تبيان بأي لهجة..." : "Ask Tebyan..."}
        />
        <button 
          onClick={handleRunOracle} 
          disabled={isLoading}
          title={language === 'ar' ? 'تشغيل البحث الذكي' : 'Run smart search'}
          className={cn(
            "tebyan-run-action absolute top-3 bottom-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
            language === 'ar' ? "left-3" : "right-3",
            isLoading ? "bg-zinc-200 text-ink-mute cursor-not-allowed" : "bg-[#8E7AAE] text-white hover:bg-zinc-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
          )}
        >
          {isLoading ? (
            <>
              <TebyanButtonLoader className="text-current" label={language === 'ar' ? 'جاري التفكير' : 'Thinking'} />
              <span className="hidden md:inline">{language === 'ar' ? 'جاري التفكير...' : 'Thinking...'}</span>
            </>
          ) : (
            <span>{language === 'ar' ? 'تشغيل' : 'Run'}</span>
          )}
        </button>
      </div>
      
      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-semibold">{error}</div>}
      <div className="relative min-h-[100px]">
        {!isLoading && !oracleResult && (
          <ToolEmptyHint icon={Command} text={language === 'ar' ? 'اكتب سؤالك، واختر من تريد أن يجيبك، ثم اضغط «تشغيل».' : 'Type your question, pick a perspective, then press Run.'} />
        )}
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-transparent rounded-[16px] flex flex-col items-center justify-center space-y-6 py-20 border border-[#8FA9C7]/40"
          >
            <TebyanLoader
              size={48}
              label={language === 'ar' ? 'جاري تحليل السؤال' : 'Analyzing the question'}
              statusText={language === 'ar' ? 'جاري تحليل سؤالك وترتيب الجواب…' : 'Analyzing your question and composing the answer…'}
            />
          </motion.div>
        ) : oracleResult && (
          <div id="oracle-results" className="space-y-4">
            <ResultCard text={oracleResult} label={language === 'ar' ? 'الجواب' : 'The answer'} />
            {/* Fluid Bridges */}
            <div className="flex flex-wrap gap-2 mt-4">
                 <button onClick={() => handleTabChange('timemachine', input)} className="dna-btn text-sm font-bold">
                     <History className="w-4 h-4 text-lilac" aria-hidden="true" />
                     {language === 'ar' ? getGenderWord(userGender, 'خذ هذه الفكرة لآلة الزمن', 'خذي هذه الفكرة لآلة الزمن', 'خذ هذه الفكرة لآلة الزمن') : 'Take to Time Machine'}
                 </button>
                 <button onClick={() => handleTabChange('simulation', input)} className="dna-btn text-sm font-bold">
                     <FlaskConical className="w-4 h-4 text-lilac" aria-hidden="true" />
                     {language === 'ar' ? getGenderWord(userGender, 'اختبرها في المحاكي', 'اختبريها في المحاكي', 'اختبرها في المحاكي') : 'Test in Simulator'}
                 </button>
                 <button onClick={() => handleTabChange('mindmap', input)} className="dna-btn text-sm font-bold">
                     <Network className="w-4 h-4 text-lilac" aria-hidden="true" />
                     {language === 'ar' ? getGenderWord(userGender, 'فككها في الخريطة الذهنية', 'فككيها في الخريطة الذهنية', 'فككها في الخريطة الذهنية') : 'Breakdown in Mindmap'}
                 </button>
            </div>
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => {
                  const item = { 
                    id: `oracle-${Date.now()}`, 
                    type: 'oracle', 
                    question: input,
                    content: oracleResult,
                    persona: oraclePersona
                  };
                  const isSaved = preferences.savedLibrary.some(s => s.content === oracleResult);
                  if (isSaved) {
                    const savedItem = preferences.savedLibrary.find(s => s.content === oracleResult);
                    if (savedItem) removeFromLibrary(savedItem);
                  } else {
                    addToLibrary(item, 'oracle');
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all",
                  preferences.savedLibrary.some(s => s.content === oracleResult)
                    ? "bg-[#8E7AAE] text-white"
                    : "bg-[#F1EEF4] text-ink-soft hover:bg-zinc-200"
                )}
              >
                {preferences.savedLibrary.some(s => s.content === oracleResult) ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>{language === 'ar' ? 'محفوظ' : 'Saved'}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إضافة للمكتبة' : 'Save to Library'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </motion.div>
)});

