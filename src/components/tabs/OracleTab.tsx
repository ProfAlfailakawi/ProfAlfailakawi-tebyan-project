import React from 'react';
import { motion } from 'motion/react';
import { Command, RefreshCw, Bookmark, BookmarkCheck } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../AuthProvider';
import { getGenderWord } from '../../utils/genderHelper';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { TabHeader } from '../TabHeader';
import { KnowledgeMemoryService } from '../../services/knowledgeMemoryService';
import { proxyGenerateContent, proxyGenerateEvidence, type EvidenceEnvelope } from '../../lib/aiProxy';
import { EvidenceBadge } from '../common/EvidenceBadge';
import { ShieldCheck, Globe } from 'lucide-react';

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
  const [evidenceMode, setEvidenceMode] = React.useState<'off' | 'internal' | 'web'>('off');
  const [evidence, setEvidence] = React.useState<EvidenceEnvelope | null>(null);

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
    setEvidence(null);
    try {
      const promptInstructed = `${input}\n\nيرجى تقديم الإجابة في نقاط قصيرة ومباشرة وفقرات صغيرة جداً لتسهيل القراءة على الهاتف.`;

      // Evidence Mode: ground the answer in Tebyān's base or the live web,
      // returning citations + provenance. Bypasses the local memory cache path
      // so the shown source badge reflects the real grounding of THIS answer.
      if (evidenceMode !== 'off') {
        const instruction = language === 'ar'
          ? `أنتِ "تبيان" مستشارة خبيرة (المنظور: ${oraclePersona}). اعتمد حصراً على المصادر المسترجعة. إذا لم تجد سنداً كافياً قل ذلك بوضوح بدل التخمين. أجب بنقاط قصيرة وفقرات صغيرة.`
          : `You are "Tibyān", an expert counselor (perspective: ${oraclePersona}). Rely strictly on the retrieved sources. If evidence is insufficient, say so instead of guessing. Answer in short points.`;
        const { text, evidence: ev } = await proxyGenerateEvidence({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: promptInstructed }] }],
          config: { systemInstruction: instruction, temperature: 0.4 },
          evidenceMode: evidenceMode === 'web' ? 'web' : 'internal',
        });
        setOracleResult(text || '');
        setEvidence(ev);
        setIsLoading(false);
        return;
      }

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
    <div className="bg-white rounded-[32px] p-8 border border-[#8FA9C7]/25/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-8">
      <div className="flex flex-wrap gap-3 items-center justify-center">
        {personas.map(p => (
          <button
            key={p.id} onClick={() => handlePersonaChange(p.id)}
            title={language === 'ar' ? `تغيير المنظور إلى ${p.ar}` : `Change perspective to ${p.en}`}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer border",
              oraclePersona === p.id 
                ? "bg-[#8E7AAE] text-white border-[#8E7AAE] shadow-[0_8px_30px_rgb(0,0,0,0.04)]" 
                : "bg-white text-[#465568] border-[#8FA9C7]/25/80 hover:border-zinc-300 hover:text-[#182231]"
            )}
          >
            {language === 'ar' ? p.ar : p.en}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-center">
        <span className="text-xs font-bold text-[#7C8796]">
          {language === 'ar' ? 'وضع الإسناد:' : 'Evidence Mode:'}
        </span>
        {([
          { id: 'off', ar: 'إيقاف', en: 'Off', icon: null },
          { id: 'internal', ar: 'قاعدة تبيان', en: 'Tebyān base', icon: ShieldCheck },
          { id: 'web', ar: 'الويب الحالي', en: 'Live web', icon: Globe },
        ] as const).map((m) => {
          const M = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setEvidenceMode(m.id)}
              title={language === 'ar' ? `وضع الإسناد: ${m.ar}` : `Evidence: ${m.en}`}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border',
                evidenceMode === m.id
                  ? 'bg-[#182231] text-white border-[#182231]'
                  : 'bg-white text-[#465568] border-[#8FA9C7]/25 hover:border-zinc-300'
              )}
            >
              {M && <M className="w-3.5 h-3.5" />}
              {language === 'ar' ? m.ar : m.en}
            </button>
          );
        })}
      </div>
      <div className="relative">
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          className={cn(
            "w-full p-6 text-xl font-medium bg-[#F7F5F2] placeholder:text-[#7C8796] rounded-[16px] border-2 border-[#8FA9C7]/25/80 focus:border-[#8E7AAE] focus:ring-4 focus:ring-zinc-100 outline-none transition-all",
            language === 'ar' ? "pl-32" : "pr-32"
          )}
          placeholder={language === 'ar' ? "اسأل تبيان بأي لهجة..." : "Ask Tebyan..."}
        />
        <button 
          onClick={handleRunOracle} 
          disabled={isLoading}
          title={language === 'ar' ? 'تشغيل البحث الذكي' : 'Run smart search'}
          className={cn(
            "absolute top-3 bottom-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
            language === 'ar' ? "left-3" : "right-3",
            isLoading ? "bg-zinc-200 text-[#64788D] cursor-not-allowed" : "bg-[#8E7AAE] text-white hover:bg-zinc-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
          )}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="hidden md:inline">{language === 'ar' ? 'جاري التفكير...' : 'Thinking...'}</span>
            </>
          ) : (
            <span>{language === 'ar' ? 'تشغيل' : 'Run'}</span>
          )}
        </button>
      </div>
      
      {error && <div className="text-rose-500 font-semibold">{error}</div>}
      <div className="relative min-h-[100px]">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-transparent rounded-[16px] flex flex-col items-center justify-center space-y-6 py-20 border border-[#8FA9C7]/25/80"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#8FA9C7]/25/80 rounded-full"></div>
              <RefreshCw className="w-16 h-16 text-[#182231] animate-spin absolute top-0 left-0" />
            </div>
            <div className="text-xl font-semibold text-[#465568]">
              {language === 'ar' ? 'جاري استحضار الإجابة...' : 'Summoning the answer...'}
            </div>
          </motion.div>
        ) : oracleResult && (
          <div id="oracle-results" className="space-y-4">
            {evidence && (
              <EvidenceBadge evidence={evidence} language={language} className="px-1" />
            )}
            <div className="markdown-body p-8 border border-[#8FA9C7]/25/80 rounded-[16px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
              <ReactMarkdown>{oracleResult}</ReactMarkdown>
            </div>
            {/* Fluid Bridges */}
            <div className="flex flex-wrap gap-2 mt-4">
                 <button onClick={() => handleTabChange('timemachine', input)} className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                     <Command className="w-4 h-4" />
                     {language === 'ar' ? getGenderWord(userGender, 'خذ هذه الفكرة لآلة الزمن', 'خذي هذه الفكرة لآلة الزمن', 'خذ هذه الفكرة لآلة الزمن') : 'Take to Time Machine'}
                 </button>
                 <button onClick={() => handleTabChange('simulation', input)} className="px-4 py-2 bg-[#EEF4F1] text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                     <Command className="w-4 h-4" />
                     {language === 'ar' ? getGenderWord(userGender, 'اختبرها في المحاكي', 'اختبريها في المحاكي', 'اختبرها في المحاكي') : 'Test in Simulator'}
                 </button>
                 <button onClick={() => handleTabChange('mindmap', input)} className="px-4 py-2 bg-[#F6F0E3] text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                     <Command className="w-4 h-4" />
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
                    : "bg-[#F1EEF4] text-[#465568] hover:bg-zinc-200"
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

