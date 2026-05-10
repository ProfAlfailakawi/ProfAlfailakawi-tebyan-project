import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, RefreshCw, Zap, MessageCircle, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateRoleplayResponse, generateRoleplayRadar } from '../../services/gemini';
import { TabHeader } from '../TabHeader';

export const SimulationTab = React.memo(({ language, initialValue, onValueUsed, handleTabChange }: { language: 'ar' | 'en', initialValue?: string, onValueUsed?: () => void, handleTabChange: any }) => {
  const [simMode, setSimMode] = useState<'decision' | 'roleplay'>('decision');
  
  // Decision Simulation State
  const [simTopic, setSimTopic] = useState('');
  const [simulation, setSimulation] = useState<any>(null);
  const [simFeedback, setSimFeedback] = useState<any>(null);
  
  // Roleplay Simulation State
  const [rpTopic, setRpTopic] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [rpRadar, setRpRadar] = useState<any>(null);
  const [isRoleplaying, setIsRoleplaying] = useState(false);

  const startDecisionSimulation = async (topicToUse?: string) => {
    const topic = topicToUse || simTopic;
    if (!topic.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const { generateSimulation } = await import('../../services/gemini');
      const s = await generateSimulation(topic, language);
      setSimulation(s);
      setSimFeedback(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startRoleplay = (topic?: string) => {
    const activeTopic = topic || rpTopic;
    if (!activeTopic.trim()) return;
    setChatHistory([]);
    setRpRadar(null);
    setIsRoleplaying(true);
    // Add an initial greeting from the AI child, but make it context-aware
    handleRoleplaySend(language === 'ar' 
      ? 'ابدأ المحادثة فورا دون مقدمات، وبناء على الموقف، باشر بالحديث بشكل مباشر (سواء بهجوم أو رد فعل غاضب أو سؤال مستفز).' 
      : 'Start the conversation immediately based on the situation with an aggressive or provocative start without intro.', activeTopic);
  };

  React.useEffect(() => {
    if (initialValue && chatHistory.length === 0 && !isRoleplaying && !isLoading && !simulation) {
      setSimTopic(initialValue);
      setRpTopic(initialValue);
      setSimMode('decision'); // Default simulator mode
      startDecisionSimulation(initialValue);
      if (onValueUsed) onValueUsed();
    }
  }, [initialValue]);

  const handleRoleplaySend = async (overrideMessage?: string, overrideTopic?: string) => {
    const msg = overrideMessage || currentMessage;
    const activeTopic = overrideTopic || rpTopic;
    if (!msg.trim() || !activeTopic.trim() || isLoading) return;
    
    let newHistory = [...chatHistory];
    if (!overrideMessage) {
       newHistory.push({ role: 'user', text: msg });
       setChatHistory(newHistory);
       setCurrentMessage('');
    }

    setIsLoading(true);
    try {
       const aiRes = await generateRoleplayResponse(activeTopic, msg, newHistory, language);
       setChatHistory(prev => [...prev, { role: 'ai', text: aiRes }]);
    } catch (err: any) {
       setError(err.message);
    } finally {
       setIsLoading(false);
    }
  };

  const endRoleplayAndAnalyze = async () => {
    setIsLoading(true);
    try {
      const radar = await generateRoleplayRadar(chatHistory, language);
      setRpRadar(radar);
      setIsRoleplaying(false);
      
      try {
          const memoryContext = {
              type: 'roleplay',
              topic: rpTopic,
              radar,
              chatSummary: chatHistory.length > 2 ? chatHistory.slice(-2) : chatHistory,
              date: new Date().toISOString()
          };
          localStorage.setItem('tibyan_cognitive_memory', JSON.stringify(memoryContext));
      } catch(e) {}
      
    } catch(err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 px-2">
     <TabHeader 
       icon={Gamepad2}
       title={{ ar: 'المحاكي الميداني', en: 'Field Simulator' }}
       description={{ 
           ar: 'تدرب على اتخاذ القرارات أو تقمص الأدوار في مواقف وسيناريوهات حقيقية لصقل مهاراتك الاستراتيجية والتواصلية.', 
           en: 'Practice decision-making or role-playing in real educational and pedagogical situations to hone your skills.' 
       }}
       language={language}
       onBack={() => handleTabChange('discover', '')}
       onClose={() => handleTabChange('discover', '', true)}
     />
     <div className="flex bg-white/50 backdrop-blur-md rounded-full shadow-sm p-1 max-w-[400px] mx-auto border border-zinc-200">
        <button onClick={() => setSimMode('decision')} className={cn("flex-1 py-3 px-4 rounded-full font-bold transition-all", simMode === 'decision' ? "bg-black text-white shadow-md block" : "text-zinc-500 hover:bg-zinc-100 block")}>
           {language === 'ar' ? 'نموذج القرار' : 'Decision Model'}
        </button>
        <button onClick={() => setSimMode('roleplay')} className={cn("flex-1 py-3 px-4 rounded-full font-bold transition-all", simMode === 'roleplay' ? "bg-rose-500 text-white shadow-md block" : "text-zinc-500 hover:bg-zinc-100 block")}>
           {language === 'ar' ? 'تقمص الأدوار المباشر' : 'Live Roleplay'}
        </button>
     </div>

     <div 
        className="bg-white p-5 md:p-8 lg:p-12 rounded-[24px] md:rounded-[32px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-blue-100 space-y-8 relative overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            if (simFeedback) setSimFeedback(null);
            else if (rpRadar) setRpRadar(null);
            else if (simulation) setSimulation(null);
            else if (isRoleplaying) setIsRoleplaying(false);
          }
        }}
      >
        
        {/* DECISION MODE */}
        {simMode === 'decision' && (
          <>
            {isLoading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center space-y-6 py-20">
                <div className="relative">
                  <div className="w-20 h-20 border-8 border-zinc-100 rounded-full"></div>
                  <RefreshCw className="w-20 h-20 text-black animate-spin absolute top-0 left-0" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-black text-center">
                  {language === 'ar' ? 'جاري بناء المحاكاة...' : 'Building simulation...'}
                </div>
              </motion.div>
            ) : !simulation ? (
              <div className="space-y-6">
                <p className="text-zinc-500 font-bold">{language === 'ar' ? 'أدخل تحدياً تعليمياً وسأقوم بوضعك في موقف يتطلب قراراً حكيماً.' : 'Enter an educational challenge and I will put you in a situation that requires a wise decision.'}</p>
                <div className="flex flex-col md:flex-row gap-4 w-full">
                  <input 
                    value={simTopic} 
                    onChange={(e) => setSimTopic(e.target.value)} 
                    className="flex-1 w-full p-4 md:p-6 text-base md:text-xl font-bold border-2 rounded-[16px] outline-none focus:border-blue-500" 
                    placeholder={language === 'ar' ? "مثال: دمج الأجهزة المحمولة..." : "Example: Integrating mobile devices..."} 
                  />
                  <button onClick={() => startDecisionSimulation()} disabled={isLoading || !simTopic.trim()} className="w-full md:w-auto px-10 py-4 rounded-[16px] bg-black text-white hover:bg-zinc-800 font-bold shadow-lg transition-all cursor-pointer">
                    {language === 'ar' ? 'بدء' : 'Start'}
                  </button>
                </div>
                {error && <div className="text-rose-500 font-bold">{error}</div>}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="p-8 bg-blue-50 rounded-[24px] md:rounded-[32px] border-2 border-blue-100">
                  <h3 className="text-2xl font-bold text-blue-900 leading-relaxed">{simulation.scenario}</h3>
                </div>
                
                {!simFeedback ? (
                  <div className="grid gap-4">
                    {simulation.decisions?.map((decision: any, i: number) => (
                      <button key={i} onClick={() => {
                         setSimFeedback(decision);
                         try {
                           const memoryContext = {
                               type: 'decision',
                               topic: simTopic,
                               action: decision.action,
                               consequence: decision.consequence,
                               isCorrect: decision.isCorrect,
                               insight: decision.insight,
                               date: new Date().toISOString()
                           };
                           localStorage.setItem('tibyan_cognitive_memory', JSON.stringify(memoryContext));
                         } catch(e) {}
                         if (decision.isCorrect) {
                           window.dispatchEvent(new CustomEvent('add_xp', { detail: { amount: 150 } }));
                         } else {
                           window.dispatchEvent(new CustomEvent('add_xp', { detail: { amount: 50 } }));
                         }
                      }} className="group p-6 text-right bg-white border border-zinc-200/80 rounded-[16px] hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                        <div className="flex items-center justify-between font-bold">
                           <span className="text-xl text-zinc-700 group-hover:text-blue-700">{decision.choice}</span>
                           <Zap className="w-5 h-5 text-zinc-300 group-hover:text-blue-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                     <div className={cn("p-8 rounded-[24px] md:rounded-[32px] border-4", simFeedback.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-orange-50 border-orange-200")}>
                        <h4 className="text-2xl font-bold mb-4">{simFeedback.isCorrect ? (language === 'ar' ? 'أحسنتم!' : 'Well Done!') : (language === 'ar' ? 'تحليل النتيجة' : 'Result Analysis')}</h4>
                        <p className="text-lg font-bold text-zinc-700 leading-relaxed">{simFeedback.impact}</p>
                     </div>
                     <button onClick={() => setSimFeedback(null)} className="w-full py-4 bg-black text-white rounded-[16px] font-bold">
                       {language === 'ar' ? 'تجربة قرار آخر' : 'Try another decision'}
                     </button>
                  </motion.div>
                )}
                <div className="flex justify-center mt-4">
                  <button onClick={() => setSimulation(null)} className="text-zinc-400 font-bold hover:underline">
                    {language === 'ar' ? 'بدء محاكاة جديدة' : 'Start New Simulation'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ROLEPLAY MODE */}
        {simMode === 'roleplay' && (
           <>
              {!isRoleplaying && !rpRadar ? (
                 <div className="space-y-6">
                    <p className="text-zinc-500 font-bold">{language === 'ar' ? 'بدل قراءة النصائح، تدرب عليها. سأتقمص أنا دور الطرف الصعب أو التحدي المعقد في معادلتك، وحاول أنت إدارة الموقف بالحوار والقرارات.' : 'Practice instead of reading. I will roleplay the difficult counterpart, and you try to manage the situation via dialogue and decisions.'}</p>
                    
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <input 
                        value={rpTopic} 
                        onChange={(e) => setRpTopic(e.target.value)} 
                        disabled={isLoading}
                        className="flex-1 w-full p-4 md:p-6 text-base md:text-xl font-bold border-2 rounded-[16px] outline-none focus:border-rose-500 disabled:opacity-50" 
                        placeholder={language === 'ar' ? "مثال: مراهق يرفض المذاكرة بحجة أن المؤثرين أثرياء بدون تعليم..." : "e.g. Teen refusing to study because influencers are rich..."} 
                      />
                      <button onClick={() => startRoleplay()} disabled={isLoading || !rpTopic.trim()} className="w-full md:w-auto px-10 py-4 rounded-[16px] bg-rose-500 text-white hover:bg-rose-600 font-bold shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all cursor-pointer">
                        {isLoading ? (language === 'ar' ? 'جاري التحضير...' : 'Preparing...') : (language === 'ar' ? 'دخول المواجهة' : 'Enter Confrontation')}
                      </button>
                    </div>
                    {error && <div className="text-rose-500 font-bold text-center mt-4 bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}
                 </div>
              ) : isRoleplaying ? (
                 <div className="flex flex-col h-[500px]">
                    <div className="flex justify-between items-center bg-rose-50 p-4 rounded-t-[24px] border border-rose-100">
                       <div className="font-bold text-rose-800 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                         {language === 'ar' ? 'المحاكاة جارية...' : 'Simulation Active...'}
                       </div>
                       <button onClick={endRoleplayAndAnalyze} className="text-sm bg-black text-white px-4 py-2 rounded-xl font-bold hover:bg-zinc-800">
                          {language === 'ar' ? 'إنهاء وتحليل' : 'End & Analyze'}
                       </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50 border-x border-zinc-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                       {chatHistory.map((msg, i) => (
                         <motion.div 
                           key={i} 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className={cn("flex", msg.role === 'user' ? (language === 'ar' ? "mr-auto" : "ml-auto") : (language === 'ar' ? "ml-auto" : "mr-auto"))}
                         >
                            <div className={cn(
                               "max-w-[80%] p-4 rounded-[20px] font-bold leading-relaxed",
                               msg.role === 'user' ? "bg-black text-white rounded-br-none" : "bg-white text-zinc-800 border border-zinc-200 rounded-bl-none shadow-sm"
                            )}>
                               {msg.text}
                            </div>
                         </motion.div>
                       ))}
                       {isLoading && (
                         <div className={cn("flex", language === 'ar' ? "ml-auto" : "mr-auto")}>
                           <div className="bg-white p-4 rounded-[20px] border border-zinc-200 flex items-center gap-2">
                              <div className="flex gap-1">
                                 <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                 <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                 <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                           </div>
                         </div>
                       )}
                       {error && <div className="text-rose-500 font-bold text-center bg-rose-50 p-2 rounded-lg">{error}</div>}
                    </div>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleRoleplaySend(); }} className="flex gap-2 p-4 bg-white border border-zinc-200 rounded-b-[24px]">
                       <input 
                         value={currentMessage}
                         onChange={e => setCurrentMessage(e.target.value)}
                         disabled={isLoading}
                         placeholder={language === 'ar' ? "تحدث بحكمة..." : "Speak wisely..."}
                         className="flex-1 bg-zinc-100 rounded-xl px-4 font-bold outline-none focus:ring-2 focus:ring-rose-500/50 focus:bg-white transition-all"
                       />
                       <button type="submit" disabled={isLoading || !currentMessage.trim()} className="bg-rose-500 text-white p-4 rounded-xl hover:bg-rose-600 disabled:opacity-50">
                          <Send className="w-5 h-5" />
                       </button>
                    </form>
                 </div>
              ) : rpRadar ? (
                 <div className="space-y-8 animate-in fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="text-center space-y-2">
                       <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
                       <h2 className="text-3xl font-black text-black">{language === 'ar' ? 'الرادار التحليلي للسلوك' : 'Behavioral Radar'}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-emerald-50 p-6 rounded-[24px] text-center border border-emerald-100">
                          <div className="text-3xl font-black text-emerald-600 mb-2">{rpRadar.emotional_intelligence}%</div>
                          <div className="font-bold text-emerald-800">{language === 'ar' ? 'الذكاء العاطفي' : 'EQ'}</div>
                       </div>
                       <div className="bg-blue-50 p-6 rounded-[24px] text-center border border-blue-100">
                          <div className="text-3xl font-black text-blue-600 mb-2">{rpRadar.patience}%</div>
                          <div className="font-bold text-blue-800">{language === 'ar' ? 'مستوى الصبر' : 'Patience'}</div>
                       </div>
                       <div className="bg-indigo-50 p-6 rounded-[24px] text-center border border-indigo-100">
                          <div className="text-3xl font-black text-indigo-600 mb-2">{rpRadar.containment}%</div>
                          <div className="font-bold text-indigo-800">{language === 'ar' ? 'القدرة على الاحتواء' : 'Containment'}</div>
                       </div>
                    </div>
                    
                    <div className="bg-white border rounded-[24px] p-6 md:p-8 space-y-6 shadow-sm">
                       <div>
                         <h4 className="font-black text-rose-500 flex items-center gap-2 mb-3"><Zap className="w-5 h-5" />{language === 'ar' ? 'كلمات أشعلت الموقف' : 'Triggering Words'}</h4>
                         <div className="flex flex-wrap gap-2">
                            {rpRadar.triggered_words?.map((w: string, i: number) => <span key={i} className="bg-rose-50 text-rose-700 font-bold px-3 py-1 rounded-lg border border-rose-200">{w}</span>)}
                            {(!rpRadar.triggered_words || rpRadar.triggered_words.length === 0) && <span className="text-zinc-400">{language === 'ar' ? 'لا يوجد' : 'None'}</span>}
                         </div>
                       </div>
                       <div>
                         <h4 className="font-black text-emerald-500 flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5" />{language === 'ar' ? 'كلمات طمأنت الطرف الآخر' : 'Comforting Words'}</h4>
                         <div className="flex flex-wrap gap-2">
                            {rpRadar.comforting_words?.map((w: string, i: number) => <span key={i} className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-lg border border-emerald-200">{w}</span>)}
                            {(!rpRadar.comforting_words || rpRadar.comforting_words.length === 0) && <span className="text-zinc-400">{language === 'ar' ? 'لا يوجد' : 'None'}</span>}
                         </div>
                       </div>
                    </div>

                    <div className="bg-black text-white p-6 md:p-8 rounded-[24px]">
                       <h4 className="font-bold text-zinc-400 mb-3 uppercase text-sm tracking-widest">{language === 'ar' ? 'الخلاصة التقييمية' : 'Executive Summary'}</h4>
                       <p className="text-lg md:text-xl font-bold leading-relaxed indent-4">{rpRadar.summary}</p>
                    </div>

                    <div className="flex justify-center">
                       <button onClick={() => {setRpRadar(null); setRpTopic('');}} className="font-bold text-black hover:underline cursor-pointer">
                          {language === 'ar' ? 'محاكاة جديدة' : 'New Simulation'}
                       </button>
                    </div>
                 </div>
              ) : null}
           </>
        )}
     </div>
  </motion.div>
)});

