import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Search, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { proxyGenerateEvidence, type EvidenceEnvelope } from '../../lib/aiProxy';
import { EvidenceBadge } from '../common/EvidenceBadge';

/**
 * KnowledgeEvidencePanel — ask Tebyān's curated knowledge base a question and
 * get an answer grounded in the internal corpus (File Search), with citations
 * and a confidence signal. This is the "Internal Evidence" surface of the
 * Knowledge Center. Degrades gracefully: if grounding is unavailable the
 * backend still answers and the badge reports the real source.
 */
export const KnowledgeEvidencePanel: React.FC<{ language?: 'ar' | 'en' }> = ({ language = 'ar' }) => {
  const [query, setQuery] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [evidence, setEvidence] = React.useState<EvidenceEnvelope | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnswer('');
    setEvidence(null);
    try {
      const instruction = language === 'ar'
        ? 'أنت مرجع معرفي في منصة تبيان. اعتمد حصراً على المصادر المسترجعة من قاعدة تبيان. إن لم تجد سنداً كافياً، قل ذلك بصراحة ولا تُخمّن. أجب بإيجاز منظّم.'
        : 'You are a knowledge reference for Tebyān. Rely strictly on retrieved sources from the Tebyān base. If evidence is insufficient, say so plainly and do not guess. Answer concisely.';
      const { text, evidence: ev } = await proxyGenerateEvidence({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: query }] }],
        config: { systemInstruction: instruction, temperature: 0.3 },
        evidenceMode: 'internal',
      });
      setAnswer(text);
      setEvidence(ev);
    } catch (e) {
      setError(language === 'ar'
        ? 'تعذّر الوصول لقاعدة المعرفة الآن، حاول بعد قليل.'
        : 'Could not reach the knowledge base right now, try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-1" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 text-[#182231]">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-black">
          {language === 'ar' ? 'استناد المعرفة' : 'Grounded Knowledge'}
        </h3>
      </div>
      <p className="text-sm font-semibold text-[#64788D] -mt-2">
        {language === 'ar'
          ? 'اسأل قاعدة تبيان واحصل على جواب مُسند بمصادره ودرجة ثقته.'
          : "Ask Tebyān's base and get an answer backed by its sources and confidence."}
      </p>

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
          placeholder={language === 'ar' ? 'اكتب سؤالك المعرفي...' : 'Type your question...'}
          className={cn(
            'w-full p-5 text-lg font-medium bg-[#F7F5F2] placeholder:text-[#7C8796] rounded-2xl border-2 border-[#8FA9C7]/25 focus:border-emerald-400 outline-none transition-all',
            language === 'ar' ? 'pl-28' : 'pr-28'
          )}
        />
        <button
          onClick={run}
          disabled={loading}
          className={cn(
            'absolute top-2.5 bottom-2.5 px-5 rounded-xl font-bold flex items-center gap-2 transition-all',
            language === 'ar' ? 'left-2.5' : 'right-2.5',
            loading ? 'bg-zinc-200 text-[#64788D] cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
          )}
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="hidden sm:inline">{language === 'ar' ? 'استند' : 'Ground'}</span>
        </button>
      </div>

      {error && <div className="text-rose-500 font-semibold text-sm">{error}</div>}

      {answer && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <EvidenceBadge evidence={evidence} language={language} />
          <div className="markdown-body bg-white rounded-2xl border border-[#8FA9C7]/20 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default KnowledgeEvidencePanel;
