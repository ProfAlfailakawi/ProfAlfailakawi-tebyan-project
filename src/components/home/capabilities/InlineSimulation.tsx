import React, { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Loader2, Send, Square } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { logFunnel } from '../../../services/analyticsService';
import { CapabilityResultCard } from './CapabilityResultCard';
import type { CapabilityContext, CapabilityResult } from '../../../orchestrator/capabilities/types';

type Msg = { role: 'user' | 'ai'; text: string };

const otherPartyLabel = (domain: string, ar: boolean) => {
  switch (domain) {
    case 'parenting':
      return ar ? 'ابنك' : 'your child';
    case 'work':
      return ar ? 'مديرك' : 'your manager';
    case 'relationship':
      return ar ? 'شريك حياتك' : 'your partner';
    default:
      return ar ? 'الطرف الآخر' : 'the other person';
  }
};

type Props = {
  ctx: CapabilityContext;
  onResult?: (r: CapabilityResult) => void;
  onRestart?: () => void;
  onBackToSummary?: () => void;
};

export const InlineSimulation: React.FC<Props> = ({ ctx, onResult, onRestart, onBackToSummary }) => {
  const ar = ctx.language === 'ar';
  const other = otherPartyLabel(ctx.domain, ar);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState<'chat' | 'analyzing' | 'result'>('chat');
  const [analysis, setAnalysis] = useState<CapabilityResult | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logFunnel('inline_simulation_started', ctx.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, phase]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', text: msg }];
    setMessages(next);
    setSending(true);
    try {
      const { generateRoleplayResponse } = await import('../../../services/gemini');
      const reply = await generateRoleplayResponse(ctx.originalQuestion, msg, next, ctx.language);
      setMessages((prev) => [...prev, { role: 'ai', text: String(reply || '') }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: ar
            ? '(تعذّر الرد الآن — واصل وسأحاول مرة أخرى.)'
            : '(Could not reply just now — keep going and I will try again.)',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const endTraining = async () => {
    setPhase('analyzing');
    try {
      const { analyzeRehearsal } = await import('../../../orchestrator/capabilities/services');
      const r = await analyzeRehearsal(messages, ctx);
      setAnalysis(r);
      setPhase('result');
      logFunnel('capability_completed', ctx.language, { capability: 'simulate' });
      onResult?.(r);
    } catch {
      setPhase('result');
    }
  };

  return (
    <div className="rounded-[20px] border border-[#8E7AAE]/16 bg-white/95 p-4 text-right md:p-5" dir={ar ? 'rtl' : 'ltr'}>
      {phase !== 'result' && (
        <>
          <div className="mb-3 rounded-[14px] border border-[#8E7AAE]/14 bg-[#F7F3FA] px-4 py-3">
            <p className="text-[13px] font-black leading-[1.8] text-[#4A3F63]">
              {ar
                ? `أنا الآن ${other}. ابدأ بما ستقوله لي.`
                : `I am now ${other}. Start with what you would say to me.`}
            </p>
          </div>

          {messages.length > 0 && (
            <div className="mb-3 max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-start' : 'justify-end')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-[16px] px-3.5 py-2 text-[13px] font-bold leading-[1.8]',
                      m.role === 'user'
                        ? 'bg-[#182231] text-white'
                        : 'border border-[#8FA9C7]/16 bg-[#FAF9FC] text-[#273548]',
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-end">
                  <div className="rounded-[16px] border border-[#8FA9C7]/16 bg-[#FAF9FC] px-3.5 py-2 text-[#8E7AAE]">
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          <div className="flex items-end gap-2">
            <TextareaAutosize
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              minRows={1}
              maxRows={4}
              placeholder={ar ? 'اكتب ردّك…' : 'Type your reply…'}
              className="min-h-11 flex-1 resize-none rounded-[14px] border border-[#8FA9C7]/20 bg-[#FAF9FC] px-3 py-2.5 text-[14px] font-bold text-[#182231] outline-none focus:border-[#8E7AAE]/50"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!input.trim() || sending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#182231] text-white disabled:opacity-40"
              aria-label={ar ? 'إرسال' : 'Send'}
            >
              <Send className={cn('h-4 w-4', ar ? 'rotate-180' : '')} />
            </button>
          </div>

          {messages.length >= 2 && (
            <button
              type="button"
              onClick={() => void endTraining()}
              disabled={phase === 'analyzing'}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-[13px] border border-[#8FA9C7]/20 bg-white px-4 text-[12px] font-black text-[#64788D] hover:bg-[#F5F3F8]"
            >
              {phase === 'analyzing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              {phase === 'analyzing' ? (ar ? 'أحلّل أداءك…' : 'Analysing…') : ar ? 'إنهاء التدريب' : 'End rehearsal'}
            </button>
          )}
        </>
      )}

      {phase === 'result' && analysis && (
        <div className="space-y-3">
          <CapabilityResultCard result={analysis} language={ctx.language} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setAnalysis(null);
                setPhase('chat');
                onRestart?.();
              }}
              className="min-h-10 rounded-[13px] bg-[#182231] px-4 text-[12px] font-black text-white"
            >
              {ar ? 'جرّب مرة ثانية' : 'Try again'}
            </button>
            <button
              type="button"
              onClick={() => onBackToSummary?.()}
              className="min-h-10 rounded-[13px] border border-[#8FA9C7]/18 bg-white px-4 text-[12px] font-black text-[#465568] hover:bg-[#F7F5FA]"
            >
              {ar ? 'ارجع للخلاصة' : 'Back to summary'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineSimulation;
